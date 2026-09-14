(function () {
  let user = null;
  let documentData = null;
  let saveTimer = null;
  let saveInFlight = false;
  let saveRequestedWhileBusy = false;
  let lastSavedSnapshot = '';
  let savedRange = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const docsApi = window.MonEcritDocuments;

  function getDocumentId() {
    return new URLSearchParams(location.search).get('id');
  }

  function setStatus(text, state = 'saved') {
    const el = $('#save-status');
    el.textContent = text;
    el.dataset.state = state;
  }

  function plainText() {
    return ($('#editor').innerText || '').replace(/\u00a0/g, ' ');
  }

  function computeCounts() {
    const text = plainText();
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/u).filter(Boolean).length : 0;
    const chars = text.length;
    const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 220));
    return { words, chars, minutes };
  }

  function updateCounter() {
    const { words, chars, minutes } = computeCounts();
    $('#word-count').textContent = `${words.toLocaleString('fr-FR')} mot${words > 1 ? 's' : ''}`;
    $('#char-count').textContent = `${chars.toLocaleString('fr-FR')} caractère${chars > 1 ? 's' : ''}`;
    $('#reading-time').textContent = `${minutes} min de lecture`;
    return { words, chars };
  }

  function snapshot() {
    const counts = computeCounts();
    return JSON.stringify({
      title: ($('#document-title').value || '').trim() || 'Sans titre',
      content: $('#editor').innerHTML,
      word_count: counts.words,
      character_count: counts.chars,
    });
  }

  function queueSave() {
    if (!documentData) return;
    const current = snapshot();
    const parsed = JSON.parse(current);
    docsApi.writeLocalDraft(user.id, { id: documentData.id, ...parsed });
    setStatus('Modifications locales', 'local');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 900);
  }

  async function saveNow() {
    if (!documentData || !navigator.onLine) {
      setStatus('Hors connexion · enregistré localement', 'local');
      return;
    }
    const currentSnapshot = snapshot();
    if (currentSnapshot === lastSavedSnapshot) {
      setStatus('Sauvegardé', 'saved');
      return;
    }
    if (saveInFlight) {
      saveRequestedWhileBusy = true;
      return;
    }

    saveInFlight = true;
    setStatus('Sauvegarde…', 'saving');
    const payload = JSON.parse(currentSnapshot);
    try {
      documentData = await docsApi.updateDocument(documentData.id, payload);
      lastSavedSnapshot = currentSnapshot;
      docsApi.clearLocalDraft(user.id, documentData.id);
      setStatus('Sauvegardé', 'saved');
    } catch (error) {
      console.error(error);
      setStatus('Impossible de sauvegarder · copie locale conservée', 'error');
    } finally {
      saveInFlight = false;
      if (saveRequestedWhileBusy) {
        saveRequestedWhileBusy = false;
        saveNow();
      }
    }
  }

  function exec(command, value = null) {
    $('#editor').focus();
    document.execCommand(command, false, value);
    queueSave();
  }

  function setBlock(tag) {
    exec('formatBlock', tag);
  }

  function rememberSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if ($('#editor').contains(range.commonAncestorContainer)) savedRange = range.cloneRange();
  }

  function restoreSelection() {
    if (!savedRange) return false;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
    return true;
  }

  function insertCharacter(character) {
    $('#editor').focus();
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(character);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    rememberSelection();
    $('#editor').dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: character }));
  }

  function bindToolbar() {
    const commands = {
      bold: () => exec('bold'),
      italic: () => exec('italic'),
      underline: () => exec('underline'),
      strikeThrough: () => exec('strikeThrough'),
      insertUnorderedList: () => exec('insertUnorderedList'),
      insertOrderedList: () => exec('insertOrderedList'),
      justifyLeft: () => exec('justifyLeft'),
      justifyCenter: () => exec('justifyCenter'),
      justifyRight: () => exec('justifyRight'),
      indent: () => exec('indent'),
      outdent: () => exec('outdent'),
      undo: () => exec('undo'),
      redo: () => exec('redo'),
    };
    $$('[data-command]').forEach((button) => {
      button.addEventListener('mousedown', (e) => e.preventDefault());
      button.addEventListener('click', () => commands[button.dataset.command]?.());
    });

    $('#block-format').addEventListener('change', (event) => {
      const value = event.target.value;
      if (value === 'blockquote') setBlock('blockquote');
      else setBlock(value);
    });

    $('#font-family').addEventListener('change', (event) => {
      window.MonEcritSettings.saveSettings({ fontFamily: event.target.value });
    });
    $('#font-size').addEventListener('change', (event) => {
      window.MonEcritSettings.saveSettings({ fontSize: event.target.value });
    });

    const palette = $('#character-palette');
    $('#character-button').addEventListener('mousedown', () => rememberSelection());
    $('#character-button').addEventListener('click', () => {
      palette.hidden = !palette.hidden;
    });
    palette.addEventListener('mousedown', (event) => {
      if (event.target.matches('[data-character]')) event.preventDefault();
    });
    palette.addEventListener('click', (event) => {
      const button = event.target.closest('[data-character]');
      if (!button) return;
      insertCharacter(button.dataset.character);
      palette.hidden = true;
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.character-picker')) palette.hidden = true;
    });
  }

  function bindEditor() {
    const editor = $('#editor');
    const title = $('#document-title');
    editor.addEventListener('input', () => {
      updateCounter();
      rememberSelection();
      queueSave();
    });
    editor.addEventListener('keyup', rememberSelection);
    editor.addEventListener('mouseup', rememberSelection);
    title.addEventListener('input', queueSave);
    title.addEventListener('blur', () => {
      if (!title.value.trim()) title.value = 'Sans titre';
      queueSave();
    });

    new window.MonEcritFrenchShortcuts.FrenchShortcutController(editor, {
      indicator: $('#accent-indicator'),
      onInsert: rememberSelection,
    });

    window.addEventListener('online', () => {
      setStatus('Connexion rétablie · sauvegarde…', 'saving');
      saveNow();
    });
    window.addEventListener('offline', () => {
      queueSave();
      setStatus('Hors connexion · enregistré localement', 'local');
    });
    window.addEventListener('beforeunload', () => {
      if (!documentData) return;
      const current = snapshot();
      if (current === lastSavedSnapshot) return;
      const parsed = JSON.parse(current);
      docsApi.writeLocalDraft(user.id, { id: documentData.id, ...parsed });
    });
  }

  function toggleFocusMode(force) {
    const next = typeof force === 'boolean' ? force : !document.body.classList.contains('focus-mode');
    document.body.classList.toggle('focus-mode', next);
    $('#focus-toggle').setAttribute('aria-pressed', String(next));
    $('#focus-toggle').querySelector('.focus-label').textContent = next ? 'Quitter le mode concentration' : 'Mode concentration';
  }

  function bindShell() {
    $('#focus-toggle').addEventListener('click', () => toggleFocusMode());
    $('#mobile-menu-toggle')?.addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
    $('#sidebar-backdrop')?.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
    $('[data-logout]')?.addEventListener('click', () => window.MonEcritAuth.signOut());
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFocusMode();
      }
    });
  }

  function loadSettingsControls() {
    const settings = window.MonEcritSettings.getSettings();
    $('#font-family').value = settings.fontFamily;
    $('#font-size').value = settings.fontSize;
    window.MonEcritSettings.applySettings(settings);
  }

  function maybeRestoreLocalDraft(remote) {
    const local = docsApi.readLocalDraft(user.id, remote.id);
    if (!local) return remote;
    const localDate = new Date(local.updated_at || 0).getTime();
    const remoteDate = new Date(remote.updated_at || 0).getTime();
    if (localDate <= remoteDate) return remote;
    return { ...remote, ...local, recoveredLocal: true };
  }

  async function loadDocument() {
    const id = getDocumentId();
    if (!id) {
      const created = await docsApi.createDocument(user.id);
      history.replaceState({}, '', `editor.html?id=${encodeURIComponent(created.id)}`);
      return created;
    }
    return docsApi.getDocument(id);
  }

  async function init() {
    if (!window.MON_ECRIT_SUPABASE_CONFIGURED) {
      location.href = 'login.html';
      return;
    }
    user = await window.MonEcritAuth.requireAuth();
    if (!user) return;
    bindToolbar();
    bindEditor();
    bindShell();
    loadSettingsControls();

    try {
      const remote = await loadDocument();
      if (remote.deleted_at) {
        location.href = 'dashboard.html';
        return;
      }
      documentData = maybeRestoreLocalDraft(remote);
      $('#document-title').value = documentData.title || 'Sans titre';
      $('#editor').innerHTML = documentData.content || '';
      updateCounter();
      lastSavedSnapshot = documentData.recoveredLocal ? '' : snapshot();
      setStatus(documentData.recoveredLocal ? 'Brouillon local récupéré' : 'Sauvegardé', documentData.recoveredLocal ? 'local' : 'saved');
      $('#editor').focus();
      const range = document.createRange();
      range.selectNodeContents($('#editor'));
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      rememberSelection();
      if (documentData.recoveredLocal && navigator.onLine) queueSave();
    } catch (error) {
      console.error(error);
      $('#editor-loading-error').hidden = false;
      $('#editor-loading-error').textContent = `Impossible d’ouvrir ce document : ${error.message}`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

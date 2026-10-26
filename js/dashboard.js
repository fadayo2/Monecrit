(function () {
  const docsApi = window.MonEcritDocuments;
  let user = null;
  let documents = [];
  let currentView = 'recent';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function escapeHtml(value = '') {
    return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function formatDate(date) {
    if (!date) return '';
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
  }

  function relativeDate(date) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return "Aujourd’hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return formatDate(date);
  }

  function skeleton() {
    $('#documents-grid').innerHTML = '<div class="empty-state"><span class="spinner"></span><p>Chargement des documents…</p></div>';
  }

  function render() {
    const query = ($('#document-search')?.value || '').trim().toLowerCase();
    const filtered = documents.filter((doc) => (doc.title || 'Sans titre').toLowerCase().includes(query));
    const grid = $('#documents-grid');
    const heading = $('#view-title');
    const subtitle = $('#view-subtitle');

    if (currentView === 'trash') {
      heading.textContent = 'Corbeille';
      subtitle.textContent = 'Restaure un document ou supprime-le définitivement.';
    } else if (currentView === 'all') {
      heading.textContent = 'Mes documents';
      subtitle.textContent = 'Tous tes textes, au même endroit.';
    } else {
      heading.textContent = 'Documents récents';
      subtitle.textContent = 'Reprends ton écriture là où tu l’as laissée.';
    }

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state document-empty">
          <div class="empty-icon">✦</div>
          <h3>${query ? 'Aucun résultat' : currentView === 'trash' ? 'La corbeille est vide' : 'Commence par une page blanche'}</h3>
          <p>${query ? 'Essaie un autre titre.' : currentView === 'trash' ? 'Les documents supprimés apparaîtront ici.' : 'Crée un document et commence à écrire immédiatement.'}</p>
          ${currentView !== 'trash' && !query ? '<button class="btn btn-primary" data-create-document>+ Nouveau document</button>' : ''}
        </div>`;
      bindCardActions();
      return;
    }

    grid.innerHTML = filtered.map((doc) => `
      <article class="document-card" data-id="${doc.id}">
        <button class="card-open" data-open-document="${doc.id}" aria-label="Ouvrir ${escapeHtml(doc.title || 'Sans titre')}">
          <span class="doc-paper" aria-hidden="true"><span></span><span></span><span></span></span>
          <span class="card-title">${escapeHtml(doc.title || 'Sans titre')}</span>
          <span class="card-meta">${relativeDate(doc.updated_at)} · ${doc.word_count || 0} mots</span>
        </button>
        <div class="card-actions">
          ${currentView === 'trash' ? `
            <button class="icon-text-button" data-restore-document="${doc.id}">Restaurer</button>
            <button class="icon-button danger" data-delete-forever="${doc.id}" aria-label="Supprimer définitivement">×</button>
          ` : `
            <button class="icon-button" data-duplicate-document="${doc.id}" aria-label="Dupliquer">⧉</button>
            <button class="icon-button danger" data-trash-document="${doc.id}" aria-label="Mettre à la corbeille">×</button>
          `}
        </div>
      </article>
    `).join('');
    bindCardActions();
  }

  function bindCardActions() {
    $$('[data-create-document]').forEach((b) => b.addEventListener('click', createDocument));
    $$('[data-open-document]').forEach((b) => b.addEventListener('click', () => openDocument(b.dataset.openDocument)));
    $$('[data-trash-document]').forEach((b) => b.addEventListener('click', () => trashDocument(b.dataset.trashDocument)));
    $$('[data-restore-document]').forEach((b) => b.addEventListener('click', () => restoreDocument(b.dataset.restoreDocument)));
    $$('[data-delete-forever]').forEach((b) => b.addEventListener('click', () => deleteForever(b.dataset.deleteForever)));
    $$('[data-duplicate-document]').forEach((b) => b.addEventListener('click', () => duplicateDocument(b.dataset.duplicateDocument)));
  }

  async function loadDocuments() {
    skeleton();
    try {
      documents = await docsApi.listDocuments({ deleted: currentView === 'trash', limit: currentView === 'recent' ? 12 : 100 });
      render();
    } catch (error) {
      $('#documents-grid').innerHTML = `<div class="empty-state"><h3>Impossible de charger les documents</h3><p>${escapeHtml(error.message || '')}</p></div>`;
    }
  }

  async function createDocument() {
    try {
      const doc = await docsApi.createDocument(user.id);
      location.href = `editor.html?id=${encodeURIComponent(doc.id)}`;
    } catch (error) {
      alert(`Impossible de créer le document : ${error.message}`);
    }
  }

  function openDocument(id) {
    location.href = `editor.html?id=${encodeURIComponent(id)}`;
  }

  async function trashDocument(id) {
    await docsApi.softDeleteDocument(id);
    await loadDocuments();
  }

  async function restoreDocument(id) {
    await docsApi.restoreDocument(id);
    await loadDocuments();
  }

  async function deleteForever(id) {
    if (!confirm('Supprimer définitivement ce document ? Cette action est irréversible.')) return;
    await docsApi.permanentlyDeleteDocument(id);
    await loadDocuments();
  }

  async function duplicateDocument(id) {
    const source = documents.find((doc) => doc.id === id);
    if (!source) return;
    const copy = await docsApi.duplicateDocument(source, user.id);
    location.href = `editor.html?id=${encodeURIComponent(copy.id)}`;
  }

  function setView(view) {
    currentView = view;
    $$('.sidebar-link[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
    loadDocuments();
    loadProgress();
  }


  function renderProgress(sessions, mistakes) {
    const valid = sessions.filter(s => Number.isFinite(Number(s.overall_score)));
    const avg = valid.length ? Math.round(valid.reduce((sum,s) => sum + Number(s.overall_score), 0) / valid.length) : null;
    const words = sessions.reduce((sum,s) => sum + Number(s.words_written || 0), 0);
    const levels = sessions.reduce((acc,s) => { acc[s.level || 'A1'] = (acc[s.level || 'A1'] || 0) + 1; return acc; }, {});
    const topLevel = Object.entries(levels).sort((a,b) => b[1]-a[1])[0]?.[0] || 'A1';
    $('#stat-sessions').textContent = sessions.length;
    $('#stat-score').textContent = avg == null ? '—' : avg;
    $('#stat-words').textContent = words.toLocaleString('fr-FR');
    $('#stat-level').textContent = topLevel;
    const list = $('#mistake-notebook-list');
    if (!mistakes.length) { list.innerHTML = '<div class="empty-state"><p>Aucune correction enregistrée pour le moment.</p></div>'; return; }
    list.innerHTML = mistakes.slice(0,6).map(m => `<article class="notebook-item"><strong>${escapeHtml(m.category || 'Correction')}</strong><span><del>${escapeHtml(m.original || '')}</del> → <b>${escapeHtml(m.correction || '')}</b></span><p>${escapeHtml(m.explanation || '')}</p></article>`).join('');
  }

  async function loadProgress() {
    try {
      const [sessions, mistakes] = await Promise.all([docsApi.listSessions(100), docsApi.listMistakes(30)]);
      renderProgress(sessions, mistakes);
    } catch (error) { console.warn('Progress unavailable', error); }
  }

  async function quickPractice() {
    const savedLevel = localStorage.getItem('monecrit:practice-level') || 'A1';
    const topic = window.MonEcritLearning.randomTopic(savedLevel);
    try {
      const doc = await docsApi.createDocument(user.id, { title: topic.title, level: savedLevel, prompt: topic.prompt, target_words: topic.target, writing_mode: 'prompt' });
      location.href = `editor.html?id=${encodeURIComponent(doc.id)}`;
    } catch (error) { alert(`Impossible de créer l’exercice : ${error.message}`); }
  }

  function bindNavigation() {
    $$('.sidebar-link[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
    $('#document-search')?.addEventListener('input', render);
    $('#new-document')?.addEventListener('click', createDocument);
    $('#quick-practice')?.addEventListener('click', quickPractice);
    $('#mobile-new-document')?.addEventListener('click', createDocument);
    $('[data-logout]')?.addEventListener('click', () => window.MonEcritAuth.signOut());
    $('#mobile-menu-toggle')?.addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
    $('#sidebar-backdrop')?.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
  }

  async function init() {
    if (!window.MON_ECRIT_SUPABASE_CONFIGURED) {
      location.href = 'login.html';
      return;
    }
    user = await window.MonEcritAuth.requireAuth();
    if (!user) return;
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'toi';
    $('#greeting-name').textContent = `${name} 👋`;
    $('#user-name').textContent = name;
    $('#user-email').textContent = user.email || '';
    bindNavigation();
    loadDocuments();
    loadProgress();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

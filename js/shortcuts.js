(function () {
  const ACCENT_MAPS = {
    acute: { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' },
    grave: { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù' },
    circumflex: { a: 'â', e: 'ê', i: 'î', o: 'ô', u: 'û' },
    diaeresis: { e: 'ë', i: 'ï', u: 'ü' },
    cedilla: { c: 'ç' },
  };

  const LABELS = {
    acute: 'Accent aigu actif → tapez une lettre',
    grave: 'Accent grave actif → tapez une lettre',
    circumflex: 'Accent circonflexe actif → tapez une lettre',
    diaeresis: 'Tréma actif → tapez une lettre',
    cedilla: 'Cédille active → tapez c',
  };

  function resolveFrenchCharacter(mode, key, shiftKey = false) {
    const map = ACCENT_MAPS[mode];
    if (!map || !key || key.length !== 1) return null;
    const lower = key.toLowerCase();
    const value = map[lower];
    if (!value) return null;
    const wantsUpper = shiftKey || key !== lower;
    return wantsUpper ? value.toUpperCase() : value;
  }

  class FrenchShortcutController {
    constructor(editor, options = {}) {
      this.editor = editor;
      this.indicator = options.indicator || null;
      this.onInsert = options.onInsert || (() => {});
      this.accentMode = null;
      this.indicatorTimer = null;
      this.boundKeydown = this.handleKeydown.bind(this);
      this.editor.addEventListener('keydown', this.boundKeydown, true);
    }

    destroy() {
      this.editor.removeEventListener('keydown', this.boundKeydown, true);
    }

    showIndicator(text) {
      if (!this.indicator) return;
      this.indicator.textContent = text;
      this.indicator.hidden = false;
      clearTimeout(this.indicatorTimer);
      this.indicatorTimer = setTimeout(() => {
        if (!this.accentMode) this.indicator.hidden = true;
      }, 2200);
    }

    hideIndicator() {
      if (!this.indicator) return;
      clearTimeout(this.indicatorTimer);
      this.indicator.hidden = true;
    }

    activate(mode) {
      this.accentMode = mode;
      this.showIndicator(LABELS[mode]);
    }

    cancel() {
      this.accentMode = null;
      this.hideIndicator();
    }

    insertText(text) {
      this.editor.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (!this.editor.contains(range.commonAncestorContainer)) return;
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      this.onInsert(text);
      this.editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }

    isActivator(event) {
      if (!event.ctrlKey || event.altKey || event.metaKey) return null;
      const key = event.key;
      if (key === "'") return 'acute';
      if (key === '`') return 'grave';
      if (key === '^') return 'circumflex';
      if (key === '"') return 'diaeresis';
      if (key === ',') return 'cedilla';
      return null;
    }

    handleKeydown(event) {
      // Deux raccourcis directs.
      if (event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey) {
        if (event.key.toLowerCase() === 'o') {
          event.preventDefault();
          this.cancel();
          this.insertText('œ');
          return;
        }
        if (event.key.toLowerCase() === 'a') {
          event.preventDefault();
          this.cancel();
          this.insertText('æ');
          return;
        }
      }

      // Si un accent est actif, seule une lettre prise en charge est interceptée.
      if (this.accentMode) {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.cancel();
          return;
        }

        const value = resolveFrenchCharacter(this.accentMode, event.key, event.shiftKey);
        this.accentMode = null;
        this.hideIndicator();

        if (value) {
          event.preventDefault();
          this.insertText(value);
        }
        // Touche non supportée : aucun preventDefault, donc comportement normal conservé.
        return;
      }

      const mode = this.isActivator(event);
      if (mode) {
        event.preventDefault();
        this.activate(mode);
      }
    }
  }

  window.MonEcritFrenchShortcuts = {
    FrenchShortcutController,
    resolveFrenchCharacter,
    ACCENT_MAPS,
  };
})();

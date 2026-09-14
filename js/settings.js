(function () {
  const STORAGE_KEY = 'monecrit:settings';
  const defaults = {
    theme: 'light',
    fontFamily: 'Inter',
    fontSize: '18',
  };

  function getSettings() {
    try {
      return { ...defaults, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
    } catch {
      return { ...defaults };
    }
  }

  function saveSettings(partial) {
    const settings = { ...getSettings(), ...partial };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applySettings(settings);
    return settings;
  }

  function applySettings(settings = getSettings()) {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.setProperty('--editor-font', settings.fontFamily);
    document.documentElement.style.setProperty('--editor-size', `${settings.fontSize}px`);

    const editor = document.querySelector('#editor');
    if (editor) {
      editor.style.fontFamily = fontStack(settings.fontFamily);
      editor.style.fontSize = `${settings.fontSize}px`;
    }
  }

  function fontStack(font) {
    const stacks = {
      Inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
      Georgia: 'Georgia, serif',
      Merriweather: 'Merriweather, Georgia, serif',
      Arial: 'Arial, sans-serif',
      'Times New Roman': '"Times New Roman", Times, serif',
    };
    return stacks[font] || stacks.Inter;
  }

  function toggleTheme() {
    const current = getSettings().theme;
    return saveSettings({ theme: current === 'dark' ? 'light' : 'dark' });
  }

  function openShortcutModal() {
    const modal = document.querySelector('#shortcuts-modal');
    if (!modal) return;
    modal.hidden = false;
    modal.querySelector('[data-close-modal]')?.focus();
  }

  function closeShortcutModal() {
    const modal = document.querySelector('#shortcuts-modal');
    if (modal) modal.hidden = true;
  }

  function bindCommonSettings() {
    applySettings();
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', toggleTheme);
    });
    document.querySelectorAll('[data-open-shortcuts]').forEach((button) => {
      button.addEventListener('click', openShortcutModal);
    });
    document.querySelectorAll('[data-close-modal]').forEach((button) => {
      button.addEventListener('click', closeShortcutModal);
    });
    document.querySelector('#shortcuts-modal')?.addEventListener('click', (event) => {
      if (event.target.id === 'shortcuts-modal') closeShortcutModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeShortcutModal();
      if (event.ctrlKey && !event.shiftKey && !event.altKey && event.key === '/') {
        event.preventDefault();
        openShortcutModal();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', bindCommonSettings);
  window.MonEcritSettings = { getSettings, saveSettings, applySettings, toggleTheme, fontStack, openShortcutModal };
})();

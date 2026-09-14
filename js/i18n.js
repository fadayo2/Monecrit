// Structure i18n légère pour permettre l'ajout de l'anglais plus tard.
(function () {
  const messages = {
    fr: {
      newDocument: 'Nouveau document',
      untitled: 'Sans titre',
      saved: 'Sauvegardé',
      saving: 'Sauvegarde…',
      settings: 'Paramètres',
      trash: 'Corbeille',
      search: 'Rechercher',
      focusMode: 'Mode concentration',
    },
  };
  let locale = localStorage.getItem('monecrit:locale') || 'fr';
  function t(key) { return messages[locale]?.[key] || messages.fr[key] || key; }
  function setLocale(next) {
    if (!messages[next]) return false;
    locale = next;
    localStorage.setItem('monecrit:locale', locale);
    return true;
  }
  window.MonEcritI18n = { t, setLocale, getLocale: () => locale, messages };
})();

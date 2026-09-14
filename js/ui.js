(function () {
  const icons = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9Z"/><path d="M9 21v-7h6v7"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7h16M9 7V4h6v3m-8 0 1 14h8l1-14"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06-2.12 2.12-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1.09 1.65V20.5h-3v-.09A1.8 1.8 0 0 0 10.46 18.8a1.8 1.8 0 0 0-2 .36l-.06.06-2.12-2.12.06-.06a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.65-1.09H5v-3h.09A1.8 1.8 0 0 0 6.7 10.46a1.8 1.8 0 0 0-.36-2l-.06-.06L8.4 6.28l.06.06a1.8 1.8 0 0 0 2 .36A1.8 1.8 0 0 0 11.55 5.05V5h3v.05a1.8 1.8 0 0 0 1.09 1.65 1.8 1.8 0 0 0 2-.36l.06-.06 2.12 2.12-.06.06a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.65 1.09H21v3h-.05A1.8 1.8 0 0 0 19.4 15Z"/></svg>',
  };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-icon]').forEach((el) => {
      if (icons[el.dataset.icon]) el.innerHTML = icons[el.dataset.icon];
    });
  });
})();

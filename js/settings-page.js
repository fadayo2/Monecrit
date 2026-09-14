(function () {
  async function init() {
    if (!window.MON_ECRIT_SUPABASE_CONFIGURED) {
      location.href = 'login.html';
      return;
    }
    const user = await window.MonEcritAuth.requireAuth();
    if (!user) return;

    const settings = window.MonEcritSettings.getSettings();
    const font = document.querySelector('#settings-font');
    const size = document.querySelector('#settings-size');
    font.value = settings.fontFamily;
    size.value = settings.fontSize;
    document.querySelector('#settings-email').textContent = user.email || '';
    document.querySelector('#settings-name').textContent = user.user_metadata?.full_name || 'Utilisateur';

    font.addEventListener('change', () => window.MonEcritSettings.saveSettings({ fontFamily: font.value }));
    size.addEventListener('change', () => window.MonEcritSettings.saveSettings({ fontSize: size.value }));
    document.querySelectorAll('[data-logout]').forEach((button) => button.addEventListener('click', () => window.MonEcritAuth.signOut()));
    document.querySelector('#mobile-menu-toggle')?.addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
    document.querySelector('#sidebar-backdrop')?.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
  }
  document.addEventListener('DOMContentLoaded', init);
})();

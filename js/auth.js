(function () {
  const client = window.supabaseClient;

  const $ = (selector, root = document) => root.querySelector(selector);

  function setMessage(message, type = 'info') {
    const el = $('#auth-message');
    if (!el) return;
    el.textContent = message;
    el.className = `auth-message ${type}`;
    el.hidden = !message;
  }

  function setLoading(button, loading, loadingText) {
    if (!button) return;
    if (loading) {
      button.dataset.label = button.textContent;
      button.textContent = loadingText;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.label || button.textContent;
      button.disabled = false;
    }
  }

  function configGuard() {
    if (!window.MON_ECRIT_SUPABASE_CONFIGURED) {
      setMessage('Configuration Supabase invalide. Vérifiez js/supabase.js.', 'warning');
      console.error('[MonÉcrit] Diagnostic Supabase :', window.MON_ECRIT_SUPABASE_DEBUG);
      return false;
    }

    if (!window.supabaseClient) {
      setMessage('Supabase est configuré, mais le SDK Supabase JS n’a pas été chargé. Vérifiez votre connexion ou le CDN.', 'error');
      console.error('[MonÉcrit] SDK Supabase indisponible :', window.MON_ECRIT_SUPABASE_DEBUG);
      return false;
    }

    return true;
  }

  async function redirectIfAuthenticated() {
    if (!client) return;
    const { data } = await client.auth.getSession();
    if (data.session && ['login.html', 'register.html', 'index.html', ''].includes(location.pathname.split('/').pop())) {
      location.href = 'dashboard.html';
    }
  }

  async function requireAuth() {
    if (!client) {
      location.href = 'login.html';
      return null;
    }
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) {
      location.href = 'login.html';
      return null;
    }
    return data.user;
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    location.href = 'login.html';
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!configGuard()) return;
    const button = $('#login-submit');
    setLoading(button, true, 'Connexion…');
    setMessage('');

    const email = $('#email').value.trim();
    const password = $('#password').value;
    const { error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message || 'Connexion impossible.', 'error');
      setLoading(button, false);
      return;
    }
    location.href = 'dashboard.html';
  }

  async function handleRegister(event) {
    event.preventDefault();
    if (!configGuard()) return;
    const button = $('#register-submit');
    setLoading(button, true, 'Création…');
    setMessage('');

    const fullName = $('#full-name').value.trim();
    const email = $('#email').value.trim();
    const password = $('#password').value;

    if (password.length < 8) {
      setMessage('Utilisez au moins 8 caractères pour le mot de passe.', 'error');
      setLoading(button, false);
      return;
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setMessage(error.message || 'Création du compte impossible.', 'error');
      setLoading(button, false);
      return;
    }

    if (data.session) {
      location.href = 'dashboard.html';
      return;
    }

    setMessage('Compte créé. Vérifiez votre e-mail si la confirmation est activée dans Supabase.', 'success');
    setLoading(button, false);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const loginForm = $('#login-form');
    const registerForm = $('#register-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    redirectIfAuthenticated();
  });

  window.MonEcritAuth = { requireAuth, signOut };
})();

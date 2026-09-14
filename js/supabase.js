// MonÉcrit — Configuration Supabase
// La clé publishable est publique et destinée au navigateur.

const SUPABASE_URL = 'https://albnjufjbrpfchbnlglr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_UnN--uORrH_9UhdCdTR18A_nepw_J8N';

const isConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_PUBLISHABLE_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.endsWith('.supabase.co') &&
  !SUPABASE_URL.includes('YOUR_PROJECT') &&
  !SUPABASE_PUBLISHABLE_KEY.includes('YOUR_SUPABASE')
);

window.MON_ECRIT_SUPABASE_CONFIGURED = isConfigured;
window.MON_ECRIT_SUPABASE_DEBUG = {
  configured: isConfigured,
  url: SUPABASE_URL,
  keyPrefix: SUPABASE_PUBLISHABLE_KEY.slice(0, 15),
  sdkLoaded: Boolean(window.supabase),
};

if (!isConfigured) {
  console.error('[MonÉcrit] Configuration Supabase invalide.', window.MON_ECRIT_SUPABASE_DEBUG);
  window.supabaseClient = null;
} else if (!window.supabase || typeof window.supabase.createClient !== 'function') {
  console.error('[MonÉcrit] Le SDK Supabase JS n’est pas chargé.', window.MON_ECRIT_SUPABASE_DEBUG);
  window.supabaseClient = null;
} else {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, 
      },
    }
  );

  console.info('[MonÉcrit] Supabase configuré ✓', window.MON_ECRIT_SUPABASE_DEBUG);
}
``
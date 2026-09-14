(function () {
  const client = window.supabaseClient;

  function localKey(userId, documentId) {
    return `monecrit:draft:${userId}:${documentId}`;
  }

  function writeLocalDraft(userId, document) {
    if (!userId || !document?.id) return;
    const payload = {
      id: document.id,
      title: document.title || 'Sans titre',
      content: document.content || '',
      word_count: document.word_count || 0,
      character_count: document.character_count || 0,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(localKey(userId, document.id), JSON.stringify(payload));
  }

  function readLocalDraft(userId, documentId) {
    try {
      const raw = localStorage.getItem(localKey(userId, documentId));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clearLocalDraft(userId, documentId) {
    localStorage.removeItem(localKey(userId, documentId));
  }

  async function listDocuments({ deleted = false, limit = 100 } = {}) {
    if (!client) return [];
    let query = client
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);
    query = deleted ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function getDocument(id) {
    if (!client) return null;
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async function createDocument(userId, overrides = {}) {
    const payload = {
      user_id: userId,
      title: 'Sans titre',
      content: '',
      word_count: 0,
      character_count: 0,
      ...overrides,
    };
    const { data, error } = await client
      .from('documents')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async function updateDocument(id, updates) {
    const { data, error } = await client
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async function softDeleteDocument(id) {
    return updateDocument(id, { deleted_at: new Date().toISOString() });
  }

  async function restoreDocument(id) {
    return updateDocument(id, { deleted_at: null });
  }

  async function permanentlyDeleteDocument(id) {
    const { error } = await client.from('documents').delete().eq('id', id);
    if (error) throw error;
  }

  async function duplicateDocument(document, userId) {
    return createDocument(userId, {
      title: `${document.title || 'Sans titre'} — copie`,
      content: document.content || '',
      word_count: document.word_count || 0,
      character_count: document.character_count || 0,
    });
  }

  window.MonEcritDocuments = {
    listDocuments,
    getDocument,
    createDocument,
    updateDocument,
    softDeleteDocument,
    restoreDocument,
    permanentlyDeleteDocument,
    duplicateDocument,
    writeLocalDraft,
    readLocalDraft,
    clearLocalDraft,
  };
})();

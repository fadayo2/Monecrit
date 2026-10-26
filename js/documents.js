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
      level: document.level || 'A1',
      prompt: document.prompt || '',
      target_words: document.target_words || 70,
      writing_mode: document.writing_mode || 'free',
      score: document.score || null,
      exam_duration_minutes: document.exam_duration_minutes || null,
      exam_started_at: document.exam_started_at || null,
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
      level: 'A1',
      prompt: '',
      target_words: 70,
      writing_mode: 'free',
      score: null,
      exam_duration_minutes: null,
      exam_started_at: null,
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
      level: document.level || 'A1',
      prompt: document.prompt || '',
      target_words: document.target_words || 70,
      writing_mode: document.writing_mode || 'free',
    });
  }


  async function saveAnalysis({ userId, documentId, level, wordsWritten, analysis }) {
    if (!client) return;
    const score = analysis?.overall ?? null;
    await updateDocument(documentId, { score: analysis, last_analyzed_at: new Date().toISOString() });
    const mistakes = (analysis?.mistakes || []).slice(0, 20).map((item) => ({
      user_id: userId, document_id: documentId, category: item.category || 'Autre',
      original: item.original || '', correction: item.correction || '', explanation: item.explanation || ''
    }));
    if (mistakes.length) {
      const { error } = await client.from('writing_mistakes').insert(mistakes);
      if (error) console.warn('Mistakes not saved', error);
    }
    const { error } = await client.from('writing_sessions').insert({
      user_id: userId, document_id: documentId, level: level || 'A1',
      words_written: wordsWritten || 0, overall_score: score
    });
    if (error) console.warn('Session not saved', error);
  }

  async function listMistakes(limit = 100) {
    const { data, error } = await client.from('writing_mistakes').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
  }

  async function listSessions(limit = 100) {
    const { data, error } = await client.from('writing_sessions').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data || [];
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
    saveAnalysis,
    listMistakes,
    listSessions,
  };
})();

(function () {
  const TOPICS = {
    A1: [
      { title: 'Ma famille', prompt: 'Présente ta famille. Parle des personnes, de leur âge, de leur travail et de ce que vous aimez faire ensemble.', target: 70, type: 'Description' },
      { title: 'Ma journée', prompt: 'Décris une journée normale, du matin au soir. Utilise des heures et des verbes du quotidien.', target: 70, type: 'Récit' },
      { title: 'Mon quartier', prompt: 'Décris ton quartier et les endroits que tu fréquentes. Explique ce que tu aimes ou n’aimes pas.', target: 80, type: 'Description' },
      { title: 'Une invitation', prompt: 'Écris un petit message à un ami pour l’inviter à une activité. Donne le lieu, la date et l’heure.', target: 60, type: 'Message' },
      { title: 'Mes loisirs', prompt: 'Présente tes loisirs préférés et explique quand et avec qui tu les pratiques.', target: 70, type: 'Description' }
    ],
    A2: [
      { title: 'Un week-end mémorable', prompt: 'Raconte un week-end que tu as aimé. Explique où tu es allé, avec qui, et ce que tu as fait.', target: 100, type: 'Récit' },
      { title: 'Demander des informations', prompt: 'Écris un e-mail pour demander des informations sur un cours de français : horaires, prix et inscription.', target: 90, type: 'E-mail' },
      { title: 'Mon logement idéal', prompt: 'Décris ton logement idéal et explique pourquoi il te conviendrait.', target: 100, type: 'Description' },
      { title: 'Conseils à un ami', prompt: 'Un ami veut apprendre le français. Donne-lui des conseils simples et pratiques.', target: 100, type: 'Message' },
      { title: 'Une petite réclamation', prompt: 'Écris à un magasin pour expliquer un problème avec un achat et demander une solution.', target: 110, type: 'E-mail' }
    ],
    B1: [
      { title: 'Télétravail : bonne idée ?', prompt: 'Donne ton opinion sur le télétravail. Présente au moins deux avantages, un inconvénient et une conclusion.', target: 160, type: 'Opinion' },
      { title: 'Une expérience qui m’a changé', prompt: 'Raconte une expérience importante et explique ce que tu as appris grâce à elle.', target: 160, type: 'Récit' },
      { title: 'Écrire au maire', prompt: 'Écris au maire de ta ville pour proposer une amélioration concrète pour les jeunes ou les familles.', target: 170, type: 'Lettre formelle' },
      { title: 'Voyager pour apprendre', prompt: 'Explique pourquoi voyager peut aider à apprendre une langue et découvrir une culture.', target: 160, type: 'Opinion' },
      { title: 'Réseaux sociaux', prompt: 'Les réseaux sociaux rapprochent-ils vraiment les gens ? Donne ton point de vue avec des exemples.', target: 180, type: 'Argumentation' }
    ],
    B2: [
      { title: 'Intelligence artificielle et école', prompt: 'Discute les bénéfices et les risques de l’intelligence artificielle dans l’éducation. Propose des règles d’usage raisonnables.', target: 240, type: 'Argumentation' },
      { title: 'Ville ou campagne ?', prompt: 'Compare la vie en ville et à la campagne en considérant le travail, les services, l’environnement et la qualité de vie.', target: 230, type: 'Essai' },
      { title: 'Faut-il limiter les écrans ?', prompt: 'Prends position sur la place des écrans dans la vie quotidienne et développe une argumentation nuancée.', target: 240, type: 'Opinion' },
      { title: 'Tourisme et environnement', prompt: 'Analyse les effets du tourisme sur l’économie locale et l’environnement, puis propose des solutions équilibrées.', target: 250, type: 'Essai' },
      { title: 'La semaine de quatre jours', prompt: 'Examine les arguments pour et contre la semaine de travail de quatre jours avant de donner ta position.', target: 250, type: 'Argumentation' }
    ]
  };

  const LEVEL_INFO = {
    A1: { label: 'A1 · Débutant', defaultTarget: 70, connectors: ['et', 'mais', 'parce que'] },
    A2: { label: 'A2 · Élémentaire', defaultTarget: 100, connectors: ['d’abord', 'ensuite', 'parce que', 'mais', 'aussi'] },
    B1: { label: 'B1 · Intermédiaire', defaultTarget: 160, connectors: ['cependant', 'en effet', 'par exemple', 'donc', 'en conclusion'] },
    B2: { label: 'B2 · Avancé', defaultTarget: 240, connectors: ['néanmoins', 'en revanche', 'd’une part', 'd’autre part', 'par conséquent', 'en somme'] }
  };

  function getTopics(level = 'A1') { return TOPICS[level] || TOPICS.A1; }
  function randomTopic(level = 'A1') {
    const topics = getTopics(level);
    return topics[Math.floor(Math.random() * topics.length)];
  }
  function defaultTarget(level = 'A1') { return LEVEL_INFO[level]?.defaultTarget || 100; }

  function normalizeText(value = '') {
    return value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  function sentences(text) {
    return normalizeText(text).split(/(?<=[.!?])\s+/u).map(s => s.trim()).filter(Boolean);
  }

  function localAnalyze(text, level = 'A1', prompt = '') {
    const clean = normalizeText(text);
    const words = clean ? clean.split(/\s+/u).filter(Boolean) : [];
    const sentenceList = sentences(clean);
    const unique = new Set(words.map(w => w.toLocaleLowerCase('fr-FR').replace(/[.,!?;:()«»"']/g, '')).filter(Boolean));
    const diversity = words.length ? unique.size / words.length : 0;
    const target = defaultTarget(level);
    const connectorList = LEVEL_INFO[level]?.connectors || [];
    const connectorCount = connectorList.filter(c => clean.toLocaleLowerCase('fr-FR').includes(c)).length;

    const mistakes = [];
    const rules = [
      { re: /\bsa va\b/giu, original: 'sa va', correction: 'ça va', category: 'Orthographe', explanation: 'Dans cette expression, on écrit « ça » avec une cédille.' },
      { re: /\bcomme meme\b/giu, original: 'comme meme', correction: 'quand même', category: 'Expression', explanation: 'L’expression correcte est « quand même ».' },
      { re: /\bje peut\b/giu, original: 'je peut', correction: 'je peux', category: 'Conjugaison', explanation: 'Avec « je », le verbe pouvoir s’écrit « je peux ».' },
      { re: /\bils peut\b/giu, original: 'ils peut', correction: 'ils peuvent', category: 'Conjugaison', explanation: 'Avec « ils », le verbe pouvoir s’écrit « ils peuvent ».' },
      { re: /\bje vais aller hier\b/giu, original: 'je vais aller hier', correction: 'je suis allé(e) hier', category: 'Temps', explanation: '« Hier » appelle généralement un temps du passé.' }
    ];
    rules.forEach(rule => {
      if (rule.re.test(clean)) mistakes.push({ original: rule.original, correction: rule.correction, category: rule.category, explanation: rule.explanation });
      rule.re.lastIndex = 0;
    });

    let correctedText = clean
      .replace(/\bsa va\b/giu, 'ça va')
      .replace(/\bcomme meme\b/giu, 'quand même')
      .replace(/\bje peut\b/giu, 'je peux')
      .replace(/\bils peut\b/giu, 'ils peuvent')
      .replace(/\s+([,.])/g, '$1')
      .replace(/\s*([;:!?])\s*/g, ' $1 ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (correctedText && /^[a-zà-ÿ]/u.test(correctedText)) correctedText = correctedText.charAt(0).toLocaleUpperCase('fr-FR') + correctedText.slice(1);

    const lengthRatio = Math.min(1, words.length / Math.max(1, target));
    const grammar = Math.max(45, Math.min(96, 88 - mistakes.length * 8 + Math.min(sentenceList.length, 8)));
    const vocabulary = Math.max(45, Math.min(96, 55 + diversity * 45 + connectorCount * 2));
    const structure = Math.max(45, Math.min(96, 52 + Math.min(sentenceList.length, 10) * 3 + connectorCount * 5));
    const coherence = Math.max(45, Math.min(96, 58 + connectorCount * 6 + (prompt && clean.length ? 5 : 0)));
    const spelling = Math.max(45, Math.min(98, 94 - mistakes.filter(m => m.category === 'Orthographe').length * 10));
    const completion = Math.round(50 + lengthRatio * 50);
    const overall = Math.round((grammar + vocabulary + structure + coherence + spelling + completion) / 6);

    const strengths = [];
    const suggestions = [];
    if (words.length >= target) strengths.push('La longueur demandée est atteinte.');
    if (diversity > 0.58) strengths.push('Le vocabulaire est assez varié.');
    if (connectorCount >= 2) strengths.push('Tu utilises des connecteurs pour organiser tes idées.');
    if (strengths.length === 0 && words.length) strengths.push('Tu as déjà une base claire à améliorer.');
    if (words.length < target) suggestions.push(`Développe davantage tes idées : vise environ ${target} mots.`);
    if (connectorCount < 2 && level !== 'A1') suggestions.push(`Ajoute des connecteurs comme ${connectorList.slice(0, 3).join(', ')}.`);
    if (sentenceList.length < 3 && words.length > 30) suggestions.push('Découpe le texte en plusieurs phrases ou paragraphes pour améliorer la lisibilité.');
    if (!/[.!?]$/u.test(clean) && clean) suggestions.push('Pense à terminer ton texte avec une ponctuation finale.');

    return {
      source: 'local',
      overall,
      scores: { grammar: Math.round(grammar), vocabulary: Math.round(vocabulary), structure: Math.round(structure), coherence: Math.round(coherence), spelling: Math.round(spelling) },
      correctedText,
      mistakes,
      strengths,
      suggestions,
      summary: clean ? 'Vérification locale terminée. Les conseils sont générés directement dans ton navigateur, sans service payant.' : 'Écris quelques phrases avant de lancer la vérification.'
    };
  }

  window.MonEcritLearning = { TOPICS, LEVEL_INFO, getTopics, randomTopic, defaultTarget, localAnalyze };
})();

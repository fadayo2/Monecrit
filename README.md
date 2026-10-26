# MonÉcrit V1

Petit éditeur de texte personnel, français-first, construit en HTML, CSS/Tailwind-friendly et JavaScript vanilla avec Supabase.

> Philosophie : **Ouvre. Écris. Sauvegarde. Reviens demain.**

## Fonctionnalités V1

- Auth Supabase : inscription, connexion, déconnexion.
- Dashboard : documents récents, tous les documents, recherche, corbeille.
- Création, duplication, suppression douce, restauration et suppression définitive.
- Éditeur riche `contenteditable` : titres, citation, gras, italique, souligné, barré, listes, alignement, indentation, undo/redo.
- Raccourcis français en deux étapes : accents aigu/grave/circonflexe/tréma/cédille.
- `Ctrl + Shift + O` → `œ`, `Ctrl + Shift + A` → `æ`.
- Palette `Àç` pour insérer les caractères français à la position du curseur.
- Compteur temps réel : mots, caractères, temps de lecture (~220 mots/minute).
- Autosave avec debounce de 900 ms.
- Brouillon local `localStorage` hors connexion et récupération au rechargement.
- Mode concentration `Ctrl + Shift + F`.
- Clair/sombre, choix de police et taille.
- Panneau de raccourcis via `Ctrl + /`.
- Responsive desktop/tablette/mobile.

## 1) Configurer Supabase

1. Créez un projet Supabase.
2. Dans **SQL Editor**, exécutez `supabase/schema.sql`.
3. Dans **Project Settings / API**, copiez :
   - l’URL du projet ;
   - la clé publishable/anon destinée au navigateur.
4. Remplacez les deux placeholders dans `js/supabase.js`.

Ne placez jamais la clé `service_role` dans ce projet navigateur.

## 2) Auth

Si la confirmation e-mail est activée dans Supabase Auth, le nouvel utilisateur devra confirmer son adresse avant sa première connexion. Pour un prototype local, vous pouvez adapter cette option dans les réglages Auth de Supabase.

## 3) Lancer localement

Servez le dossier avec un serveur HTTP (évitez d’ouvrir les fichiers directement en `file://`). Par exemple avec VS Code Live Server ou tout serveur statique.

## 4) Déploiement

Le projet est 100% statique : Vercel, Netlify, Cloudflare Pages ou Supabase Hosting peuvent servir les fichiers tels quels.

## Notes techniques

- `document.execCommand()` est utilisé uniquement comme moteur de mise en forme minimal pour la V1 `contenteditable`. Il est ancien mais reste largement pris en charge. Une V2 peut migrer vers une couche d’édition structurée sans changer l’expérience produit.
- La sécurité des documents repose sur RLS côté base, pas sur le filtrage JavaScript.
- Le contenu est enregistré en HTML, ce qui correspond au besoin d’un éditeur riche simple. Si du HTML non fiable est importé plus tard, ajoutez une sanitation stricte avant rendu.

## Tailwind CSS

La V1 charge **Tailwind CSS v4 Browser** dans les pages et conserve `css/styles.css` pour les composants visuels spécifiques de MonÉcrit. Pour une mise en production à grande échelle, remplacez le Browser/Play CDN par une compilation Tailwind CLI afin d’obtenir un CSS statique optimisé.


## MonÉcrit V2 — Coach d’écriture

Cette version ajoute une couche d’apprentissage au-dessus de l’éditeur V1 :

- niveaux CECR A1, A2, B1 et B2 ;
- bibliothèque/générateur de sujets adaptés au niveau ;
- objectifs de mots avec barre de progression ;
- mode examen chronométré 15/30/45/60 minutes ;
- vérification avec score global et sous-scores (grammaire, vocabulaire, structure, cohérence, orthographe) ;
- vue de la version corrigée et bouton pour l’appliquer ;
- carnet d’erreurs persistant ;
- historique des sessions et tableau de progression ;
- analyse locale de secours si l’IA n’est pas configurée ;
- vérification pédagogique locale, gratuite et exécutée directement dans le navigateur.

### Mettre à jour une base Supabase V1 existante

Exécutez **une fois** `supabase/v2-learning-migration.sql` dans Supabase > SQL Editor. Le script ajoute les colonnes V2, les tables `writing_mistakes` et `writing_sessions`, les index et les policies RLS.

Pour un nouveau projet, vous pouvez exécuter directement `supabase/schema.sql`, qui contient V1 + V2.

### Vérification locale gratuite

La vérification fonctionne directement dans le navigateur et ne nécessite aucune API payante. Les règles locales peuvent repérer des erreurs fréquentes, proposer quelques corrections, évaluer la longueur, le vocabulaire, la structure et l’usage de connecteurs.

### Déploiement V2

Le projet reste entièrement statique côté application. Déployez le dossier racine sur Vercel comme avant ; aucune fonction d’IA ni clé API n’est nécessaire.

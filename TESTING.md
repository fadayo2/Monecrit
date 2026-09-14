# Tests V1

## Automatisés dans ce paquet

- Table de correspondance des accents : minuscules + majuscules + touche non supportée.
- Vérification de syntaxe Node sur tous les modules JavaScript.
- Vérification statique de présence des fonctions : autosave/debounce, localStorage, corbeille/restauration, Focus Mode et RLS.

Commande :

```bash
node tests/shortcuts.test.js
```

## Validation manuelle recommandée après connexion à votre Supabase

1. `Ctrl + '` puis `e` → `é`
2. `Ctrl + \`` puis `e` → `è`
3. `Ctrl + ^` puis `e` → `ê`
4. `Ctrl + "` puis `e` → `ë`
5. `Ctrl + \`` puis `a` → `à`
6. `Ctrl + ,` puis `c` → `ç`
7. Refaire avec `Shift`/majuscules.
8. Placer le curseur au milieu d’une phrase et insérer un accent.
9. Sélectionner du texte puis insérer un caractère : la sélection est remplacée.
10. Taper puis attendre ~900 ms : le statut passe de local/sauvegarde à `Sauvegardé`.
11. Vérifier le compteur en temps réel.
12. Couper Internet après ouverture d’un document : les modifications restent dans `localStorage`, puis repartent vers Supabase au retour en ligne.
13. Supprimer un document, ouvrir la Corbeille, puis Restaurer.
14. `Ctrl + Shift + F` : entrer/sortir du Mode concentration.

Le test complet Supabase nécessite l’URL et la clé de **votre** projet, qui ne sont volontairement pas incluses dans le paquet.

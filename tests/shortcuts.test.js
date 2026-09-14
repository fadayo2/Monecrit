// Test Node sans dépendance de la table de correspondance des accents.
const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync(require('path').join(__dirname, '../js/shortcuts.js'), 'utf8');
const sandbox = { window: {}, document: {}, console };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const resolve = sandbox.window.MonEcritFrenchShortcuts.resolveFrenchCharacter;

const cases = [
  ['acute', 'e', false, 'é'],
  ['grave', 'e', false, 'è'],
  ['circumflex', 'e', false, 'ê'],
  ['diaeresis', 'e', false, 'ë'],
  ['grave', 'a', false, 'à'],
  ['cedilla', 'c', false, 'ç'],
  ['acute', 'E', true, 'É'],
  ['grave', 'E', true, 'È'],
  ['circumflex', 'E', true, 'Ê'],
  ['diaeresis', 'E', true, 'Ë'],
  ['grave', 'A', true, 'À'],
  ['circumflex', 'A', true, 'Â'],
  ['circumflex', 'I', true, 'Î'],
  ['diaeresis', 'I', true, 'Ï'],
  ['circumflex', 'O', true, 'Ô'],
  ['grave', 'U', true, 'Ù'],
  ['circumflex', 'U', true, 'Û'],
  ['cedilla', 'C', true, 'Ç'],
  ['acute', 'x', false, null],
];

let failed = 0;
for (const [mode, key, shift, expected] of cases) {
  const actual = resolve(mode, key, shift);
  if (actual !== expected) {
    console.error(`FAIL ${mode} + ${key}: expected ${expected}, got ${actual}`);
    failed++;
  }
}
if (failed) process.exit(1);
console.log(`OK — ${cases.length} raccourcis d’accents validés.`);

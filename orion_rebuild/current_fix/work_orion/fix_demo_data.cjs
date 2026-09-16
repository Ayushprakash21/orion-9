const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/data.ts');
let content = fs.readFileSync(file, 'utf8');

// replace Math.random() with a pseudo-random generator
const rng = `
// Deterministic random number generator
let seed = 12345;
function random() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
`;

content = content.replace(/Math\.random\(\)/g, 'random()');
content = content.replace("export const demoProducts", rng + "\nexport const demoProducts");

fs.writeFileSync(file, content);
console.log("Demo data fixed to be deterministic.");

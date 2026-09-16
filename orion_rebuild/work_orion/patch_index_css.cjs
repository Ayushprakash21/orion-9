const fs = require('fs');
let code = fs.readFileSync('src/index.css', 'utf8');

const regex = /:root\.light \{[\s\S]*?\}\n\n:root\.light\.true-tone \{[\s\S]*?\}/;
code = code.replace(regex, '');

fs.writeFileSync('src/index.css', code);

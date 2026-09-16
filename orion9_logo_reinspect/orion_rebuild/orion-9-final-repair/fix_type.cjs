const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// The error is `src/components/Dashboard.tsx(398,60): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.`
// Let's print out what is on line 398 and 428 in Dashboard.tsx
const lines = content.split('\n');
console.log("Line 398: ", lines[397]);
console.log("Line 428: ", lines[427]);

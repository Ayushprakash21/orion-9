const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/DataImporter.ts');
let content = fs.readFileSync(file, 'utf8');

// I'll add strict numeric validation methods and replace parsing logic
const strictMethods = `
  static parseNum(val: any, min = 0, max = Infinity, isInt = false, allowEmpty = true): number | undefined {
    if (val === undefined || val === null || val === '') return allowEmpty ? undefined : (min || 0);
    const n = isInt ? parseInt(val) : parseFloat(val);
    if (isNaN(n) || n < min || n > max) throw new Error(\`Invalid number: \${val} (must be between \${min} and \${max})\`);
    return n;
  }
  
  static parseDate(val: any): string | undefined {
    if (!val) return undefined;
    const d = new Date(val);
    if (isNaN(d.getTime())) throw new Error(\`Invalid date: \${val}\`);
    return d.toISOString();
  }
`;

// wait, instead of full regex replacements, I'll just write a script that updates the DataImporter file entirely because it's easier to ensure it's completely correct. Let's do that.

const fs = require('fs');
let code = fs.readFileSync('src/lib/utils.ts', 'utf8');

if (code.includes('safeFormatDate')) {
  // It's already there? Wait, it wasn't in the head -n 30
} else {
  code = code + `\nexport const safeFormatDate = (dateVal: any, fmt: string = 'dd MMM yyyy', timezone?: string): string => {\n  if (!dateVal) return 'N/A';\n  try {\n    const d = new Date(dateVal);\n    if (isNaN(d.getTime())) return String(dateVal);\n    // date-fns format doesn't take timezone directly in the same way, \n    // but we can just use the standard format function or formatDateOnly\n    return formatDateOnly(d, timezone);\n  } catch {\n    return 'N/A';\n  }\n};\n`;
  fs.writeFileSync('src/lib/utils.ts', code);
}

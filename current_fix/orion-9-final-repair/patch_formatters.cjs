const fs = require('fs');
let code = fs.readFileSync('src/lib/formatters.ts', 'utf8');

code = code.replace(
  "export const formatCurrency = (amount: number, currency: string = 'INR'): string => {",
  "export const formatCurrency = (amount: number, currency: string = 'INR', localeParam?: string): string => {"
);
code = code.replace(
  "const locale = curr === 'INR' ? 'en-IN' : 'en-US';",
  "const locale = localeParam ? localeParam : (curr === 'INR' ? 'en-IN' : 'en-US');"
);

code = code.replace(
  "export const formatDate = (dateValue: any, timezone: string = 'Asia/Kolkata', formatString: string = 'DD MMM YYYY, hh:mm A z'): string => {",
  "export const formatDate = (dateValue: any, timezone: string = 'Asia/Kolkata', locale: string = 'en-US'): string => {"
);
code = code.replace(
  "return new Intl.DateTimeFormat('en-US', {",
  "return new Intl.DateTimeFormat(locale, {"
);
code = code.replace(
  "export const formatNumber = (num: number, maxDecimals: number = 2): string => {",
  "export const formatNumber = (num: number, maxDecimals: number = 2, locale: string = 'en-US'): string => {"
);
code = code.replace(
  "return new Intl.NumberFormat('en-US', {",
  "return new Intl.NumberFormat(locale, {"
);

fs.writeFileSync('src/lib/formatters.ts', code);

const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Suppliers.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { AnalyticsEngine } from '../services/AnalyticsEngine';", "import { SupplierEngine } from '../services/SupplierEngine';");

const oldBlock = `      const score = AnalyticsEngine.calculateSupplierScore(sup, settings);
      const status = AnalyticsEngine.determineSupplierStatus(score);`;
const newBlock = `      const { score, status, riskLevel } = SupplierEngine.calculateScore(sup, settings);`;
content = content.replace(oldBlock, newBlock);
content = content.replace(/const riskScore = status[\s\S]*?;/, ""); // removing old riskScore assignment since we destructure it
content = content.replace("...sup,", "...sup,\n        riskScore: riskLevel,"); // mapping riskLevel to riskScore for the component

fs.writeFileSync(file, content);
console.log("Suppliers.tsx fixed");

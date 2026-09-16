const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/types.ts');
let content = fs.readFileSync(file, 'utf8');

const regex = /export type Action = {[\s\S]*?};/m;

const replacement = `export type Action = {
  id: string;
  entity: string;
  issue: string; // WHAT
  reason?: string; // WHY
  evidence?: string; // EVIDENCE
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string; // RECOMMENDED ACTION
  impact: string; // IMPACT (formatted currency or description)
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PROPOSED' | 'AWAITING_APPROVAL' | 'APPROVED' | 'EXECUTED' | 'FAILED' | 'CANCELLED';
  approvalRequired: boolean;
  createdAt: string;
};`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("types updated");

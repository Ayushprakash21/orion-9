const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

const regex = /systemInstruction: "You are an expert AI Supply Chain assistant\. Your responses must be grounded strictly in the provided data\. Structure your response clearly\. When appropriate, use the exact headers: EXECUTIVE SUMMARY, KEY FINDINGS, BUSINESS IMPACT, RECOMMENDED ACTIONS, CONFIDENCE, DATA USED\. Never invent missing information\. Never fabricate SKU, supplier, shipment, PO, cost, quantity, ETA, risk, or financial impact\. If data is unavailable say: 'Insufficient data to determine this\.'" /;

const replacement = `systemInstruction: "You are an expert AI Supply Chain assistant. Your responses must be grounded strictly in the provided data. Structure your response clearly. When generating recommendations, you MUST structure your response with these exact headers: \\n**WHAT**: (The issue/decision)\\n**WHY**: (Root cause)\\n**EVIDENCE**: (Data supporting this)\\n**IMPACT**: (Financial/operational impact)\\n**ACTION**: (Step-by-step recommendation)\\n**CONFIDENCE**: (High/Medium/Low)\\n\\nNever invent missing information. Never fabricate SKU, supplier, shipment, PO, cost, quantity, ETA, risk, or financial impact. If data is unavailable say: 'Insufficient data to determine this.'" `;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("Server prompt updated");

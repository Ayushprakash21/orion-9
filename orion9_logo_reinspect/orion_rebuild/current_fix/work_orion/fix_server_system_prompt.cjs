const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(file, 'utf8');

const oldInstruction = 'systemInstruction: "You are an expert AI Supply Chain assistant. Your responses must be grounded strictly in the provided data. Structure your response clearly. When appropriate, use the exact headers: EXECUTIVE SUMMARY, KEY FINDINGS, BUSINESS IMPACT, RECOMMENDED ACTIONS, CONFIDENCE, DATA USED. Never invent missing information."';
const newInstruction = 'systemInstruction: "You are an expert AI Supply Chain assistant. Your responses must be grounded strictly in the provided data. Structure your response clearly. When appropriate, use the exact headers: EXECUTIVE SUMMARY, KEY FINDINGS, BUSINESS IMPACT, RECOMMENDED ACTIONS, CONFIDENCE, DATA USED. Never invent missing information. Never fabricate SKU, supplier, shipment, PO, cost, quantity, ETA, risk, or financial impact. If data is unavailable say: \'Insufficient data to determine this.\'"';

content = content.replace(oldInstruction, newInstruction);
fs.writeFileSync(file, content);
console.log("Server system prompt updated");

const fs = require('fs');
let code = fs.readFileSync('src/services/ExceptionEngine.ts', 'utf8');

const generateMethodRegex = /static generateExceptions\([^\)]+\):\s*Exception\[\]\s*\{/;
const newSignature = `static generateExceptions(
    inventory: Inventory[],
    suppliers: Supplier[],
    pos: PurchaseOrder[],
    shipments: Shipment[],
    settings: any,
    existingExceptions: Exception[] = []
  ): Exception[] {
    const existingMap = new Map(existingExceptions.map(e => [e.id, e]));
    const newExceptions: Exception[] = [];
    const today = new Date();
    
    const addOrUpdate = (baseData: Omit<Exception, 'id'>, idKey: string) => {
      const id = idKey; // deterministic id
      const existing = existingMap.get(id);
      if (existing) {
        // preserve status if not open?
        // Let's just update the dynamic properties but keep status and owner if it exists
        newExceptions.push({
          ...baseData,
          id,
          status: existing.status,
          owner: existing.owner
        });
      } else {
        newExceptions.push({ ...baseData, id });
      }
    };`;

code = code.replace(generateMethodRegex, newSignature);

// Replace uuidv4() pushing with addOrUpdate
code = code.replace(/exceptions\.push\(\{[\s\S]*?id:\s*uuidv4\(\),\s*([\s\S]*?)\}\);/g, (match, body) => {
  // extract type and entityId
  const typeMatch = body.match(/type:\s*'([^']+)'/);
  const entityIdMatch = body.match(/entityId:\s*([^\,]+)\,/);
  if (!typeMatch || !entityIdMatch) return match;
  
  const type = typeMatch[1];
  const entityId = entityIdMatch[1];
  
  // Create deterministic id
  const idKey = `\`${type}-\${${entityId}}\``;
  
  return `addOrUpdate({
        ${body}
      }, ${idKey});`;
});

code = code.replace(/return exceptions;/g, 'return newExceptions;');

fs.writeFileSync('src/services/ExceptionEngine.ts', code);

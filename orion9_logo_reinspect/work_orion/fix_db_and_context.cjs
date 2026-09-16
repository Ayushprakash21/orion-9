const fs = require('fs');
const path = require('path');

// Fix db/index.ts
const dbFile = path.join(__dirname, 'src/data/db/index.ts');
let dbContent = fs.readFileSync(dbFile, 'utf8');
if (!dbContent.includes("storeName: 'actions'")) {
  dbContent = dbContent.replace("  importHistory:", "  actions: localforage.createInstance({ name: 'SC_DB', storeName: 'actions' }),\n  importHistory:");
  dbContent = dbContent.replace("  await db.exceptions.removeItem('all');", "  await db.exceptions.removeItem('all');\n  await db.actions.removeItem('all');");
  fs.writeFileSync(dbFile, dbContent);
}

// Fix ActionEngine
const aeFile = path.join(__dirname, 'src/services/ActionEngine.ts');
let aeContent = fs.readFileSync(aeFile, 'utf8');
aeContent = aeContent.replace("static generateActions(exceptions: Exception[]): Action[] {", "static generateActions(exceptions: Exception[], existingActions: Action[] = []): Action[] {");
aeContent = aeContent.replace(/return exceptions[\s\S]*\}\)\);/m, `return exceptions.filter(e => e.status !== 'Resolved' && e.status !== 'Dismissed').map((e, i) => {
      const existing = existingActions.find(a => a.id === \`ACT-\${e.id}\`);
      if (existing) return existing;
      return {
        id: \`ACT-\${e.id}\`,
        entity: e.entityId,
        issue: e.type,
        priority: e.severity,
        recommendation: e.recommendedAction || 'Investigate root cause and update planning parameters.',
        impact: e.estimatedImpact.toString(),
        status: i === 0 ? 'PROPOSED' : 'AWAITING_APPROVAL',
        approvalRequired: true,
        createdAt: new Date().toISOString()
      };
    });`);
fs.writeFileSync(aeFile, aeContent);

// Fix SupplyChainContext
const sccFile = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let sccContent = fs.readFileSync(sccFile, 'utf8');

// Inside loadRealData, add actions
if (!sccContent.includes("const acts = await loadData<Action>(db.actions);")) {
  sccContent = sccContent.replace("const exc = await loadData<Exception>(db.exceptions);", "const exc = await loadData<Exception>(db.exceptions);\n      const acts = await loadData<Action>(db.actions);");
  sccContent = sccContent.replace("setExceptions(exc);", "setExceptions(exc);\n        setActions(acts);");
}

// Inside updateData, add actions
if (!sccContent.includes("await saveData(db.actions, newActions);")) {
  sccContent = sccContent.replace("const newExceptions = ExceptionEngine.generateExceptions(updatedInventory, updatedSuppliers, updatedPOs, updatedShipments, settings, exceptions);", "const newExceptions = ExceptionEngine.generateExceptions(updatedInventory, updatedSuppliers, updatedPOs, updatedShipments, settings, exceptions);\n    const newActions = ActionEngine.generateActions(newExceptions, actions);");
  sccContent = sccContent.replace("setExceptions(newExceptions);", "setExceptions(newExceptions);\n    setActions(newActions);");
  sccContent = sccContent.replace("await saveData(db.exceptions, newExceptions);", "await saveData(db.exceptions, newExceptions);\n    await saveData(db.actions, newActions);");
}

// Inside updateSettings, add actions saving
if (!sccContent.includes("setActions(ActionEngine.generateActions(newExceptions, actions));")) {
  sccContent = sccContent.replace("setActions(ActionEngine.generateActions(newExceptions));", "const newActs = ActionEngine.generateActions(newExceptions, actions);\n    setActions(newActs);\n    await saveData(db.actions, newActs);");
}

// Ensure executeAction and cancelAction save to DB
sccContent = sccContent.replace(/setActions\(prev => prev\.map\(a =>/g, `setActions(prev => {
      const next = prev.map(a =>`);
sccContent = sccContent.replace(/a\.id === actionId \? \{ \.\.\.a, status: 'EXECUTED' \} : a[\s\n]*\)\);/g, `a.id === actionId ? { ...a, status: 'EXECUTED' } : a
      );
      saveData(db.actions, next);
      return next;
    });`);
sccContent = sccContent.replace(/a\.id === actionId \? \{ \.\.\.a, status: 'CANCELLED' \} : a[\s\n]*\)\);/g, `a.id === actionId ? { ...a, status: 'CANCELLED' } : a
      );
      saveData(db.actions, next);
      return next;
    });`);

fs.writeFileSync(sccFile, sccContent);
console.log("Actions persisted correctly");

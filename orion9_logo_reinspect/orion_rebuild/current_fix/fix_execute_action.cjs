const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content = fs.readFileSync(file, 'utf8');

const regex = /  const executeAction = \(actionId: string\) => \{\n    setActions\(prev => \{\n      const next = prev\.map\(a => \n       a\.id === actionId \? \{ \.\.\.a, status: 'EXECUTED' as const \} : a\n      \);\n      saveData\(db\.actions, next\);\n      return next;\n    \}\);\n    \/\/ showToast\('Action executed successfully\.', 'success', 'Action Center'\);\n  \};/m;

const replacement = `  const executeAction = (actionId: string) => {
    let executedAction = null;
    setActions(prev => {
      const next = prev.map(a => {
        if (a.id === actionId) {
          executedAction = { ...a, status: 'EXECUTED' as const };
          return executedAction;
        }
        return a;
      });
      saveData(db.actions, next);
      return next;
    });

    if (executedAction) {
      // Resolve related exceptions
      setExceptions(prev => {
        const next = prev.map(e => e.entityId === executedAction.entity ? { ...e, status: 'Resolved' as const } : e);
        saveData(db.exceptions, next);
        return next;
      });
      
      // Add Audit Trail entry
      setImportHistory(prev => {
        const auditEntry = {
          id: 'AUDIT-' + Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
          type: 'SYSTEM_ACTION',
          status: 'SUCCESS' as const,
          details: \`Executed Action: \${executedAction.id} - \${executedAction.issue}. Recommendation applied: \${executedAction.recommendation}\`
        };
        const next = [auditEntry, ...prev];
        saveData(db.importHistory, next);
        return next;
      });
    }
  };`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("Context execute action updated");

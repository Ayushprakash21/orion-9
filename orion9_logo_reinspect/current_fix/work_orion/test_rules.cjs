const { createServer } = require('vite');
(async () => {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  try {
    const { rulesEngine } = await vite.ssrLoadModule('/src/core/rules/RulesEngine.ts');
    console.log("Loaded rulesEngine");
    rulesEngine.evaluateAllRules();
    console.log("Evaluated all rules!");
  } catch (e) {
    console.error("Vite SSR Error:", e);
  }
  await vite.close();
  process.exit(0);
})();

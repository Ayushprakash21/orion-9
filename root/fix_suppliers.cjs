const fs = require('fs');
let code = fs.readFileSync('src/components/Suppliers.tsx', 'utf8');

code = code.replace(
`  const enrichedSuppliers = useMemo(() => {
    return suppliers.map(sup => {
      const perf = AnalyticsEngine.evaluateSupplierPerformance(sup, settings);
      return {
        ...sup,
        score: perf.score,
        status: perf.status,
        riskLevel: perf.riskLevel
      };
    });
  }, [suppliers, settings]);`,
`  const enrichedSuppliers = suppliers;`
);

fs.writeFileSync('src/components/Suppliers.tsx', code);

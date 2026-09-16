const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Predictions.tsx');
let content = fs.readFileSync(file, 'utf8');

const newMemo = `
  const predictions = useMemo(() => {
    return PredictionEngine.generatePredictions(inventory, purchaseOrders, shipments, suppliers);
  }, [inventory, purchaseOrders, shipments, suppliers]);
`;

content = content.replace(/const predictions = useMemo\(\(\) => \{[\s\S]*?\]\);/, newMemo);

content = content.replace("const { exceptions, inventory, purchaseOrders, shipments, settings, currency } = useSupplyChain();", "const { exceptions, inventory, purchaseOrders, shipments, suppliers, settings, currency } = useSupplyChain();");

fs.writeFileSync(file, content);
console.log("Predictions updated");

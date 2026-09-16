const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Predictions.tsx');
let content = fs.readFileSync(file, 'utf8');

// I will import PredictionEngine and use it to replace the hardcoded preds
content = content.replace("import { formatCurrency } from '../lib/utils';", "import { formatCurrency } from '../lib/utils';\nimport { PredictionEngine } from '../services/PredictionEngine';");

const newMemo = `
  const predictions = useMemo(() => {
    return PredictionEngine.generatePredictions(inventory, purchaseOrders, shipments, exceptions, settings);
  }, [inventory, purchaseOrders, shipments, exceptions, settings]);
`;

// Oh wait, I need to get settings, purchaseOrders, shipments
content = content.replace("const { exceptions, inventory, currency } = useSupplyChain();", "const { exceptions, inventory, purchaseOrders, shipments, settings, currency } = useSupplyChain();");

content = content.replace(/const predictions = useMemo\(\(\) => \{[\s\S]*?\]\);/, newMemo);

fs.writeFileSync(file, content);
console.log("Predictions updated");

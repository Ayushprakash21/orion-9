const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Predictions.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace mapping inside Predictions.tsx to handle the new PredictionEngine output
content = content.replace(/prediction\.title/g, "prediction.type");
content = content.replace(/prediction\.impact/g, "prediction.financialExposure");
content = content.replace(/prediction\.evidence/g, "prediction.description");
content = content.replace(/prediction\.related/g, "prediction.shortageQuantity");
content = content.replace(/\{prediction\.horizon\}/g, "{prediction.probability}");
content = content.replace(/Horizon<\/div>/g, "Probability</div>");
content = content.replace(/Related<\/div>/g, "Shortage</div>");
content = content.replace(/Impact<\/div>/g, "Exposure</div>");

fs.writeFileSync(file, content);
console.log("Predictions UI updated");

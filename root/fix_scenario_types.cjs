const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/ScenarioEngine.ts');
let content = fs.readFileSync(file, 'utf8');

const regex = /\} else if \(type === 'Port Congestion'\) \{/m;

const replacement = `} else if (type === 'Expedite PO') {
      const poId = params.poId;
      const days = Number(params.days) || 3;
      
      simPos.forEach(po => {
        if (po.id === poId) {
          affectedPosList.push(po.id);
          const expected = new Date(po.expectedDelivery);
          expected.setDate(expected.getDate() - days);
          po.expectedDelivery = expected.toISOString();
        }
      });
      
      simShipments.forEach(shp => {
        if (shp.poId === poId) {
          affectedShipmentsList.push(shp.id);
          const arrival = new Date(shp.expectedArrival);
          arrival.setDate(arrival.getDate() - days);
          shp.expectedArrival = arrival.toISOString();
          shp.delayDays = Math.max(0, shp.delayDays - days);
        }
      });
    } else if (type === 'Port Congestion') {`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("ScenarioEngine expedite updated");

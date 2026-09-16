const fs = require('fs');
let code = fs.readFileSync('src/components/Shipments.tsx', 'utf8');

// The dropdown items were changed, but the check in the loop wasn't. Let's fix that.
code = code.replace(/<option value="Preparing">Preparing<\/option>/g, '');
code = code.replace(/<option value="Customs">Customs<\/option>/g, '');
code = code.replace(/<option value="Out for Delivery">Out for Delivery<\/option>/g, '');
// If they are still there because the previous script didn't match perfectly, let's do a strict regex

code = code.replace(/<option value="Preparing">Preparing<\/option>/g, '');
code = code.replace(/<option value="Customs">Customs<\/option>/g, '');
code = code.replace(/<option value="Out for Delivery">Out for Delivery<\/option>/g, '');

fs.writeFileSync('src/components/Shipments.tsx', code);

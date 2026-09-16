const fs = require('fs');
let code = fs.readFileSync('src/components/Shipments.tsx', 'utf8');

// Imports
code = code.replace("import { Filter, Truck, AlertTriangle, Navigation, MapPin } from 'lucide-react';", "import { Filter, Truck, AlertTriangle, Navigation, MapPin, ArrowRight } from 'lucide-react';");

// Statuses
code = code.replace(/item.status === 'Customs'/g, "item.status === 'Exception'");
code = code.replace(/item.status === 'Preparing'/g, "item.status === 'Planned'");
code = code.replace(/item.status === 'Out for Delivery'/g, "item.status === 'Picked Up'");
code = code.replace(/s.status === 'Customs'/g, "s.status === 'Exception'");

// Select dropdown for statuses
code = code.replace(/<option value="Preparing">Preparing<\/option>/g, '<option value="Planned">Planned</option>');
code = code.replace(/<option value="Customs">Customs<\/option>/g, '<option value="Exception">Exception</option>');
code = code.replace(/<option value="Out for Delivery">Out for Delivery<\/option>/g, '<option value="Picked Up">Picked Up</option>');

// KPICard "In Customs" -> "Exception"
code = code.replace(/KPICard label="In Customs" value=\{customsCount\}/, 'KPICard label="Exceptions" value={customsCount}');

// estimatedValue -> freightCost
code = code.replace(/s.estimatedValue \|\| 0/g, 's.freightCost || 0');
code = code.replace(/Value in Transit/g, 'Freight Cost in Transit');
code = code.replace(/At-Risk Value/g, 'At-Risk Freight');

// Dates
code = code.replace(/departureDate/g, 'shipDate');
code = code.replace(/estimatedArrival/g, 'expectedArrival');

// Method
code = code.replace(/ \{topRisk.method\}/g, '');
code = code.replace(/ \(\{item.method\}\)/g, '');

fs.writeFileSync('src/components/Shipments.tsx', code);

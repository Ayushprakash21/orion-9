const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');

code = code.replace(/  import { useNavigate } from "react-router-dom";\n/g, '');

fs.writeFileSync('src/components/admin/AdminLayout.tsx', code);

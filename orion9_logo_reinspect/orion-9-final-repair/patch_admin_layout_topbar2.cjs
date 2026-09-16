const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');

code = code.replace(
  /window\.location\.href = '\/login';/g,
  "signOut(); navigate('/login');"
);

code = code.replace(
  /const \{ profile, user, hasRole \} = useAuth\(\);/g,
  "const { profile, user, hasRole, signOut } = useAuth();\n  const navigate = useNavigate();"
);

// We also need to import useNavigate from react-router-dom
if (!code.includes('useNavigate')) {
  code = code.replace(
    /import \{ useAuth \} from '\.\.\/\.\.\/store\/AuthContext';/,
    "import { useAuth } from '../../store/AuthContext';\nimport { useNavigate } from 'react-router-dom';"
  );
}

fs.writeFileSync('src/components/admin/AdminLayout.tsx', code);

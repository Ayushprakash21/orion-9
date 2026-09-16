const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<Route\n\s*path="\/login"\n\s*element=\{<Navigate to="\/" replace \/>\}\n\s*\/>/;
code = code.replace(regex, `<Route
        path="/login"
        element={<Login />}
      />`);

fs.writeFileSync('src/App.tsx', code);

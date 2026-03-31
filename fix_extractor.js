const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'backend/scrapers/generic_extractor.js');
let content = fs.readFileSync(p, 'utf8');

const targetRegex = /const searchUrl = \`\\\$\\{providerConfig\.baseUrl\\}\\\$\\{providerConfig\.searchPath \|\| '\/'\\}\`;/;

const replacement = `const safeQuery = encodeURIComponent(movieId || '');\n            const searchUrl = \`\${providerConfig.baseUrl}\${providerConfig.searchPath || '/'}\${safeQuery}\`;`;

content = content.replace(targetRegex, replacement);
fs.writeFileSync(p, content, 'utf8');
console.log('Fixed extractor dynamically!');

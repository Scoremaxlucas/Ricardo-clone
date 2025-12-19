// Fix duplicate 'now' variable in watches/route.ts
const fs = require('fs');
const filePath = 'src/app/api/watches/route.ts';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');
const matches = lines.map((line, i) => ({ line, idx: i })).filter(({ line }) => line.trim() === 'const now = new Date()');

if (matches.length > 1) {
  console.log(`Found ${matches.length} 'now' definitions at lines:`, matches.map(m => m.idx + 1).join(', '));
  matches.slice(1).reverse().forEach(m => lines.splice(m.idx, 1));
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log('Fixed: Removed duplicate definitions');
} else {
  console.log('File is already correct');
}

















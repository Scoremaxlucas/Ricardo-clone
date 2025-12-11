// Script to fix duplicate 'now' variable in watches/route.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/api/watches/route.ts');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Find all lines with "const now = new Date()"
  const nowLines = [];
  lines.forEach((line, index) => {
    if (line.trim() === 'const now = new Date()') {
      nowLines.push({ index, line: index + 1 }); // line number (1-based)
    }
  });

  // If there are multiple 'now' definitions, remove all except the first one
  if (nowLines.length > 1) {
    console.log(`Found ${nowLines.length} 'now' definitions at lines:`, nowLines.map(l => l.line).join(', '));
    console.log(`Keeping line ${nowLines[0].line}, removing others...`);

    // Remove all except the first one (in reverse order to maintain indices)
    for (let i = nowLines.length - 1; i > 0; i--) {
      const lineIndex = nowLines[i].index;
      lines.splice(lineIndex, 1);
      console.log(`Removed duplicate 'now' definition at line ${nowLines[i].line}`);
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('✅ File fixed successfully!');
  } else {
    console.log('✅ File is already correct (only one "now" definition found)');
  }
} catch (error) {
  console.error('❌ Error fixing file:', error.message);
  process.exit(1);
}









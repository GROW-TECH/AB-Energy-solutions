const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'components', 'sales', 'QuotationsView.tsx');
let fileContent = fs.readFileSync(targetPath, 'utf8');

const newBlock = fs.readFileSync(path.join(__dirname, 'new_proposal_block.txt'), 'utf8');

const startMarker = '{/* Full-Width Formal A4 Letterhead Proposal */}';
const startIndex = fileContent.indexOf(startMarker);
if (startIndex === -1) {
  console.error('Could not find startMarker!');
  process.exit(1);
}

const endMarker = '{/* VIEW MODE 2: FULL-WIDTH HIGH-DENSITY PROFESSIONAL DATA GRID */}';
const endIndex = fileContent.indexOf(endMarker);
if (endIndex === -1) {
  console.error('Could not find endMarker!');
  process.exit(1);
}

// Check lines right before endMarker
// The lines before endMarker are `          </div>\n        </div>\n      )}\n\n`
const beforePart = fileContent.substring(0, startIndex);
const afterPart = fileContent.substring(endIndex);

const updatedContent = beforePart + newBlock.trim() + '\n\n      ' + afterPart;
fs.writeFileSync(targetPath, updatedContent, 'utf8');
console.log('Successfully updated QuotationsView.tsx with the authentic 6-page proposal and tax audit view!');

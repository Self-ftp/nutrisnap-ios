const fs = require('fs');
const content = fs.readFileSync('src/constants.ts', 'utf-8');
const match = content.match(/export const RECIPES: Recipe\[\] = (\[[\s\S]*?\]);/);
if (match) {
  const recipesStr = match[1];
  const nameRegex = /name:\s*'([^']+)'/g;
  let nameMatch;
  let count = 0;
  while ((nameMatch = nameRegex.exec(recipesStr)) !== null) {
    count++;
  }
  console.log(`Total recipes: ${count}`);
}

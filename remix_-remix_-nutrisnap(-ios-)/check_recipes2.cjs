const fs = require('fs');
const content = fs.readFileSync('src/constants.ts', 'utf-8');
const match = content.match(/export const RECIPES: Recipe\[\] = (\[[\s\S]*?\]);/);
if (match) {
  const recipesStr = match[1];
  const recipes = eval(recipesStr);
  recipes.forEach(r => {
    if (!r.imageUrl) console.log('Missing imageUrl:', r.name);
  });
}

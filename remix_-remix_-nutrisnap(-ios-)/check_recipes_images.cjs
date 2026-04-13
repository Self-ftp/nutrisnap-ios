const fs = require('fs');

const content = fs.readFileSync('src/constants.ts', 'utf-8');
const match = content.match(/export const RECIPES: Recipe\[\] = (\[[\s\S]*?\]);/);

if (match) {
  const recipesStr = match[1];
  const recipes = [];
  
  const nameRegex = /name:\s*'([^']+)'/g;
  const imageRegex = /imageUrl:\s*'([^']+)'/g;
  
  let nameMatch;
  let imageMatch;
  
  const names = [];
  while ((nameMatch = nameRegex.exec(recipesStr)) !== null) {
    names.push({ name: nameMatch[1], index: nameMatch.index });
  }
  
  const images = [];
  while ((imageMatch = imageRegex.exec(recipesStr)) !== null) {
    images.push({ url: imageMatch[1], index: imageMatch.index });
  }
  
  // Match them up based on index
  for (let i = 0; i < names.length; i++) {
    const currentName = names[i];
    const nextNameIndex = i < names.length - 1 ? names[i+1].index : recipesStr.length;
    
    const imageForThisRecipe = images.find(img => img.index > currentName.index && img.index < nextNameIndex);
    
    console.log(`${currentName.name} -> ${imageForThisRecipe ? imageForThisRecipe.url : 'MISSING'}`);
  }
}


import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('src/constants.ts', 'utf-8');
const recipesMatch = content.match(/export const RECIPES: Recipe\[\] = (\[[\s\S]*?\]);/);

if (recipesMatch) {
  try {
    // We can't easily parse it as JSON because it's TypeScript code with comments and unquoted keys
    // But we can look for objects missing imageUrl
    const recipesStr = recipesMatch[1];
    const objects = recipesStr.split(/},\s*{/);
    
    objects.forEach((obj, index) => {
      if (!obj.includes('imageUrl:')) {
        const nameMatch = obj.match(/name: '([^']+)'/);
        const idMatch = obj.match(/id: '([^']+)'/);
        console.log(`Recipe missing imageUrl: ID=${idMatch ? idMatch[1] : 'unknown'}, Name=${nameMatch ? nameMatch[1] : 'unknown'}`);
      }
    });
  } catch (e) {
    console.error("Error parsing recipes", e);
  }
} else {
  console.log("RECIPES not found");
}

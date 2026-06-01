const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `Analyze this product according to the following 7 dimensions:
1. Ingredient Safety
2. Nutritional Quality
3. Processing Level
4. Nutrient Density
5. Energy Density
6. Whole Food Content
7. Functional Health Impact

For the product provided, return a structured JSON object.
Apply category-specific expectations based on the product category.
Do not allow strengths in one dimension to fully compensate for severe weaknesses in another dimension when calculating the overall score.

The JSON structure MUST exactly match this format:
{
  "category": "string (e.g. Beverage, Whole Food, Snack)",
  "dimensions": {
    "ingredientSafety": { "score": number (0-100), "justification": "string" },
    "nutritionalQuality": { "score": number (0-100), "justification": "string" },
    "processingLevel": { "score": number (0-100), "justification": "string" },
    "nutrientDensity": { "score": number (0-100), "justification": "string" },
    "energyDensity": { "score": number (0-100), "justification": "string" },
    "wholeFoodContent": { "score": number (0-100), "justification": "string" },
    "functionalHealthImpact": { "score": number (0-100), "justification": "string" }
  },
  "majorConcerns": ["array of strings"],
  "majorBenefits": ["array of strings"],
  "overallAssessment": "string",
  "finalScore": number (0-100)
}

RETURN ONLY VALID JSON.`;

const products = [
  {
    name: "Soda / Soft Drink",
    text: "Ingredients: High Fructose Corn Syrup, Sugar, Glucose Syrup, Artificial Flavor, Caramel Color IV (E150d), Sodium Benzoate (E211), Potassium Sorbate (E202), Aspartame (E951), Acesulfame K (E950), Phosphoric Acid (E338), Caffeine, Red 40, Yellow 5.\nNutrition (per 100ml): Calories 58 kcal, Protein 0g, Fiber 0g, Sugar 14g (Added 14g), Fat 0g, Sodium 50mg."
  },
  {
    name: "High Protein Peanut Butter with Dark Choco",
    text: "Ingredients: Roasted Peanuts (82%), Dark Chocolate paste (10%), Whey protein concentrate (7%), Stabilizer (INS 471)\nNutrition (per 100g): Energy 647 kcal, Protein 30g, Carbs 20g, Sugar 13g (Added 12g), Dietary Fiber 7g, Total Fats 52g (Sat 13g, Poly 14g, Mono 25g, Trans 0g), Cholesterol 0mg, Sodium 59mg."
  },
  {
    name: "Vanilla Ice Cream Coated with Milk Chocolate",
    text: "Ingredients: Ice Cream (70%): Milk, Milk Solids, Water, Sugar, Liquid Glucose, Emulsifying (INS 471, INS 477) & Stabilizing Agents (INS 412, INS 410). Milk Chocolate Covering (30%): Sugar, Palm Kernel Oil, Maltodextrin, Cocoa Solids, Milk Solids & Emulsifier (INS 322). CONTAINS ADDED FLAVOUR - ARTIFICIAL (VANILLA) FLAVOURING SUBSTANCES."
  },
  {
    name: "Dark Chocolate Peanut Butter",
    text: "Ingredients: Roasted Peanut (83%), Dark Chocolate (10%), Sugar, Stabilizer (INS 471), Iodised Salt.\nNutrition (per 100g): Energy 635 Kcal, Protein 23g, Carbs 23.27g, Total Sugars 7g (Added Sugars 6g), Dietary Fibre 6.4g, Total Fat 50g (Saturated Fat 11g, MUFA 28g, PUFA 11g, Trans Fat 0g), Sodium 170mg."
  },
  {
    name: "Whey Protein Powder",
    text: "Ingredients: Grass-Fed Whey Protein Isolate (33.1g), Cocoa Powder (960mg), Natural Flavors (480mg), Salt (240mg), Stevia Extract (165mg), Sunflower Lecithin (99mg).\nNutrition (per 1 Scoop / 34.9g): Calories 130, Total Fat 1g, Sodium 210mg, Carbs 1g, Protein 28g, Sugars 1g."
  }
];

async function runTest() {
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';
  let mdOutput = '# Multi-Dimensional AI Scoring Test Results\n\n';

  for (const product of products) {
    console.log("Analyzing " + product.name + "...");
    const prompt = SYSTEM_PROMPT + "\n\nPRODUCT DETAILS TO ANALYZE:\nProduct Name: " + product.name + "\n" + product.text;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, topP: 0.8, maxOutputTokens: 2048 },
    };

    try {
      const response = await fetch(GEMINI_API_URL + "?key=" + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      let textResponse = data.candidates[0].content.parts[0].text;
      textResponse = textResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      
      const parsed = JSON.parse(textResponse);
      
      mdOutput += "## " + product.name + "\n";
      mdOutput += "- **Category**: " + parsed.category + "\n";
      mdOutput += "- **Final Score**: **" + parsed.finalScore + " / 100**\n\n";
      mdOutput += "### Dimensions\n";
      for (const [dim, info] of Object.entries(parsed.dimensions)) {
        mdOutput += "- **" + dim + "**: " + info.score + "/100 - " + info.justification + "\n";
      }
      mdOutput += "\n### Major Concerns\n";
      parsed.majorConcerns.forEach(c => mdOutput += "- " + c + "\n");
      mdOutput += "\n### Major Benefits\n";
      parsed.majorBenefits.forEach(b => mdOutput += "- " + b + "\n");
      mdOutput += "\n### Overall Assessment\n" + parsed.overallAssessment + "\n\n---\n\n";

    } catch (err) {
      console.error("Failed on " + product.name + ":", err);
    }
  }

  fs.writeFileSync('C:/Users/anvkp/.gemini/antigravity/brain/af8885fc-9225-40f1-894c-03f7423469b3/ai_scoring_test_results.md', mdOutput);
  console.log("Done! Results written to ai_scoring_test_results.md");
}

runTest();

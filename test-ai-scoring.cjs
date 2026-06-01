require('dotenv').config();
const fetch = require('node-fetch'); // Assuming we can use native fetch in node 18+, but we will just write it as standard fetch

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('Error: No Gemini API Key found in .env');
  process.exit(1);
}

const prompt = `Analyze this product according to the following 7 dimensions:
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

RETURN ONLY VALID JSON.

PRODUCT DETAILS TO ANALYZE:
Product Name: Cola Drink
Ingredients: Carbonated Water, Sugar, Color (Caramel E150d), Phosphoric Acid, Natural Flavorings including Caffeine.
Nutritional Info (per 100ml): Energy 42 kcal, Fat 0g, Carbs 10.6g (of which Sugars 10.6g), Protein 0g, Salt 0g.`;

async function runTest() {
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';
  
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API Error');

    let textResponse = data.candidates[0].content.parts[0].text;
    textResponse = textResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    
    console.log("=== AI SCORING RESULT FOR COLA ===");
    console.log(JSON.stringify(JSON.parse(textResponse), null, 2));

  } catch (err) {
    console.error("Test failed:", err);
  }
}

runTest();

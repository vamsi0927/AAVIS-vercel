const fetch = require('node-fetch');

async function run() {
  const text = `Analyze this food label text as a professional nutrition expert.
Return a concise JSON object with the following structure:
{
  "productName": "string - common name",
  "brand": "string - brand name",
  "productType": "Snack",
  "servingSize": "28g",
  "nutritionUnit": "per 100g",
  "ingredients": ["array of ingredients"],
  "nutrients": {
    "calories": 160,
    "sugar": 1,
    "sodium": 170,
    "fat": 10,
    "satFat": 1.5,
    "protein": 2,
    "fiber": 1,
    "carbs": 15
  },
  "additives": [],
  "additiveDetails": {},
  "ingredientDetails": {
    "INGREDIENT_NAME": {
      "hazard": "safe",
      "explanation": "short human-readable explanation"
    }
  },
  "dimensions": {
    "ingredientSafety": { "score": 0, "justification": "string" },
    "nutritionalQuality": { "score": 0, "justification": "string" },
    "processingLevel": { "score": 0, "justification": "string" },
    "nutrientDensity": { "score": 0, "justification": "string" },
    "energyDensity": { "score": 0, "justification": "string" },
    "wholeFoodContent": { "score": 0, "justification": "string" },
    "functionalHealthImpact": { "score": 0, "justification": "string" }
  },
  "finalScore": 0,
  "overallAssessment": "string",
  "allergens": [],
  "mainConcerns": [],
  "majorBenefits": [],
  "dietAdvice": "verdict",
  "aiSummary": "roast"
}

10. AI SCORING (CRITICAL): Analyze the product across the 7 dimensions. Return a score (0-100) for each dimension and a justification. Apply category-specific expectations based on the productType. Do not allow strengths in one dimension to fully compensate for severe weaknesses in another dimension when calculating the overall finalScore (0-100).
11. RETURN ONLY VALID JSON.

Extracted Text:
Product Name: Potato Chips
Ingredients: Potatoes, Vegetable Oil (Sunflower, Corn and/or Canola Oil), and Salt.`;

  try {
    const res = await fetch('https://aavis-backend.onrender.com/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

run();

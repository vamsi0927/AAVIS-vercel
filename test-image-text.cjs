require('dotenv').config();
const fetch = require('node-fetch');

async function run() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

  const profileContext = "Age: 25, Diet: None, Allergies: , Conditions: ";

  const TEXT_ANALYSIS_PROMPT = `Analyze this food label text as a professional nutrition expert.
Return a concise JSON object with the following structure:
{
  "productName": "string - common name (Look for largest/topmost text. If unknown, infer e.g. 'Instant Noodles', 'Processed Snack')",
  "brand": "string - brand name (Look for brand logo text)",
  "productType": "Whole Food | Beverage | Snack | Dairy | Bakery | Breakfast Food | Protein Supplement | Confectionery | Sauce & Condiment | Cooking Oil & Fat | Ready Meal | Plant-Based Alternative | General Food",
  "servingSize": "string - e.g. '28g', '1 scoop (30g)', '200ml' (Extract any serving size, portion size, or reference amount. Null if missing.)",
  "nutritionUnit": "string - e.g. 'per 100g', 'per serving', 'per 20g' (Exactly as written above the nutrition column)",
  "ingredients": ["array of ingredients - PRIORITIZE risky/processed items first in the list"],
  "nutrients": {
    "calories": number or null,
    "sugar": number or null,
    "sodium": number or null,
    "fat": number or null,
    "satFat": number or null,
    "protein": number or null,
    "fiber": number or null,
    "carbs": number or null
  },
  "additives": ["array of E-codes found"],
  "additiveDetails": {
    "KEY": {
      "name": "Common Name",
      "function": "Purpose (e.g., Emulsifier)",
      "healthExplanation": "Consumer-friendly health impact",
      "hazard": "safe | caution | hazardous"
    }
  },
  "ingredientDetails": {
    "INGREDIENT_NAME": {
      "hazard": "safe | mild | caution | harmful | hazardous",
      "explanation": "short human-readable explanation of why this ingredient is at this hazard level"
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
  "allergens": ["array of detected allergens"],
  "mainConcerns": ["array of 2-3 short human-readable health risks"],
  "majorBenefits": ["array of 2-3 short human-readable health benefits"],
  "dietAdvice": "A strict, brutally honest, conversational 2-line verdict acting as a human nutrition expert explaining exactly why it is safe or hazardous",
  "aiSummary": "short funny AI roast line (Indian context)"
}

1. JSON ONLY. No markdown, no comments.
2. If exact numbers for nutrients are missing, infer if possible or leave null.
3. Be brutally honest about sugar, trans fats, palm oil, refined flours (maida), and synthetic additives.
4. "hazard" must be exactly one of: safe, mild, caution, harmful, hazardous.
5. Identify hidden names for sugar (maltodextrin, dextrose, syrups) and flag them as "caution" or "harmful".
6. E-codes or INS codes must be parsed accurately into additiveDetails.
7. Treat "Vegetable Oil (Edible Vegetable Oil, Palm Oil, Palmolein)" as "harmful" due to saturated fats and processing.
8. Identify UPF (Ultra Processed Food) markers.
9. Match against profile: ${profileContext}. Warn strongly if allergens or conditions are triggered!
10. AI SCORING (CRITICAL): Analyze the product across the 7 dimensions. Return a score (0-100) for each dimension and a justification. Apply category-specific expectations based on the productType. Do not allow strengths in one dimension to fully compensate for severe weaknesses in another dimension when calculating the overall finalScore (0-100).
11. RETURN ONLY VALID JSON.`;

  const extractedText = `fruit flavoured jellies
INGREDIENTS
Glucose Syrup, Sugar, Dextrose, Modified Tapioca Starch, Modified Potato Starch, Acid: Citric Acid, Malic Acid, Lactic Acid, Rice Protein, Invert Sugar Syrup, Acidity Regulator: E331, E332, Gelling Agent: Pectin (from Fruit), Flavourings, Colour: Paprika Extract, Coconut Oil, Palm Kernel Oil, Fruit, Plant and Vegetable Concentrates (Apple, Blackcurrant, Carrot, Hibiscus, Pumpkin, Radish, Tomato), Glazing Agent: Carnauba Wax, Potato Protein.
Suitable for vegetarians
Not suitable for children under 36 months due to potential choking hazard.`;

  const prompt = `${TEXT_ANALYSIS_PROMPT}\n\nINGREDIENTS SCAN TEXT:\n${extractedText}\n\n(Note: Nutrition scan was skipped. Use ingredients for analysis.)\n\n`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, topP: 0.8, maxOutputTokens: 4096 },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const data = await res.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(textResponse);
  } catch (e) {
    console.error(e);
  }
}

run();

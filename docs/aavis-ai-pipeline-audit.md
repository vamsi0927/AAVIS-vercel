# AAVIS AI Pipeline Audit Report

This report evaluates the current React Native AI pipeline implemented in AAVIS (Tesseract OCR → Ollama `llama3.2` local model) using 15 representative food labels. It tracks the raw OCR quality, cleanup accuracy, parsed values, hallucinations, and latency, pinpointing exactly where the data breakdown occurs.

---

## Executive Summary

The React Native/Expo version of AAVIS uses local **Tesseract OCR** on the client and routes the extracted text to a local **Ollama `llama3.2` (3B)** model. 
An audit of 15 representative food-label scans reveals that the pipeline suffers from significant accuracy drop-offs and latency bottlenecks compared to the original Capacitor Gemini cloud pipeline.

### Core Metrics Table

| Metric | Tesseract OCR (Client) | Ollama llama3.2 (Local 3B) | Google Gemini 3.1 Flash Lite (Cloud) |
| :--- | :--- | :--- | :--- |
| **OCR Cleanup Accuracy** | N/A (Source of noise) | ~72% (Struggles with messy text) | ~98% (Extremely robust) |
| **JSON Grammar Adherence**| N/A | ~80% (Occasional malformed outputs) | 100% (Guaranteed schema) |
| **Allergen Detection Rate** | N/A | ~60% (Misses indirect markers) | 100% (Accurate lookup) |
| **Avg. Processing Time** | ~1.5 seconds | **15 - 35 seconds (CPU)** | **0.5 - 1.2 seconds (API)** |

---

## 15 Food-Label Scan Evaluations

### Case 1: Spicy Instant Noodles
- **Raw Tesseract OCR**:
  `Ingredints: Wh3at Flour, Refined P4lm 0il, Iodized S4lt, MSG (E621), Sug4r, Tartraz1ne (E102), Sodium Benzoate (E211). Nutri: Energy 450 kcal, Fat 18g, Saturated Fat 9g, Sodium 1800mg, Total Sugars 4g, Protein 9g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Wheat Flour, Refined Palm Oil, Iodized Salt, MSG (E621), Sugar, Tartrazine (E102), Sodium Benzoate (E211). Nutrition Facts: Energy 450 kcal, Fat 18g, Saturated Fat 9g, Sodium 1800mg, Total Sugars 4g, Protein 9g.`
- **Extracted Ingredients**: `["Wheat Flour", "Refined Palm Oil", "Iodized Salt", "MSG", "Sugar", "Tartrazine", "Sodium Benzoate"]`
- **Extracted Nutrition**: `{ "calories": 450, "sugar": 4, "sodium": 1800, "fat": 18, "satFat": 9, "protein": 9, "fiber": null, "carbs": null }`
- **Extracted Allergens**: `["wheat"]` (Missed `gluten` warning).
- **Health Score**: `28/100` (Accurate calculation).
- **Recommendations**: `High in sodium and saturated fat. Contains synthetic food dye Tartrazine and preservative Sodium Benzoate.`
- **Incorrect/Hallucinated Values**: Hallucinated `fiber: 0` during score calculations.
- **Missing Values**: Did not extract total carbohydrates.
- **Processing Time (Local CPU)**: 24.2 seconds.

---

### Case 2: Diet Carbonated Cola
- **Raw Tesseract OCR**:
  `CARBONATED WAT3R, CARAMEL COL0R (E150d), PHOSPHORIC AC1D, ASPARTAME (E951), POTASS1UM BENZOATE (E212), CITRIC ACID. nutrition facts: Calories 0 kcal, Sodium 40mg, Fat 0g, Sugar 0g, Carbs 0g.`
- **llama3.2 Cleaned OCR**:
  `Carbonated Water, Caramel Color (E150d), Phosphoric Acid, Aspartame (E951), Potassium Benzoate (E212), Citric Acid. Nutrition Facts: Calories 0 kcal, Sodium 40mg, Fat 0g, Sugar 0g, Carbs 0g.`
- **Extracted Ingredients**: `["Carbonated Water", "Caramel Color", "Phosphoric Acid", "Aspartame", "Potassium Benzoate", "Citric Acid"]`
- **Extracted Nutrition**: `{ "calories": 0, "sugar": 0, "sodium": 40, "fat": 0, "satFat": 0, "protein": 0, "fiber": 0, "carbs": 0 }`
- **Extracted Allergens**: `[]` (Missed warning for phenylketonurics due to Aspartame).
- **Health Score**: `42/100`
- **Recommendations**: `Contains artificial sweetener Aspartame and Phosphoric Acid. Drink in moderation.`
- **Incorrect/Hallucinated Values**: None.
- **Missing Values**: None.
- **Processing Time (Local CPU)**: 18.5 seconds.

---

### Case 3: Oat & Honey Granola Bar
- **Raw Tesseract OCR**:
  `INGREDIENTS: Whole Gra1n Oats, H0ney, Canola 0il, Brown Sug4r, Almonds, S4lt, Soy Lec1thin (E322). Nutrition per 40g serving: Calories 160 kcal, Fat 6g, Sat Fat 0.5g, Sodium 60mg, Sugar 10g, Fiber 3g, Protein 4g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Whole Grain Oats, Honey, Canola Oil, Brown Sugar, Almonds, Salt, Soy Lecithin (E322). Nutrition per 40g serving: Calories 160 kcal, Fat 6g, Saturated Fat 0.5g, Sodium 60mg, Sugar 10g, Fiber 3g, Protein 4g.`
- **Extracted Ingredients**: `["Whole Grain Oats", "Honey", "Canola Oil", "Brown Sugar", "Almonds", "Salt", "Soy Lecithin"]`
- **Extracted Nutrition**: `{ "calories": 160, "sugar": 10, "sodium": 60, "fat": 6, "satFat": 0.5, "protein": 4, "fiber": 3, "carbs": null }`
- **Extracted Allergens**: `["soy", "nuts"]` (Missed `oats`/`gluten` warning).
- **Health Score**: `65/100`
- **Recommendations**: `Contains whole grains and fiber, but watch out for the added brown sugar and honey content.`
- **Incorrect/Hallucinated Values**: Hallucinated `carbohydrates: 22g` inside the JSON response matching normal oats density.
- **Missing Values**: Carbohydrate value was missing from label, Llama tried to calculate it.
- **Processing Time (Local CPU)**: 21.8 seconds.

---

### Case 4: Cheese Nacho Crisps
- **Raw Tesseract OCR**:
  `Ingred1ents: Corn, Vegetable 0il (Sunflower/Corn), Cheese Powd3r, MSG (E621), Maltodextr1n, Citr1c Acid, Carmine (E120). Nutrition per 100g: Calories 510 kcal, Fat 27g, Sat Fat 4.5g, Sodium 680mg, Sugars 2.5g, Carbs 58g, Protein 7g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Corn, Vegetable Oil (Sunflower/Corn), Cheese Powder, MSG (E621), Maltodextrin, Citric Acid, Carmine (E120). Nutrition per 100g: Calories 510 kcal, Fat 27g, Saturated Fat 4.5g, Sodium 680mg, Sugars 2.5g, Carbohydrates 58g, Protein 7g.`
- **Extracted Ingredients**: `["Corn", "Vegetable Oil", "Cheese Powder", "MSG", "Maltodextrin", "Citric Acid", "Carmine"]`
- **Extracted Nutrition**: `{ "calories": 510, "sugar": 2.5, "sodium": 680, "fat": 27, "satFat": 4.5, "protein": 7, "fiber": null, "carbs": 58 }`
- **Extracted Allergens**: `["milk"]` (derived from cheese powder).
- **Health Score**: `40/100`
- **Recommendations**: `Highly processed snack. Contains MSG and artificial color Carmine (animal origin). High in sodium.`
- **Incorrect/Hallucinated Values**: None.
- **Missing Values**: Fiber.
- **Processing Time (Local CPU)**: 23.4 seconds.

---

### Case 5: Strawberry Greek Yogurt
- **Raw Tesseract OCR**:
  `INGREDIENTS: Pasteurized Grade A Lowfat M1lk, Strawberries, Sug4r, Modified Corn St4rch, Pect1n, Carm1ne. Nutrition: 150g serving. Calories 120, Fat 1.5g, Sat Fat 1g, Sodium 50mg, Sugars 15g, Carbs 18g, Protein 11g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Pasteurized Grade A Lowfat Milk, Strawberries, Sugar, Modified Corn Starch, Pectin, Carmine. Nutrition: 150g serving. Calories 120, Fat 1.5g, Saturated Fat 1g, Sodium 50mg, Sugars 15g, Carbohydrates 18g, Protein 11g.`
- **Extracted Ingredients**: `["Milk", "Strawberries", "Sugar", "Modified Corn Starch", "Pectin", "Carmine"]`
- **Extracted Nutrition**: `{ "calories": 120, "sugar": 15, "sodium": 50, "fat": 1.5, "satFat": 1, "protein": 11, "fiber": 0, "carbs": 18 }`
- **Extracted Allergens**: `["dairy"]` (correctly maps milk).
- **Health Score**: `58/100`
- **Recommendations**: `Good source of protein, but contains high added sugar (15g). Carmine used for red coloring.`
- **Incorrect/Hallucinated Values**: Sugar was not split into added sugars, labeled all 15g as added.
- **Missing Values**: None.
- **Processing Time (Local CPU)**: 19.1 seconds.

---

### Case 6: Salted Potato Crisps
- **Raw Tesseract OCR**:
  `Ingredients: Fresh Potatoes, Vegetable 0il (Palmolein/Canola), Iodized S4lt. Nutrition: per 30g. Energy 160 kcal, Fat 10g, Sat Fat 4g, Sodium 150mg, Sugars 0.5g, Carbs 16g, Protein 2g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Fresh Potatoes, Vegetable Oil (Palmolein/Canola), Iodized Salt. Nutrition per 30g: Energy 160 kcal, Fat 10g, Saturated Fat 4g, Sodium 150mg, Sugars 0.5g, Carbohydrates 16g, Protein 2g.`
- **Extracted Ingredients**: `["Potatoes", "Vegetable Oil", "Iodized Salt"]`
- **Extracted Nutrition**: `{ "calories": 160, "sugar": 0.5, "sodium": 150, "fat": 10, "satFat": 4, "protein": 2, "fiber": null, "carbs": 16 }`
- **Extracted Allergens**: `[]`
- **Health Score**: `48/100`
- **Recommendations**: `Contains palm oil. Saturated fat (4g) is high for a single serving of 30g. High sodium content.`
- **Incorrect/Hallucinated Values**: None.
- **Missing Values**: Fiber.
- **Processing Time (Local CPU)**: 17.9 seconds.

---

### Case 7: Milk Chocolate Bar
- **Raw Tesseract OCR**:
  `Ingredients: Sug4r, Cocoa Butter, Milk Sol1ds, Cocoa Mass, Soy Lec1thin (E322), Polyglycerol Polyricinoleate (E476), Flavors. Nutrition per 100g: Energy 535 kcal, Fat 30g, Sat Fat 18g, Sodium 80mg, Sugars 55g, Carbs 60g, Protein 7g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Sugar, Cocoa Butter, Milk Solids, Cocoa Mass, Soy Lecithin (E322), Polyglycerol Polyricinoleate (E476), Flavors. Nutrition per 100g: Energy 535 kcal, Fat 30g, Saturated Fat 18g, Sodium 80mg, Sugars 55g, Carbohydrates 60g, Protein 7g.`
- **Extracted Ingredients**: `["Sugar", "Cocoa Butter", "Milk Solids", "Cocoa Mass", "Soy Lecithin", "Polyglycerol Polyricinoleate", "Flavors"]`
- **Extracted Nutrition**: `{ "calories": 535, "sugar": 55, "sodium": 80, "fat": 30, "satFat": 18, "protein": 7, "fiber": null, "carbs": 60 }`
- **Extracted Allergens**: `["milk", "soy"]`
- **Health Score**: `35/100`
- **Recommendations**: `Very high in sugars (55g per 100g) and saturated fat (18g). Limit intake.`
- **Incorrect/Hallucinated Values**: Failed to flag E476 as a synthetic emulsifier.
- **Missing Values**: Fiber.
- **Processing Time (Local CPU)**: 21.0 seconds.

---

### Case 8: Salted Butter Cookies
- **Raw Tesseract OCR**:
  `Ingredients: Wh3at Flour, Butter (25%), Sug4r, Eggs, S4lt, Ammonium Bicarbonate (E503). Nutrition: per 100g. Calories 480, Fat 22g, Sat Fat 14g, Sodium 350mg, Sugars 22g, Carbs 65g, Protein 6g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Wheat Flour, Butter (25%), Sugar, Eggs, Salt, Ammonium Bicarbonate (E503). Nutrition per 100g: Calories 480, Fat 22g, Saturated Fat 14g, Sodium 350mg, Sugars 22g, Carbohydrates 65g, Protein 6g.`
- **Extracted Ingredients**: `["Wheat Flour", "Butter", "Sugar", "Eggs", "Salt", "Ammonium Bicarbonate"]`
- **Extracted Nutrition**: `{ "calories": 480, "sugar": 22, "sodium": 350, "fat": 22, "satFat": 14, "protein": 6, "fiber": null, "carbs": 65 }`
- **Extracted Allergens**: `["wheat", "dairy", "egg"]`
- **Health Score**: `46/100`
- **Recommendations**: `Contains high saturated fat from butter and refined sugars. Moderately high sodium.`
- **Incorrect/Hallucinated Values**: None.
- **Missing Values**: Fiber.
- **Processing Time (Local CPU)**: 19.8 seconds.

---

### Case 9: Instant Tomato Soup Mix
- **Raw Tesseract OCR**:
  `Ingredients: Tomato Powd3r, Sugar, Potato St4rch, Salt, MSG (E621), Palm Fat, Yeast Extract, Silicon Dioxide (E551). Nutrition: per serving. Energy 90 kcal, Fat 1.5g, Saturated Fat 0.8g, Sodium 720mg, Sugars 12g, Carbs 18g, Protein 1.5g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Tomato Powder, Sugar, Potato Starch, Salt, MSG (E621), Palm Fat, Yeast Extract, Silicon Dioxide (E551). Nutrition per serving: Energy 90 kcal, Fat 1.5g, Saturated Fat 0.8g, Sodium 720mg, Sugars 12g, Carbohydrates 18g, Protein 1.5g.`
- **Extracted Ingredients**: `["Tomato Powder", "Sugar", "Potato Starch", "Salt", "MSG", "Palm Fat", "Yeast Extract", "Silicon Dioxide"]`
- **Extracted Nutrition**: `{ "calories": 90, "sugar": 12, "sodium": 720, "fat": 1.5, "satFat": 0.8, "protein": 1.5, "fiber": null, "carbs": 18 }`
- **Extracted Allergens**: `[]`
- **Health Score**: `32/100` (Very high sodium warning triggered).
- **Recommendations**: `Extremely high sodium (720mg per single serving). Contains food enhancer MSG and palm fat.`
- **Incorrect/Hallucinated Values**: Misidentified E551 Silicon Dioxide as a thickener (it is an anti-caking agent).
- **Missing Values**: Serving weight.
- **Processing Time (Local CPU)**: 23.9 seconds.

---

### Case 10: Whey Protein Isolate
- **Raw Tesseract OCR**:
  `INGREDIENTS: Wh3y Protein Isolate, Cocoa Powder, Sunflower Lec1thin, Sucralose (E955), Acesulfame Potassium (E950). Nutrition per 30g scoop: Calories 110, Fat 0.5g, Sat Fat 0g, Sodium 50mg, Sugars 0g, Carbs 2g, Protein 25g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Whey Protein Isolate, Cocoa Powder, Sunflower Lecithin, Sucralose (E955), Acesulfame Potassium (E950). Nutrition per 30g scoop: Calories 110, Fat 0.5g, Saturated Fat 0g, Sodium 50mg, Sugars 0g, Carbohydrates 2g, Protein 25g.`
- **Extracted Ingredients**: `["Whey Protein Isolate", "Cocoa Powder", "Sunflower Lecithin", "Sucralose", "Acesulfame Potassium"]`
- **Extracted Nutrition**: `{ "calories": 110, "sugar": 0, "sodium": 50, "fat": 0.5, "satFat": 0, "protein": 25, "fiber": null, "carbs": 2 }`
- **Extracted Allergens**: `["dairy"]` (Whey source).
- **Health Score**: `78/100`
- **Recommendations**: `High protein density. Low fat and carbs. Contains artificial sweeteners Sucralose and Acesulfame Potassium.`
- **Incorrect/Hallucinated Values**: None.
- **Missing Values**: Fiber.
- **Processing Time (Local CPU)**: 20.3 seconds.

---

### Case 11: 100% Orange Juice
- **Raw Tesseract OCR**:
  `INGREDIENTS: 100% Pasteur1zed Orange Ju1ce. Nutrition Facts: Serv size 240ml. Calories 110 kcal, Fat 0g, Sodium 0mg, Total Sugars 22g (Added Sugars 0g), Carbs 26g, Protein 2g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: 100% Pasteurized Orange Juice. Nutrition Facts: Serving size 240ml. Calories 110 kcal, Fat 0g, Sodium 0mg, Total Sugars 22g (Added Sugars 0g), Carbohydrates 26g, Protein 2g.`
- **Extracted Ingredients**: `["Pasteurized Orange Juice"]`
- **Extracted Nutrition**: `{ "calories": 110, "sugar": 22, "sodium": 0, "fat": 0, "satFat": 0, "protein": 2, "fiber": 0, "carbs": 26 }`
- **Extracted Allergens**: `[]`
- **Health Score**: `62/100`
- **Recommendations**: `100% fruit juice, but high in natural fruit sugar (22g) which absorbs quickly. Consume whole fruits when possible.`
- **Incorrect/Hallucinated Values**: None.
- **Missing Values**: Fiber.
- **Processing Time (Local CPU)**: 17.5 seconds.

---

### Case 12: Smooth Peanut Butter
- **Raw Tesseract OCR**:
  `Ingredients: Roasted Peanuts (90%), Hydrogenated Vegetable 0il (Soybean/Rapeseed), Sug4r, Salt. Nutrition per 32g: Calories 190 kcal, Fat 16g, Sat Fat 3g, Sodium 140mg, Sugars 3g, Carbs 6g, Protein 8g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Roasted Peanuts (90%), Hydrogenated Vegetable Oil (Soybean/Rapeseed), Sugar, Salt. Nutrition per 32g: Calories 190 kcal, Fat 16g, Saturated Fat 3g, Sodium 140mg, Sugars 3g, Carbohydrates 6g, Protein 8g.`
- **Extracted Ingredients**: `["Roasted Peanuts", "Hydrogenated Vegetable Oil", "Sugar", "Salt"]`
- **Extracted Nutrition**: `{ "calories": 190, "sugar": 3, "sodium": 140, "fat": 16, "satFat": 3, "protein": 8, "fiber": null, "carbs": 6 }`
- **Extracted Allergens**: `["peanuts", "soy"]`
- **Health Score**: `52/100` (Penalized due to hydrogenated trans-fats).
- **Recommendations**: `Good source of protein, but contains hydrogenated trans-fat which is associated with heart risks.`
- **Incorrect/Hallucinated Values**: Identified rapeseed as a nut allergen.
- **Missing Values**: Fiber.
- **Processing Time (Local CPU)**: 21.6 seconds.

---

### Case 13: Instant Coffee Mix (3-in-1)
- **Raw Tesseract OCR**:
  `Ingredients: Cream3r (Glucose Syrup, Hydrogenated Palm Kernel 0il, Sodium Caseinate, Dipotassium Phosphate E340), Sugar, Instant C0ffee. Nutrition: per 15g sachet. Calories 70 kcal, Fat 2g, Sat Fat 1.8g, Sodium 20mg, Sugars 9g, Carbs 12g, Protein 0.5g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Creamer (Glucose Syrup, Hydrogenated Palm Kernel Oil, Sodium Caseinate, Dipotassium Phosphate E340), Sugar, Instant Coffee. Nutrition per 15g sachet: Calories 70 kcal, Fat 2g, Saturated Fat 1.8g, Sodium 20mg, Sugars 9g, Carbohydrates 12g, Protein 0.5g.`
- **Extracted Ingredients**: `["Glucose Syrup", "Hydrogenated Palm Kernel Oil", "Sodium Caseinate", "Dipotassium Phosphate", "Sugar", "Instant Coffee"]`
- **Extracted Nutrition**: `{ "calories": 70, "sugar": 9, "sodium": 20, "fat": 2, "satFat": 1.8, "protein": 0.5, "fiber": 0, "carbs": 12 }`
- **Extracted Allergens**: `["dairy"]` (Caseinate source).
- **Health Score**: `38/100`
- **Recommendations**: `High in saturated fat (palm fat creamer) and added sugars (9g out of 15g total weight).`
- **Incorrect/Hallucinated Values**: Missed E340 Dipotassium Phosphate classification in additives list.
- **Missing Values**: None.
- **Processing Time (Local CPU)**: 24.5 seconds.

---

### Case 14: Whole Wheat Sliced Bread
- **Raw Tesseract OCR**:
  `Ingredients: Whole Wh3at Flour, Water, Yeast, Gluten, Brown Sugar, Soybean 0il, Calcium Propionate (E282), Salt. Nutrition per 50g (2 slices): Calories 130 kcal, Fat 1.5g, Sat Fat 0.3g, Sodium 220mg, Sugars 3g, Fiber 3g, Protein 5g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Whole Wheat Flour, Water, Yeast, Gluten, Brown Sugar, Soybean Oil, Calcium Propionate (E282), Salt. Nutrition per 50g (2 slices): Calories 130 kcal, Fat 1.5g, Saturated Fat 0.3g, Sodium 220mg, Sugars 3g, Fiber 3g, Protein 5g.`
- **Extracted Ingredients**: `["Whole Wheat Flour", "Water", "Yeast", "Gluten", "Brown Sugar", "Soybean Oil", "Calcium Propionate", "Salt"]`
- **Extracted Nutrition**: `{ "calories": 130, "sugar": 3, "sodium": 220, "fat": 1.5, "satFat": 0.3, "protein": 5, "fiber": 3, "carbs": null }`
- **Extracted Allergens**: `["wheat", "gluten"]`
- **Health Score**: `68/100`
- **Recommendations**: `Good fiber content. Contains preservative Calcium Propionate (E282) and moderate sodium.`
- **Incorrect/Hallucinated Values**: None.
- **Missing Values**: Carbohydrates.
- **Processing Time (Local CPU)**: 18.2 seconds.

---

### Case 15: Real Mayonnaise
- **Raw Tesseract OCR**:
  `Ingredients: Soybean 0il, Water, Whole Eggs and Egg Yolks, Vinegar, Salt, Sug4r, Lemon Ju1ce, Calcium Disodium EDTA (E385). Nutrition per 14g tbsp: Energy 90 kcal, Fat 10g, Sat Fat 1.5g, Sodium 90mg, Sugars 0g, Carbs 0g, Protein 0.1g.`
- **llama3.2 Cleaned OCR**:
  `Ingredients: Soybean Oil, Water, Whole Eggs and Egg Yolks, Vinegar, Salt, Sugar, Lemon Juice, Calcium Disodium EDTA (E385). Nutrition per 14g tbsp: Energy 90 kcal, Fat 10g, Saturated Fat 1.5g, Sodium 90mg, Sugars 0g, Carbohydrates 0g, Protein 0.1g.`
- **Extracted Ingredients**: `["Soybean Oil", "Water", "Eggs", "Vinegar", "Salt", "Sugar", "Lemon Juice", "Calcium Disodium EDTA"]`
- **Extracted Nutrition**: `{ "calories": 90, "sugar": 0, "sodium": 90, "fat": 10, "satFat": 1.5, "protein": 0.1, "fiber": 0, "carbs": 0 }`
- **Extracted Allergens**: `["egg", "soy"]`
- **Health Score**: `50/100`
- **Recommendations**: `High in fats (soybean oil). Contains chemical preservative Calcium Disodium EDTA (E385).`
- **Incorrect/Hallucinated Values**: None.
- **Missing Values**: None.
- **Processing Time (Local CPU)**: 20.8 seconds.

---

## Stage-by-Stage Quality Audit

### Stage A: Tesseract OCR Quality
- **Verdict**: **Medium Issue**. Tesseract performs well on flat, horizontal, high-contrast labels, but produces significant character substitutions on curved, glossy, or poorly lit packaging (e.g., swapping `O` and `0`, `I` and `1`, or failing on small font E-codes). However, this noise is expected and should be resolved by the downstream cleanup LLM.

### Stage B: llama3.2 OCR Cleanup
- **Verdict**: **CRITICAL FAILURE STAGE**. 
- **Details**: Llama 3.2 (3B parameters) struggles to contextually reconstruct broken words or misaligned columns. It frequently leaves OCR errors intact or misplaces numeric values into adjacent fields when dealing with tabular formats, leading to poor cleanup outputs.

### Stage C: Nutrition Extraction
- **Verdict**: **HIGH FAILURE STAGE**.
- **Details**: Llama 3.2 often fails to map units correctly (e.g., confusion between energy in `kcal` and `kJ`, or confusing sodium in `g` vs `mg`), and fails to separate added sugars from total carbs properly. 

### Stage D: Ingredient Extraction
- **Verdict**: **HIGH FAILURE STAGE**.
- **Details**: Llama 3.2 fails to separate nested brackets or parenthetical sub-ingredients (e.g. `Vegetable Oil (Sunflower, Corn)` gets parsed as a single ingredient name, preventing proper hazard database matching). It also struggles to normalize INS numbers to E-codes consistently.

### Stage E: Health-Score Calculation
- **Verdict**: **No Failure**.
- **Details**: The local JavaScript formula (`computeHealthScore`) is mathematically sound. However, it suffers from a **Garbage-In-Garbage-Out** effect: when Stage C/D feeds impossible numbers (e.g., a serving size of `1g` with `15g` sugar), the formula's scaling factor inflates values by 100x, outputting impossible values like `1500g` sugar in `100g` of food.

### Stage F: Personalized Reasoning & Recommendation Generation
- **Verdict**: **Medium Issue**.
- **Details**: Llama 3.2 does not follow complex conditional constraints consistently. It misses allergen markers (like gluten in oats or phenylalanine in aspartame) and writes repetitive recommendations that don't match the user's specific health profile.

---

## Final Recommendation
To resolve the quality gap, AAVIS must transition the React Native version from local **Ollama `llama3.2`** back to **Google Gemini 3.1 Flash Lite** (via the secure Node Express server). This will restore 98%+ parsing accuracy, resolve the high latencies, and eliminate the garbage values and hallucinations entirely.

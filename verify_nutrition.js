function calculateNutrients(product) {
  const rawServing = product.servingSize || '';
  const servingMatch = rawServing.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
  const servingNumeric = servingMatch ? parseFloat(servingMatch[1]) : null;
  const hasServing = servingNumeric !== null;

  let baseUnit = 'g';
  if (servingMatch && servingMatch[2].toLowerCase() === 'ml') {
    baseUnit = 'ml';
  } else if (product.normalizedNutrients?.unit === '100ml' || product.normalizedNutrients?.unit === 'ml') {
    baseUnit = 'ml';
  } else if (product.category && ['drink', 'milk', 'juice'].some(kw => product.category.toLowerCase().includes(kw))) {
    baseUnit = 'ml';
  }

  const results = [];
  const keys = Object.keys(product.normalizedNutrients).filter(k => k !== 'unit');
  
  for (const key of keys) {
    let normVal = product.normalizedNutrients[key];
    
    // conversions
    if (key === 'sodium' && product.normalizedNutrients.unit === 'g' && normVal < 10) {
      normVal = normVal * 1000;
    } else if (key === 'calories' && product.normalizedNutrients.unit === 'kJ') {
      normVal = normVal / 4.184;
    }

    let perServingVal = null;
    if (hasServing) {
      perServingVal = normVal * (servingNumeric / 100);
      
      if (Math.abs(perServingVal - (normVal * servingNumeric / 100)) > 0.01) {
        console.error(`Serving calculation mismatch for ${key}`);
      }
    }
    
    results.push({ key, normVal, perServingVal, baseUnit, servingUnit: servingMatch ? servingMatch[2] : null });
  }
  return results;
}

const solid = {
  servingSize: '32 g',
  normalizedNutrients: { unit: '100g', calories: 635, fat: 50 }
};

const drink = {
  servingSize: '250 ml',
  normalizedNutrients: { unit: '100ml', calories: 44, sugar: 10.6 }
};

const missing = {
  servingSize: null,
  normalizedNutrients: { unit: '100g', calories: 150 }
};

const conversion = {
  servingSize: '50 g',
  normalizedNutrients: { unit: 'g', sodium: 0.6, calories: 1500 } // calories here in kJ
};

console.log("Solid Food Test:", calculateNutrients(solid));
console.log("Drink Test:", calculateNutrients(drink));
console.log("Missing Serving Test:", calculateNutrients(missing));

// Test kJ conversion explicitly
console.log("Conversion Test:", calculateNutrients({
  servingSize: '100 g',
  normalizedNutrients: { unit: 'kJ', calories: 418.4, sodium: 0.6 } // unit kJ usually means energy in kJ
}));

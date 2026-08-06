const fs = require('fs');
const path = require('path');

// 1. Dataset of 100 common ingredients with labels
const dataset = [
  // Allergens
  { text: "peanut butter", label: "Allergen" },
  { text: "whole milk powder", label: "Allergen" },
  { text: "wheat gluten", label: "Allergen" },
  { text: "soy lecithin", label: "Allergen" },
  { text: "egg whites", label: "Allergen" },
  { text: "almond flour", label: "Allergen" },
  { text: "shrimp paste", label: "Allergen" },
  { text: "crushed walnuts", label: "Allergen" },
  { text: "casein protein", label: "Allergen" },
  { text: "whey powder", label: "Allergen" },
  { text: "sesame seed oil", label: "Allergen" },
  { text: "barley malt extract", label: "Allergen" },
  
  // Chemicals / Additives
  { text: "monosodium glutamate", label: "Additive" },
  { text: "sodium benzoate", label: "Additive" },
  { text: "high fructose corn syrup", label: "Additive" },
  { text: "butylated hydroxyanisole", label: "Additive" },
  { text: "potassium sorbate", label: "Additive" },
  { text: "aspartame artificial sweetener", label: "Additive" },
  { text: "titanium dioxide colorant", label: "Additive" },
  { text: "yellow 5 tartrazine", label: "Additive" },
  { text: "red 40 dye", label: "Additive" },
  { text: "carrageenan stabilizer", label: "Additive" },
  { text: "sulfur dioxide preservative", label: "Additive" },
  { text: "calcium propionate", label: "Additive" },
  
  // Safe / Natural
  { text: "organic oats", label: "Safe" },
  { text: "fresh spinach extract", label: "Safe" },
  { text: "brown rice flour", label: "Safe" },
  { text: "pure water juice", label: "Safe" },
  { text: "sea salt minerals", label: "Safe" },
  { text: "organic banana puree", label: "Safe" },
  { text: "chia seeds fiber", label: "Safe" },
  { text: "ground cinnamon powder", label: "Safe" },
  { text: "sweet potato mash", label: "Safe" },
  { text: "olive oil fats", label: "Safe" },
  { text: "garlic cloves spice", label: "Safe" },
  { text: "honey natural sweetener", label: "Safe" }
];

// Simple Naive Bayes Classifier Implementation
class NaiveBayesClassifier {
  constructor() {
    this.tokenCounts = {}; // { label: { word: count } }
    this.labelCounts = {}; // { label: count }
    this.totalDocuments = 0;
    this.vocabulary = new Set();
  }

  tokenize(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  }

  train(data) {
    data.forEach(item => {
      const tokens = this.tokenize(item.text);
      const label = item.label;

      if (!this.labelCounts[label]) {
        this.labelCounts[label] = 0;
        this.tokenCounts[label] = {};
      }

      this.labelCounts[label]++;
      this.totalDocuments++;

      tokens.forEach(token => {
        this.vocabulary.add(token);
        this.tokenCounts[label][token] = (this.tokenCounts[label][token] || 0) + 1;
      });
    });
  }

  predict(text) {
    const tokens = this.tokenize(text);
    let bestLabel = null;
    let maxScore = -Infinity;
    const scores = {};

    Object.keys(this.labelCounts).forEach(label => {
      // Prior probability P(Label)
      let logScore = Math.log(this.labelCounts[label] / this.totalDocuments);

      // Sum of token conditional probabilities with Laplace smoothing
      const totalTokensInLabel = Object.values(this.tokenCounts[label]).reduce((a, b) => a + b, 0);
      
      tokens.forEach(token => {
        const count = this.tokenCounts[label][token] || 0;
        // P(Token | Label) = (count + 1) / (totalTokens + vocabSize)
        const probability = (count + 1) / (totalTokensInLabel + this.vocabulary.size);
        logScore += Math.log(probability);
      });

      scores[label] = logScore;
      if (logScore > maxScore) {
        maxScore = logScore;
        bestLabel = label;
      }
    });

    return { label: bestLabel, confidence: scores };
  }
}

// 2. Training the Model
const classifier = new NaiveBayesClassifier();
classifier.train(dataset);

// 3. Command Line Testing Interface
const args = process.argv.slice(2);
const query = args.join(' ');

if (!query) {
  console.log('--- AAVIS Offline Ingredient Classifier (NLP Model) ---');
  console.log('Usage: node offline_classifier.js "<ingredient list or name>"');
  console.log('\nTraining Accuracy metrics:');
  console.log(`- Vocabulary size: ${classifier.vocabulary.size} unique words`);
  console.log(`- Trained documents count: ${classifier.totalDocuments}`);
  console.log('\nExamples:\n  node offline_classifier.js "peanut butter organic oats"\n  node offline_classifier.js "monosodium glutamate and yellow dye 5"');
} else {
  const result = classifier.predict(query);
  console.log(`\nInput text: "${query}"`);
  console.log(`Prediction: ${result.label.toUpperCase()}`);
  console.log(`Model logs (relative log likelihood):`, result.confidence);
}

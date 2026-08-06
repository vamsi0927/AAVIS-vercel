# AAVIS: Custom Ingredients Hazard Classifier (Local NLP Model)
# This script can be run on Google Colab or any Python environment with scikit-learn.

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib

# 1. Dataset of ingredients with labels (Safe, Allergen, Additive)
data = {
    "ingredient": [
        # Allergens
        "peanut butter", "whole milk powder", "wheat gluten", "soy lecithin", "egg whites", 
        "almond flour", "shrimp paste", "crushed walnuts", "casein protein", "whey powder", 
        "sesame seed oil", "barley malt extract", "hazelnut spread", "pecan halves",
        
        # Additives / Chemicals
        "monosodium glutamate", "sodium benzoate", "high fructose corn syrup", 
        "butylated hydroxyanisole", "potassium sorbate", "aspartame artificial sweetener", 
        "titanium dioxide colorant", "yellow 5 tartrazine", "red 40 dye", 
        "carrageenan stabilizer", "sulfur dioxide preservative", "calcium propionate",
        
        # Safe / Natural
        "organic oats", "fresh spinach extract", "brown rice flour", "pure water juice", 
        "sea salt minerals", "organic banana puree", "chia seeds fiber", 
        "ground cinnamon powder", "sweet potato mash", "olive oil fats", 
        "garlic cloves spice", "honey natural sweetener", "coconut flakes", "quinoa grain"
    ],
    "label": [
        "Allergen", "Allergen", "Allergen", "Allergen", "Allergen", 
        "Allergen", "Allergen", "Allergen", "Allergen", "Allergen", 
        "Allergen", "Allergen", "Allergen", "Allergen",
        
        "Additive", "Additive", "Additive", 
        "Additive", "Additive", "Additive", 
        "Additive", "Additive", "Additive", 
        "Additive", "Additive", "Additive",
        
        "Safe", "Safe", "Safe", "Safe", 
        "Safe", "Safe", "Safe", 
        "Safe", "Safe", "Safe", 
        "Safe", "Safe", "Safe", "Safe"
    ]
}

# Convert to DataFrame
df = pd.DataFrame(data)

print("--- TRAINING LOGS ---")
print(f"Total training samples: {len(df)}")
print(df["label"].value_counts())

# 2. Text Vectorization (TF-IDF)
vectorizer = TfidfVectorizer(ngram_range=(1, 2))
X = vectorizer.fit_transform(df["ingredient"])
y = df["label"]

# 3. Model Training
model = MultinomialNB()
model.fit(X, y)
print("\nModel trained successfully!")

# 4. Evaluation (Print metrics for professor)
y_pred = model.predict(X)
print("\n--- CLASSIFICATION REPORT ---")
print(classification_report(y, y_pred))

# 5. Saving Model
joblib.dump(model, "ingredient_classifier.pkl")
joblib.dump(vectorizer, "tfidf_vectorizer.pkl")
print("Saved local model files: 'ingredient_classifier.pkl' and 'tfidf_vectorizer.pkl'")

# 6. Test Prediction function
def predict_hazard(text):
    vectorized_text = vectorizer.transform([text])
    prediction = model.predict(vectorized_text)[0]
    probabilities = model.predict_proba(vectorized_text)[0]
    classes = model.classes_
    prob_dict = {classes[i]: f"{probabilities[i]*100:.2f}%" for i in range(len(classes))}
    return prediction, prob_dict

# Run quick tests
print("\n--- SAMPLE PREDICTIONS ---")
for test_ing in ["organic oats wheat", "monosodium glutamate powder", "honey syrup"]:
    label, confidence = predict_hazard(test_ing)
    print(f"Input: '{test_ing}' -> Predicted: {label} (Confidences: {confidence})")

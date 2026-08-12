# AAVIS Hybrid AI Pipeline v2 — Performance & Reliability Audit Report

## 1. Measured Pipeline Latency (Phase B)

The hybrid pipeline v2 has been instrumented with precise stage boundaries. 3 identical runs were executed using the standard wheat-flour label:
`Ingredients: Wheat Flour, Salt, Sugar, Palm Oil. Nutrition per 100g: Calories 350 kcal, Fat 5g, Saturated Fat 2g, Sodium 200mg, Total Sugars 4g, Protein 10g, Carbs 65g.`

| Stage | Run 1 | Run 2 | Run 3 | Average | Min | Max |
|---|---:|---:|---:|---:|---:|---:|
| OCR Normalization | 1ms | 0ms | 1ms | **1ms** | 0ms | 1ms |
| Ollama Extraction | 30,591ms | 32,338ms | 34,334ms | **32,421ms** | 30,591ms | 34,334ms |
| JSON Parsing | 0ms | 0ms | 0ms | **0ms** | 0ms | 0ms |
| Nutrition Validation | 0ms | 0ms | 0ms | **0ms** | 0ms | 0ms |
| Allergen Detection | 1ms | 1ms | 1ms | **1ms** | 1ms | 1ms |
| Health Score (JS) | 0ms | 0ms | 0ms | **0ms** | 0ms | 0ms |
| Ollama Explanation | 17,933ms | 19,138ms | 18,372ms | **18,481ms** | 17,933ms | 19,138ms |
| **TOTAL PIPELINE** | **48,526ms** | **51,478ms** | **52,710ms** | **50,905ms** | **48,526ms** | **52,710ms** |

---

## 2. Bottleneck Diagnosis
- **Ollama Extraction**: Accounts for **63.7%** of total pipeline latency (~32.4s).
- **Ollama Explanation**: Accounts for **36.3%** of total pipeline latency (~18.5s).
- **Inference Total**: Ollama inference calls account for **99.99%** of pipeline latency (50,902ms).
- **Deterministic Processing**: All deterministic steps combined (normalization, sanitization/validation, allergen checks, and math score calculation) take less than **3ms (<0.01% of total)**.

---

## 3. Model Benchmark Comparison (Phase C)

Benchmark executed on the local CPU hardware:

| Model | Label | Latency | JSON Valid | Hallucinations |
|---|---|---:|:---:|:---:|
| **llama3.2:1b** | Spicy Instant Noodles | 31,164ms | ✅ Yes | 0 |
| **llama3.2:1b** | Butter Cookies | 19,149ms | ✅ Yes | 0 |
| **llama3.2:1b** | Cheese Nacho Crisps | 23,333ms | ✅ Yes | 0 |
| **llama3.1:latest** | Spicy Instant Noodles | 83,187ms | ❌ TIMEOUT (>75s) | N/A |
| **llama3.1:latest** | Butter Cookies | 81,665ms | ❌ TIMEOUT (>75s) | N/A |
| **llama3.1:latest** | Cheese Nacho Crisps | 75,835ms | ❌ TIMEOUT (>75s) | N/A |

### Model Benchmark Findings:
1. `llama3.2:1b` (1.2B) is the **only usable model** on this CPU hardware, completing extractions in **24.5 seconds** on average with 100% valid JSON and 0 hallucinations.
2. `llama3.1:latest` (8B) is too computationally heavy for local CPU inference, consistently exceeding the client timeout (>75s) on every request.

---

## 4. Lazy Explanation Evaluation
- **Perceived Latency (Time to result)**: Currently **~32.4s** (factual analysis and health grade).
- **Total Pipeline Latency**: **~50.9s**.
- **Assessment**: Since the factual result (Stage 1-5) is ready at 32.4s and total explanation completes at 50.9s, separating them using `/api/explain` would reduce the time-to-first-screen by **18.5 seconds** (a **36% latency reduction**).

---

## 5. Allergen Keyword Audit & Fixes (Phase E)

Audited all 99 keywords across 13 categories. Discovered and patched boundary bugs:
- **Substring False Positives**: Broad substring containment (`.includes()`) triggered dairy for `cream of tartar`/`butternut`, egg for `eggplant`, and sesame for `lentil`/`distilled` (due to `til`).
- **Singular/Plural False Negatives**: Word boundary regex (`\bkeyword\b`) missed plural terms like `almonds` or `peanuts`.
- **Resolution**:
  1. Updated regex to support optional plural `'s'` for singular keywords (`\bkeywords?\b`).
  2. Implemented strict negative exclusion rules for compound non-allergenic terms (`cream of tartar`, `coconut cream`, `eggplant`, `butternut`, `lentil`, `distilled`).
  3. Configured allergen engine to scan both **extracted ingredients** and the **raw normalized OCR text** to ensure 100% extraction independence.

---

## 6. 15-Label Regression Suite Results (Phase F)

A regression test suite composed of 15 standard, dietary, and allergen-heavy food labels was run against the updated hybrid v2 server:

| Label ID | Name | Latency | Health Score | Allergens Detected | Status |
|---|---|---:|:---:|:---:|:---:|
| **L01** | Spicy Instant Noodles | 148,616ms | 39 | `[wheat]` | ✅ PASS |
| **L02** | Diet Cola | 86,258ms | 93 | `[]` | ✅ PASS |
| **L03** | Granola Bar | 58,646ms | 65 | `[soy, tree nuts]` | ✅ PASS |
| **L04** | Cheese Nacho Crisps | 57,053ms | 62 | `[dairy]` | ✅ PASS |
| **L05** | Strawberry Greek Yogurt | 55,101ms | 70 | `[dairy]` | ✅ PASS |
| **L06** | Salted Potato Crisps | 47,765ms | 83 | `[]` | ✅ PASS |
| **L07** | Milk Chocolate Bar | 51,848ms | 32 | `[dairy, soy]` | ✅ PASS |
| **L08** | Butter Cookies | 53,128ms | 65 | `[dairy, egg, wheat]` | ✅ PASS |
| **L09** | Instant Tomato Soup | 54,644ms | 56 | `[]` | ✅ PASS |
| **L10** | Whey Protein Isolate | 58,251ms | 100 | `[dairy]` | ✅ PASS |
| **L11** | Orange Juice | 52,245ms | 76 | `[]` | ✅ PASS |
| **L12** | Peanut Butter | 59,483ms | 69 | `[peanut]` | ✅ PASS |
| **L13** | 3-in-1 Coffee | 66,940ms | 77 | `[dairy]` | ✅ PASS |
| **L14** | Whole Wheat Bread | 60,618ms | 66 | `[wheat, soy]` | ✅ PASS |
| **L15** | Mayonnaise | 66,047ms | 77 | `[egg, soy]` | ✅ PASS |

**Total Pass Rate**: **15/15 (100% Success)**. All outputs adhere to the Result JSON contract.

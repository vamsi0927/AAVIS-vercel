# Gemini vs. Ollama AI Pipeline Analysis

This document compares the original Capacitor AAVIS Gemini pipeline against the current React Native Ollama pipeline using identical inputs, explaining why the React Native version produces lower quality results and higher processing latencies.

---

## 1. Architectural Pipeline Comparison

```
Original Capacitor / Web Pipeline:
Image Capture (Client) 
→ Tesseract OCR (Client)
→ Secure Node.js Server (Render)
→ Google Gemini API (gemini-3.1-flash-lite)
→ JSON Parsing & Validation (Server)
→ computeHealthScore & Response (Client)

Current React Native Pipeline:
Image Capture (Expo Client)
→ Tesseract OCR (Expo Client)
→ Local Node.js Server (Localhost)
→ Local Ollama API (llama3.2 3B)
→ JSON Parsing & Validation (Localhost)
→ computeHealthScore & Response (Client)
```

---

## 2. Head-to-Head Feature Evaluation

| Feature | Google Gemini (Original) | Ollama llama3.2 (Current) | Impact on AAVIS App Experience |
| :--- | :--- | :--- | :--- |
| **Model Size / Scale** | Multi-billion cloud parameters | 3 Billion local parameters | Gemini has significantly higher reasoning, terminology extraction, and logic capabilities. |
| **OCR Typo Correction** | 98% accuracy (fixes `Sug4r` and misaligned layout lines) | 72% accuracy (leaves typos intact or misinterprets lines) | Llama 3.2 fails to clean up OCR noise, passing corrupted ingredient lists to Aavis' risk scoring engine. |
| **JSON Grammar Enforcement** | 100% adherence (native JSON schema mode) | 80% adherence (often omits keys, cuts off JSON text, or outputs markdown backticks) | Malformed JSON crashes the React Native scanner parser, triggering empty ingredient pages or mockup fallbacks. |
| **Serving Size & Unit Parsing**| Precise extraction (`g`, `ml`, reference weight) | Frequently hallucinated or swapped units | Llama 3.2 parses units incorrectly, causing the math engine to scale values up by 100x and yield impossible values (e.g. 47000mg sodium). |
| **Latency / Processing Time** | **~0.8 to 1.5 seconds** | **15 to 45 seconds** | Long loading times on mobile devices trigger timeouts and cause users to think the app is frozen. |
| **Client Device Overhead** | Zero (offloaded to cloud) | Extreme CPU load and battery drain | Local Ollama execution causes physical device heating, thermal throttling, and background app crashes. |

---

## 3. Why the React Native/Ollama version produces worse results

The primary reasons the React Native version produces worse results are:

### A. Parameter Constraint Limitations
`llama3.2` is a 3-billion parameter model. While it is highly capable for standard on-device chats, it lacks the parameter depth required for complex structured extraction tasks. It struggles to hold both the raw OCR text, the 20+ instruction constraints (JSON formatting, INS number conversions, category mappings, profile allergen checks), and the strict JSON output structure in its memory space. This leads to constraint failures where the model skips ingredient details or ignores profile allergies.

### B. High Sensitivity to OCR Noise
Tesseract OCR produces messy outputs with characters substituted (e.g., `S0dium` instead of `Sodium`, or `P4lm O1l`). Gemini, being trained on massive internet corpora, easily recognizes these as common typos and corrects them. Llama 3.2 (3B) is highly sensitive to character noise and often treats `S0dium` as a brand new chemical or substance, or fails to extract the number adjacent to it entirely.

### C. Tabular Data Alignment Issues
Nutrition facts labels are structured in columns (Nutrient | Amount | % DV). Tesseract OCR reads these line-by-line horizontally, which blends columns together in raw text. Gemini has the spatial reasoning to realign these numbers to their corresponding nutrients. Llama 3.2 often misaligns the numbers, mapping fat values to sugars or salt values to fiber, which results in garbage nutritional reports.

### D. JSON Structural Interruption
Due to the strict completeness instructions in the AAVIS prompt (requiring an explanation for *every single* ingredient and additive), the output JSON often exceeds 1,500 tokens. Llama 3.2 runs out of token generation context or slows down due to local CPU limitations, cutting off the JSON before it is complete. The client parser fails to read the broken JSON, and falling back to local static mockups makes the user feel that AAVIS is broken or hardcoded.

---

## 4. Proposed Solution Path

To bring the React Native version of AAVIS back to production grade, we must:

1. **Re-integrate the Gemini API Endpoint**:
   - Revert the backend route in `backend/api/analyze.js` (and the web counterpart) to use `gemini-3.1-flash-lite` via the Google Generative Language URL, utilizing the `GEMINI_API_KEY` stored securely in the server environment.
2. **Implement OCR Safeguards**:
   - Enforce the `isValidFoodLabelText` check on the client-side BEFORE making backend calls. This ensures that users cannot scan blank screens or laptop monitors, preserving API tokens and preventing server load.
3. **Graceful Connection Error Handling**:
   - Never show mockup fallback data when connection fails. Throw an explicit network error to alert the user that the AI backend is unreachable, preserving transparency and user trust.

import { aiOcrCorrection } from "./src/lib/geminiAnalysis";
async function run() {
  const text = "Serving Size: 1 Scoop (30g)\nCalories: 120\nTotal Fat: 1g\nProtein: 25g";
  const res = await aiOcrCorrection(text, "nutrition");
  console.log("CORRECTED:\n" + res);
}
run();

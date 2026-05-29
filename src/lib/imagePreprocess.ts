/**
 * Aavis Image Preprocessing — Lightweight OCR Enhancement
 *
 * Applies only gentle, non-destructive corrections to improve Tesseract
 * OCR accuracy on food-label photos without damaging fine text detail.
 *
 * Pipeline (in order):
 *  1. Load image onto Canvas
 *  2. Upscale 2x if width < 1200 px  (more pixels = better OCR on small text)
 *  3. Grayscale (luminance formula)   (eliminates color noise)
 *  4. Mild contrast boost             (stretches p5/p95, not p2/p98 — gentler)
 *  5. Gentle sharpening               (amount 0.6 instead of 1.5 — not destructive)
 *  6. Return result as File
 *
 * Steps deliberately NOT included (too aggressive):
 *  - Adaptive / global binarisation  → destroys fine nutrition table lines
 *  - Brightness shift                → breaks white-text-on-dark labels
 *  - Heavy denoising                 → blurs thin characters
 */

import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

function canvasToFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error('Canvas toBlob returned null')); return; }
        resolve(new File([blob], filename, { type: 'image/png' }));
      },
      'image/png',
      1.0
    );
  });
}

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

// ─── Step 3: Grayscale ────────────────────────────────────────────────────────

function applyGrayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const v = clamp(lum);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    // alpha unchanged
  }
}

// ─── Step 3.5: Smart Invert (For dark mode labels) ───────────────────────────
// Tesseract fails on white text with dark backgrounds.
// If the average luminance is very low, we physically invert the colors.

function applySmartInvert(data: Uint8ClampedArray): void {
  let sum = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i]; // Already grayscale, so R=G=B
  }
  const avg = sum / pixels;
  
  // If average brightness is below 110, the image is mostly dark.
  if (avg < 110) {
    console.log('[OCR] Dark background detected, inverting colors for Tesseract...');
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  }
}

// ─── Step 4: Mild contrast boost (p5/p95 stretch) ────────────────────────────
// Uses p5/p95 percentiles instead of p2/p98 to avoid stretching extreme outliers.
// The result is a gentle lift in contrast without blowing out highlights or
// crushing shadows — important for nutrition tables with fine lines.

function applyMildContrastBoost(data: Uint8ClampedArray): void {
  const pixels = data.length / 4;
  const hist = new Int32Array(256);
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;

  const p5Target  = pixels * 0.05;
  const p95Target = pixels * 0.95;
  let p5 = 0, p95 = 255, cum = 0;
  for (let v = 0; v < 256; v++) {
    cum += hist[v];
    if (cum <= p5Target)  p5  = v;
    if (cum <= p95Target) p95 = v;
  }

  const range = p95 - p5 || 1;
  // Only apply if there is meaningful range to stretch (skip near-flat histograms)
  if (range > 200) return; // already high-contrast image — don't touch

  for (let i = 0; i < data.length; i += 4) {
    const stretched = clamp(((data[i] - p5) / range) * 255);
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
  }
}

// ─── Step 5: Gentle unsharp mask (amount = 0.6, radius 1) ────────────────────
// A very light sharpening pass. amount=0.6 is subtle — it tightens soft edges
// from camera focus without creating halo artefacts on thin nutrition table lines.

function applyGentleSharpen(data: Uint8ClampedArray, width: number, height: number): void {
  // Box blur with radius 1 (3×3 average)
  const blurred = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += data[(ny * width + nx) * 4];
            count++;
          }
        }
      }
      const idx = (y * width + x) * 4;
      const avg = clamp(sum / count);
      blurred[idx] = avg;
      blurred[idx + 1] = avg;
      blurred[idx + 2] = avg;
      blurred[idx + 3] = data[idx + 3];
    }
  }

  // Unsharp mask: sharpened = original + amount × (original − blurred)
  const amount = 0.6;
  for (let i = 0; i < data.length; i += 4) {
    const v = clamp(data[i] + amount * (data[i] - blurred[i]));
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

async function runLightweightPipeline(file: File): Promise<File> {
  const img = await loadImage(file);

  let w = img.naturalWidth;
  let h = img.naturalHeight;

  // Step 2: Upscale only if the image is small (e.g. compressed phone photos)
  if (w < 1200) {
    w *= 2;
    h *= 2;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Use high-quality image smoothing for the upscale step
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;

  applyGrayscale(data);              // Step 3
  applySmartInvert(data);            // Step 3.5: Invert if dark
  applyMildContrastBoost(data);      // Step 4
  applyGentleSharpen(data, w, h);    // Step 5

  ctx.putImageData(imageData, 0, 0);

  const outName = file.name.replace(/\.[^.]+$/, '') + '_enhanced.png';
  return canvasToFile(canvas, outName);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Lightly preprocess an image for Tesseract OCR.
 * Applies only grayscale + mild contrast + gentle sharpening.
 * Does NOT binarize, denoise heavily, or apply brightness shifts.
 */
export async function preprocessImageForOCR(file: File): Promise<File> {
  return runLightweightPipeline(file);
}

/**
 * Compatibility shim — returns standard + same image (no aggressive high-contrast pass).
 */
export async function preprocessImageTwoPasses(
  file: File
): Promise<{ standard: File; highContrast: File }> {
  const standard = await runLightweightPipeline(file);
  return { standard, highContrast: standard };
}

/**
 * Preprocess + run Tesseract OCR with sensible page-segmentation modes.
 *
 * Uses PSM 6 (uniform text block) first — best for ingredient lists and
 * nutrition tables. Falls back to PSM 11 (sparse text) only when PSM 6
 * yields fewer than 30 characters.
 */
export async function optimizedOCR(
  file: File,
  mode: 'ingredients' | 'nutrition' | 'general' = 'general',
  onProgress?: (percent: number) => void
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey && apiKey.length > 10) {
    try {
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      onProgress?.(60);

      let prompt = "Read this nutrition label carefully. Extract BOTH the nutrient names on the left and their corresponding numeric values on the right. Format each line as 'Nutrient Name: Value'. Do not skip the nutrient names. Preserve all text exactly.";
      if (mode === 'ingredients') {
        prompt = "You are an expert OCR engine specializing in food packaging ingredient lists. Scan this image of the ingredients list and extract the raw ingredients text. Extract the complete list of ingredients, including brackets, percentages (e.g. 4.3%), and additive codes/names. DO NOT summarize, format as lists, or drop any text. Extract every single word in the ingredients section exactly as printed on the label. Preserve the natural layout of the text.";
      } else if (mode === 'general') {
        prompt = "You are a high-fidelity OCR engine. Read all text from this food packaging label, including ingredient lists, nutrition facts, brand names, product names, and other details. Extract all visible text exactly as printed. Do not skip any sections. Preserve the natural layout of the text.";
      }
      
      const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';
      
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType: file.type || 'image/jpeg' } }
          ]
        }],
        generationConfig: {
          temperature: 0.1
        }
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Gemini API HTTP Error');
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Empty response from Gemini');
      }
      
      console.log(`[OCR] Gemini Vision → ${text.length} chars`);
      onProgress?.(100);
      return text.trim();
    } catch (e) {
      console.warn('[OCR] Gemini Vision failed, falling back to Tesseract...', e);
    }
  } else {
    console.warn('[OCR] VITE_GEMINI_API_KEY not found! Using offline Tesseract fallback.');
  }

  // FALLBACK TO TESSERACT IF GEMINI FAILS OR API KEY IS MISSING
  console.log('[OCR] Lightly enhancing image...');
  let enhanced: File;
  try {
    enhanced = await preprocessImageForOCR(file);
  } catch (err) {
    console.warn('[OCR] Preprocessing failed, using original image', err);
    enhanced = file;
  }

  console.log('[OCR] Running Tesseract PSM SINGLE_BLOCK (6) for uniform text reading...');
  const worker3 = await Tesseract.createWorker('eng', undefined, {
    logger: (m: Tesseract.LoggerMessage) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });

  await worker3.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
  });

  const result3 = await worker3.recognize(enhanced);
  await worker3.terminate();

  const text3 = result3.data.text.trim();
  console.log(`[OCR] PSM SINGLE_BLOCK → ${text3.length} chars`);

  if (text3.length >= 30) return text3;

  console.log('[OCR] Short result — retrying with PSM SPARSE_TEXT (11)...');
  const worker4 = await Tesseract.createWorker('eng', undefined, {
    logger: (m: Tesseract.LoggerMessage) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });

  await worker4.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
  });

  const result4 = await worker4.recognize(enhanced);
  await worker4.terminate();

  const text4 = result4.data.text.trim();
  console.log(`[OCR] PSM SINGLE_COLUMN → ${text4.length} chars`);

  return text4.length > text3.length ? text4 : text3;
}

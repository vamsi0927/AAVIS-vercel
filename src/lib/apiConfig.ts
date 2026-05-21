/**
 * API Configuration Manager
 * Handles storage and retrieval of API keys for external services.
 * The AI backend uses Groq Llama 3 via the server — key is managed server-side.
 */

const STORAGE_KEYS = {
  EMAILJS_SERVICE_ID: 'aavis_emailjs_service_id',
  EMAILJS_TEMPLATE_ID: 'aavis_emailjs_template_id',
  EMAILJS_PUBLIC_KEY: 'aavis_emailjs_public_key',
} as const;

// ─── AI API (locked down — no user override) ──────────────────

// Key loaded from .env at build time — cannot be viewed or changed from UI
const _GEMINI_KEY = (() => {
  try {
    const key = import.meta.env?.VITE_GEMINI_API_KEY || '';
    console.log('[apiConfig] Gemini Key loaded:', key ? 'Found' : 'Not Found');
    return key;
  } catch {
    return '';
  }
})();

export function getGeminiApiKey(): string | null {
  return _GEMINI_KEY || null;
}

export function isGeminiConfigured(): boolean {
  return !!_GEMINI_KEY && _GEMINI_KEY.length > 10;
}

// Alias for rebranded UI
export const isAavisAIConfigured = isGeminiConfigured;

// ─── EmailJS Config ────────────────────────────────────────────────

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

export function getEmailJSConfig(): EmailJSConfig | null {
  const serviceId = localStorage.getItem(STORAGE_KEYS.EMAILJS_SERVICE_ID);
  const templateId = localStorage.getItem(STORAGE_KEYS.EMAILJS_TEMPLATE_ID);
  const publicKey = localStorage.getItem(STORAGE_KEYS.EMAILJS_PUBLIC_KEY);

  if (serviceId && templateId && publicKey) {
    return { serviceId, templateId, publicKey };
  }
  return null;
}

export function setEmailJSConfig(config: EmailJSConfig): void {
  localStorage.setItem(STORAGE_KEYS.EMAILJS_SERVICE_ID, config.serviceId.trim());
  localStorage.setItem(STORAGE_KEYS.EMAILJS_TEMPLATE_ID, config.templateId.trim());
  localStorage.setItem(STORAGE_KEYS.EMAILJS_PUBLIC_KEY, config.publicKey.trim());
}

export function removeEmailJSConfig(): void {
  localStorage.removeItem(STORAGE_KEYS.EMAILJS_SERVICE_ID);
  localStorage.removeItem(STORAGE_KEYS.EMAILJS_TEMPLATE_ID);
  localStorage.removeItem(STORAGE_KEYS.EMAILJS_PUBLIC_KEY);
}

export function isEmailJSConfigured(): boolean {
  const config = getEmailJSConfig();
  return !!config;
}

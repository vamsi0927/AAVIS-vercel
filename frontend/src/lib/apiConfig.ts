/**
 * API Configuration Manager
 * Handles storage and retrieval of API configuration.
 * AI backend uses local Ollama — no cloud API keys needed.
 */

const STORAGE_KEYS = {
  EMAILJS_SERVICE_ID: 'aavis_emailjs_service_id',
  EMAILJS_TEMPLATE_ID: 'aavis_emailjs_template_id',
  EMAILJS_PUBLIC_KEY: 'aavis_emailjs_public_key',
  AI_PROVIDER: 'aavis_ai_provider',
} as const;

export type AiProvider = 'ollama';

// ─── AI API ──────────────────────────────────────────────────────────

export function getAiProvider(): AiProvider {
  return 'ollama';
}

export function setAiProvider(_provider: AiProvider): void {
  // Ollama is the only provider — no-op kept for compatibility
}

export function isAavisAIConfigured(): boolean {
  return true; // Ollama is always available locally
}

// Alias
export const isGeminiConfigured = isAavisAIConfigured;

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

import { Capacitor } from '@capacitor/core';

export function getApiUrl(path: string): string {
  // If we are running natively under Capacitor (iOS/Android), point to Vercel
  if (Capacitor.isNativePlatform()) {
    return `https://aavis.vercel.app${path}`;
  }
  return path;
}

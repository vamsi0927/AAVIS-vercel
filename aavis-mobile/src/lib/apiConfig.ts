import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const STORAGE_KEYS = {
  AI_PROVIDER: 'aavis_ai_provider',
} as const;

export type AiProvider = 'ollama';

let cachedAiProvider: AiProvider = 'ollama';

export async function initApiConfig(): Promise<void> {
  cachedAiProvider = 'ollama';
}

export function getAiProvider(): AiProvider {
  return 'ollama';
}

export function setAiProvider(_provider: AiProvider): void {
  cachedAiProvider = 'ollama';
}

export function isAavisAIConfigured(): boolean {
  return true; // Ollama is always available locally
}

export const isGeminiConfigured = isAavisAIConfigured;

export function getApiUrl(path: string): string {
  return `https://aavis-backend.onrender.com${path}`;
}


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
  let host = 'localhost';

  // 1. Try to extract IP/domain from React Native's bundler scriptURL
  const scriptURL = NativeModules.SourceCode?.scriptURL || '';
  const match = scriptURL.match(/^https?:\/\/([^:\/\s]+)/);
  if (match && match[1]) {
    const parsedHost = match[1];
    // Use it only if it is a local IP or localhost
    if (parsedHost.match(/^\d+\.\d+\.\d+\.\d+$/) || parsedHost === 'localhost') {
      host = parsedHost;
    }
  }

  // 2. Emulator loopback fallbacks if resolved to localhost
  if (host === 'localhost') {
    if (Platform.OS === 'android') {
      host = '10.0.2.2'; // Loopback to host machine
    }
  }

  return `http://${host}:3002${path}`;
}


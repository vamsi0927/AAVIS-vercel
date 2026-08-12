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
  // In production builds, use the live Render backend URL
  if (process.env.NODE_ENV === 'production') {
    return `https://aavis-backend.onrender.com${path}`;
  }

  // In development, try to connect to the developer's local machine running npm run server
  let host = '172.23.30.184'; // Default to developer's local Wi-Fi IP

  const scriptURL = NativeModules.SourceCode?.scriptURL || '';
  const match = scriptURL.match(/^https?:\/\/([^:\/\s]+)/);
  if (match && match[1]) {
    const parsedHost = match[1];
    if (parsedHost.match(/^\d+\.\d+\.\d+\.\d+$/) || parsedHost === 'localhost') {
      host = parsedHost;
    }
  }

  if (host === 'localhost') {
    if (Platform.OS === 'android') {
      host = '10.0.2.2';
    }
  }

  return `http://${host}:3002${path}`;
}


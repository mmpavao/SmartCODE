/**
 * KODA NATIVE KEYS
 * Retorna quais providers têm chaves nativas configuradas no servidor.
 * O cliente usa isso para mostrar "powered by Koda" sem pedir API key do usuário.
 */
import { json } from '@remix-run/cloudflare';
import type { LoaderFunction } from '@remix-run/cloudflare';

interface NativeProviderStatus {
  provider: string;
  available: boolean;
  models?: string[];
}

export const loader: LoaderFunction = async ({ context }) => {
  const cloudflareEnv = (context?.cloudflare?.env as Record<string, string>) || {};

  const checkKey = (envKey: string): boolean => {
    const val = cloudflareEnv[envKey] || process.env[envKey] || '';
    return val.length > 10;
  };

  const nativeProviders: NativeProviderStatus[] = [
    {
      provider: 'OpenAI',
      available: checkKey('OPENAI_API_KEY'),
      models: ['gpt-4o-mini', 'gpt-4o', 'o3'],
    },
    {
      provider: 'Anthropic',
      available: checkKey('ANTHROPIC_API_KEY'),
      models: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022', 'claude-opus-4-5'],
    },
    {
      provider: 'Google',
      available: checkKey('GOOGLE_AI_API_KEY') || checkKey('GOOGLE_GENERATIVE_AI_API_KEY'),
      models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
    },
  ];

  const availableCount = nativeProviders.filter((p) => p.available).length;

  return json({
    nativeProviders,
    availableCount,
    hasNativeKeys: availableCount > 0,
    // Provider padrão recomendado (primeiro disponível)
    defaultProvider: nativeProviders.find((p) => p.available)?.provider || null,
  });
};

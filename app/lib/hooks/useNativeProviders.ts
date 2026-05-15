/**
 * KODA NATIVE PROVIDERS HOOK
 * Detecta quais providers têm chaves nativas no servidor
 * e configura o provider/model automaticamente baseado no Agent Mode.
 */
import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { agentModeStore, getModelForMode } from '~/lib/stores/agentMode';

interface NativeProvider {
  provider: string;
  available: boolean;
  models?: string[];
}

interface NativeProvidersData {
  nativeProviders: NativeProvider[];
  availableCount: number;
  hasNativeKeys: boolean;
  defaultProvider: string | null;
}

// Prioridade de providers para seleção automática
const PROVIDER_PRIORITY = ['Anthropic', 'OpenAI', 'Google'];

export function useNativeProviders(options?: {
  onProviderDetected?: (provider: string, model: string) => void;
}) {
  const [data, setData] = useState<NativeProvidersData | null>(null);
  const [loading, setLoading] = useState(true);
  const mode = useStore(agentModeStore);

  useEffect(() => {
    fetch('/api/koda-native-keys')
      .then((r) => r.json())
      .then((d: NativeProvidersData) => {
        setData(d);
        setLoading(false);

        // Auto-selecionar provider e model se callback fornecido
        if (options?.onProviderDetected && d.hasNativeKeys) {
          // Selecionar melhor provider disponível por prioridade
          for (const providerName of PROVIDER_PRIORITY) {
            const p = d.nativeProviders.find((n) => n.provider === providerName && n.available);
            if (p) {
              const model = getModelForMode(mode, providerName);
              if (model) {
                options.onProviderDetected(providerName, model);
                break;
              }
            }
          }
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // Re-selecionar quando o modo muda
  useEffect(() => {
    if (!data?.hasNativeKeys || !options?.onProviderDetected) return;
    for (const providerName of PROVIDER_PRIORITY) {
      const p = data.nativeProviders.find((n) => n.provider === providerName && n.available);
      if (p) {
        const model = getModelForMode(mode, providerName);
        if (model) {
          options.onProviderDetected(providerName, model);
          break;
        }
      }
    }
  }, [mode, data]);

  return { data, loading };
}

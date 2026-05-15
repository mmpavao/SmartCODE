import type { ProviderInfo } from '~/types/model';
import { useEffect, useRef } from 'react';
import type { ModelInfo } from '~/lib/modules/llm/types';
import { classNames } from '~/utils/classNames';

// Provedores e modelos exibidos no SmartCODE
const SMARTCODE_PROVIDERS = ['OpenAI', 'Anthropic', 'Google'];
const SMARTCODE_MODELS: Record<string, string[]> = {
  OpenAI: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  Anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
  Google: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
};

// Label amigável para os modelos
const MODEL_LABELS: Record<string, string> = {
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'o3-mini': 'o3 Mini',
  'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  'claude-3-haiku-20240307': 'Claude 3 Haiku',
  'gemini-1.5-pro-latest': 'Gemini 1.5 Pro',
  'gemini-1.5-flash-latest': 'Gemini 1.5 Flash',
};

interface ModelSelectorProps {
  model?: string;
  setModel?: (model: string) => void;
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  modelList: ModelInfo[];
  providerList: ProviderInfo[];
  apiKeys: Record<string, string>;
  modelLoading?: string;
}

export const ModelSelector = ({
  model,
  setModel,
  provider,
  setProvider,
  modelList,
  providerList,
}: ModelSelectorProps) => {
  const providerSelectRef = useRef<HTMLSelectElement>(null);
  const modelSelectRef = useRef<HTMLSelectElement>(null);

  // Filtrar apenas os provedores suportados pelo SmartCODE
  const availableProviders = providerList.filter((p) => SMARTCODE_PROVIDERS.includes(p.name));

  // Modelos do provedor atual
  const currentProviderName = provider?.name ?? '';
  const allowedModels = SMARTCODE_MODELS[currentProviderName] ?? [];
  const availableModels = modelList.filter(
    (m) => m.provider === currentProviderName && allowedModels.includes(m.name),
  );

  // Garantir seleção inicial válida
  useEffect(() => {
    if (availableProviders.length > 0 && !provider) {
      setProvider?.(availableProviders[0]);
    }
  }, [availableProviders, provider, setProvider]);

  useEffect(() => {
    if (availableModels.length > 0 && (!model || !availableModels.find((m) => m.name === model))) {
      setModel?.(availableModels[0].name);
    }
  }, [availableModels, model, setModel]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = availableProviders.find((p) => p.name === e.target.value);
    if (selected) {
      setProvider?.(selected);
      // Reset modelo para o primeiro disponível
      const firstModel = (SMARTCODE_MODELS[selected.name] ?? [])[0];
      if (firstModel) setModel?.(firstModel);
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel?.(e.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Provider selector */}
      <div className="relative">
        <select
          ref={providerSelectRef}
          value={provider?.name ?? ''}
          onChange={handleProviderChange}
          className={classNames(
            'h-8 pl-3 pr-8 rounded-lg text-sm appearance-none cursor-pointer',
            'bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary',
            'border border-bolt-elements-borderColor',
            'hover:border-bolt-elements-focus focus:outline-none focus:border-bolt-elements-focus',
          )}
        >
          {availableProviders.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <div className="i-ph:caret-down text-bolt-elements-textTertiary text-xs" />
        </div>
      </div>

      {/* Model selector */}
      <div className="relative">
        <select
          ref={modelSelectRef}
          value={model ?? ''}
          onChange={handleModelChange}
          className={classNames(
            'h-8 pl-3 pr-8 rounded-lg text-sm appearance-none cursor-pointer',
            'bg-bolt-elements-background-depth-3 text-bolt-elements-textPrimary',
            'border border-bolt-elements-borderColor',
            'hover:border-bolt-elements-focus focus:outline-none focus:border-bolt-elements-focus',
            'max-w-[200px]',
          )}
        >
          {availableModels.length > 0 ? (
            availableModels.map((m) => (
              <option key={m.name} value={m.name}>
                {MODEL_LABELS[m.name] ?? m.label}
              </option>
            ))
          ) : (
            <option value="" disabled>
              Nenhum modelo disponível
            </option>
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <div className="i-ph:caret-down text-bolt-elements-textTertiary text-xs" />
        </div>
      </div>
    </div>
  );
};

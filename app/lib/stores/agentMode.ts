/**
 * KODA AGENT MODES
 * Lite / Economy / Power
 *
 * Lite    → rápido e leve (edits simples, UI tweaks)
 * Economy → equilíbrio velocidade/qualidade — FREE TIER
 * Power   → modelos top-tier para raciocínio complexo — PRO ONLY ⚡
 */
import { atom, computed } from 'nanostores';

export type AgentMode = 'lite' | 'economy' | 'power';
export type UserPlan = 'free' | 'pro' | 'enterprise';

export interface AgentModeConfig {
  id: AgentMode;
  label: string;
  description: string;
  longDescription: string;
  requiresPro: boolean;
  models: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
  features: {
    appTesting: boolean;
    codeOptimization: boolean;
    deepReasoning: boolean;
    turbo: boolean;
  };
}

export const AGENT_MODES: Record<AgentMode, AgentModeConfig> = {
  lite: {
    id: 'lite',
    label: 'Lite',
    description: 'Fast, lightweight models for quick edits.',
    longDescription:
      'Fast, lightweight models for quick edits and iterations. Best mode for small changes and visual tweaks.',
    requiresPro: false,
    models: {
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-haiku-20240307',
      google: 'gemini-1.5-flash',
    },
    features: { appTesting: false, codeOptimization: false, deepReasoning: false, turbo: false },
  },
  economy: {
    id: 'economy',
    label: 'Economy',
    description: 'Cost-optimized models for everyday tasks.',
    longDescription:
      'Cost-optimized models for everyday tasks. Delivers a strong balance of speed and quality. Best mode for most builds.',
    requiresPro: false,
    models: {
      openai: 'gpt-4o',
      anthropic: 'claude-3-5-sonnet-20241022',
      google: 'gemini-1.5-pro',
    },
    features: { appTesting: true, codeOptimization: true, deepReasoning: false, turbo: false },
  },
  power: {
    id: 'power',
    label: 'Power',
    description: 'Higher-performance models for complex work.',
    longDescription:
      'Higher-performance models for complex work. Best for larger changes, deeper reasoning, and longer builds.',
    requiresPro: true, // ⚡ PRO ONLY
    models: {
      openai: 'o3',
      anthropic: 'claude-opus-4-5',
      google: 'gemini-2.0-flash',
    },
    features: { appTesting: true, codeOptimization: true, deepReasoning: true, turbo: false },
  },
};

// ── Plan store (alimentado pelo kodaAuth na montagem) ──────────────────────
export const userPlanStore = atom<UserPlan>('free');

export function setUserPlan(plan: UserPlan) {
  userPlanStore.set(plan);
}

export function canUseMode(mode: AgentMode, plan: UserPlan): boolean {
  if (!AGENT_MODES[mode].requiresPro) return true;
  return plan === 'pro' || plan === 'enterprise';
}

// ── Agent mode store ──────────────────────────────────────────────────────
function loadMode(): AgentMode {
  try {
    const saved = localStorage.getItem('koda_agent_mode') as AgentMode;
    if (saved && saved in AGENT_MODES) return saved;
  } catch {}
  return 'economy';
}

export const agentModeStore = atom<AgentMode>(
  typeof window !== 'undefined' ? loadMode() : 'economy',
);

export const currentModeConfig = computed(agentModeStore, (mode) => AGENT_MODES[mode]);

export function setAgentMode(mode: AgentMode, plan: UserPlan = 'free') {
  if (!canUseMode(mode, plan)) return false; // bloqueado
  agentModeStore.set(mode);
  try {
    localStorage.setItem('koda_agent_mode', mode);
  } catch {}
  return true;
}

/** Retorna o modelo ideal para o provider ativo baseado no modo */
export function getModelForMode(mode: AgentMode, providerName: string): string | null {
  const config = AGENT_MODES[mode];
  const providerMap: Record<string, keyof typeof config.models> = {
    OpenAI: 'openai',
    Anthropic: 'anthropic',
    Google: 'google',
  };
  const key = providerMap[providerName];
  return key ? config.models[key] || null : null;
}

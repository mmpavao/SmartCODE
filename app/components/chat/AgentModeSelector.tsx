/**
 * KODA AGENT MODE SELECTOR
 * Lite / Economy (free) / Power (Pro ⚡)
 */
import { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { classNames } from '~/utils/classNames';
import {
  agentModeStore,
  setAgentMode,
  AGENT_MODES,
  currentModeConfig,
  userPlanStore,
  canUseMode,
  type AgentMode,
} from '~/lib/stores/agentMode';

interface AgentModeSelectorProps {
  onModeChange?: (mode: AgentMode) => void;
  className?: string;
}

const MODE_ICONS: Record<AgentMode, string> = {
  lite: 'i-ph:lightning',
  economy: 'i-ph:squares-four',
  power: 'i-ph:cpu',
};

export function AgentModeSelector({ onModeChange, className }: AgentModeSelectorProps) {
  const mode = useStore(agentModeStore);
  const config = useStore(currentModeConfig);
  const plan = useStore(userPlanStore);

  const [open, setOpen] = useState(false);
  const [appTesting, setAppTesting] = useState(config.features.appTesting);
  const [codeOpt, setCodeOpt] = useState(config.features.codeOptimization);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAppTesting(config.features.appTesting);
    setCodeOpt(config.features.codeOptimization);
  }, [mode, config]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowUpgrade(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleModeSelect = (newMode: AgentMode) => {
    if (!canUseMode(newMode, plan)) {
      setShowUpgrade(true);
      return;
    }
    setShowUpgrade(false);
    const changed = setAgentMode(newMode, plan);
    if (changed) onModeChange?.(newMode);
  };

  const isPowerLocked = !canUseMode('power', plan);

  return (
    <div ref={ref} className={classNames('relative', className)}>
      {/* Trigger */}
      <button
        onClick={() => { setOpen(!open); setShowUpgrade(false); }}
        className={classNames(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all',
          'bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor',
          'hover:border-bolt-elements-borderColorActive text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
          open && 'border-bolt-elements-borderColorActive text-bolt-elements-textPrimary',
        )}
        title={`Agent mode: ${config.label}`}
      >
        <div className={classNames(MODE_ICONS[mode], 'text-base')} />
        <span>{config.label}</span>
        <div className="i-ph:caret-down text-xs opacity-60" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-xl shadow-2xl z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center px-3 py-2.5 border-b border-bolt-elements-borderColor">
            <span className="text-xs font-medium text-bolt-elements-textSecondary">Agent modes</span>
            <span className="ml-auto text-xs text-bolt-elements-textTertiary opacity-60">Cycle ⌘⇧I</span>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1.5 p-3 pb-0">
            {(Object.keys(AGENT_MODES) as AgentMode[]).map((m) => {
              const locked = !canUseMode(m, plan);
              const isSelected = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => handleModeSelect(m)}
                  title={locked ? `Power mode requires a Pro plan` : AGENT_MODES[m].description}
                  className={classNames(
                    'relative flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all border',
                    isSelected
                      ? 'bg-bolt-elements-background-depth-4 border-bolt-elements-borderColorActive text-bolt-elements-textPrimary'
                      : locked
                      ? 'border-transparent text-bolt-elements-textTertiary hover:bg-bolt-elements-background-depth-3 cursor-pointer'
                      : 'border-transparent text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary',
                  )}
                >
                  <div className={classNames(MODE_ICONS[m], 'text-sm')} />
                  <span>{AGENT_MODES[m].label}</span>
                  {locked && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-500 flex items-center justify-center">
                      <div className="i-ph:lock-simple-fill text-white" style={{ fontSize: '8px' }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Upgrade CTA — aparece ao tentar clicar Power sem Pro */}
          {showUpgrade && (
            <div className="mx-3 mt-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="i-ph:crown-simple-fill text-violet-400 text-base" />
                <span className="text-sm font-semibold text-violet-300">Power requires Pro</span>
              </div>
              <p className="text-xs text-bolt-elements-textSecondary mb-2.5 leading-relaxed">
                Unlock the fastest models, deep reasoning and advanced features with a Koda Pro plan.
              </p>
              <button
                onClick={() => { /* TODO: abrir modal de upgrade */ }}
                className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors"
              >
                Upgrade to Pro ⚡
              </button>
            </div>
          )}

          {/* Description do modo atual */}
          {!showUpgrade && (
            <p className="px-4 py-3 text-xs text-bolt-elements-textSecondary leading-relaxed">
              {config.longDescription}
              {config.requiresPro && plan !== 'pro' && plan !== 'enterprise' && (
                <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 text-xs font-medium">
                  ⚡ Pro
                </span>
              )}
            </p>
          )}

          {/* Advanced settings */}
          <div className="border-t border-bolt-elements-borderColor">
            <div className="px-4 pt-2.5 pb-1">
              <span className="text-xs text-bolt-elements-textTertiary flex items-center gap-1">
                <div className="i-ph:caret-down text-xs" /> Advanced settings
              </span>
            </div>

            <div className="px-4 pb-3 space-y-2.5">
              {/* App testing */}
              <div className="flex items-start gap-3">
                <div className="i-ph:device-mobile text-base text-bolt-elements-textSecondary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-bolt-elements-textPrimary">App testing</p>
                  <p className="text-xs text-bolt-elements-textTertiary">Agent tests your app automatically</p>
                </div>
                <button
                  onClick={() => !isPowerLocked && mode !== 'lite' && setAppTesting(!appTesting)}
                  disabled={mode === 'lite'}
                  className={classNames(
                    'relative flex-shrink-0 w-9 h-5 rounded-full transition-colors',
                    appTesting && mode !== 'lite' ? 'bg-violet-500' : 'bg-bolt-elements-background-depth-4',
                    mode === 'lite' && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <span className={classNames(
                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    appTesting && mode !== 'lite' ? 'translate-x-4' : 'translate-x-0',
                  )} />
                </button>
              </div>

              {/* Code optimization */}
              <div className="flex items-start gap-3">
                <div className="i-ph:code text-base text-bolt-elements-textSecondary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-bolt-elements-textPrimary">Code optimization</p>
                  <p className="text-xs text-bolt-elements-textTertiary">Automatically reviews code for bugs and optimizations</p>
                </div>
                <button
                  onClick={() => mode !== 'lite' && setCodeOpt(!codeOpt)}
                  disabled={mode === 'lite'}
                  className={classNames(
                    'relative flex-shrink-0 w-9 h-5 rounded-full transition-colors',
                    codeOpt && mode !== 'lite' ? 'bg-violet-500' : 'bg-bolt-elements-background-depth-4',
                    mode === 'lite' && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  <span className={classNames(
                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                    codeOpt && mode !== 'lite' ? 'translate-x-4' : 'translate-x-0',
                  )} />
                </button>
              </div>

              {/* Turbo — Pro only */}
              <div className="flex items-start gap-3 opacity-50">
                <div className="i-ph:rocket-launch text-base text-bolt-elements-textSecondary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-bolt-elements-textPrimary flex items-center gap-1.5">
                    Turbo
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs bg-violet-500/15 text-violet-400 border border-violet-500/20">
                      ⚡ Pro
                    </span>
                  </p>
                  <p className="text-xs text-bolt-elements-textTertiary">Upgrade to Pro to unlock the fastest models.</p>
                </div>
                <button disabled className="relative flex-shrink-0 w-9 h-5 rounded-full bg-bolt-elements-background-depth-4 cursor-not-allowed">
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer: plan badge */}
          <div className="px-4 py-2.5 border-t border-bolt-elements-borderColor flex items-center justify-between">
            <span className="text-xs text-bolt-elements-textTertiary">
              Current plan:{' '}
              <span className={classNames(
                'font-semibold',
                plan === 'pro' || plan === 'enterprise' ? 'text-violet-400' : 'text-bolt-elements-textSecondary',
              )}>
                {plan === 'enterprise' ? '🚀 Enterprise' : plan === 'pro' ? '⚡ Pro' : '✦ Free'}
              </span>
            </span>
            {plan === 'free' && (
              <button
                onClick={() => { /* TODO: upgrade modal */ }}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Upgrade →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * KODA AGENT MODE SELECTOR
 * Dropdown estilo Replit: Lite / Economy / Power
 */
import { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { classNames } from '~/utils/classNames';
import {
  agentModeStore,
  setAgentMode,
  AGENT_MODES,
  currentModeConfig,
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
  const [open, setOpen] = useState(false);
  const [appTesting, setAppTesting] = useState(true);
  const [codeOpt, setCodeOpt] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  // Sincronizar toggles com o modo
  useEffect(() => {
    setAppTesting(config.features.appTesting);
    setCodeOpt(config.features.codeOptimization);
  }, [mode, config]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleModeSelect = (newMode: AgentMode) => {
    setAgentMode(newMode);
    onModeChange?.(newMode);
  };

  return (
    <div ref={ref} className={classNames('relative', className)}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
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
          {/* Mode tabs */}
          <div className="flex items-center gap-1 p-3 border-b border-bolt-elements-borderColor">
            <span className="text-xs font-medium text-bolt-elements-textSecondary mr-auto">Agent modes</span>
            <span className="text-xs text-bolt-elements-textTertiary">Cycle ⌘⇧I</span>
          </div>

          <div className="flex gap-1.5 p-3 pb-0">
            {(Object.keys(AGENT_MODES) as AgentMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeSelect(m)}
                className={classNames(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all border',
                  mode === m
                    ? 'bg-bolt-elements-background-depth-4 border-bolt-elements-borderColorActive text-bolt-elements-textPrimary'
                    : 'border-transparent text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary',
                )}
              >
                <div className={classNames(MODE_ICONS[m], 'text-base')} />
                <span>{AGENT_MODES[m].label}</span>
              </button>
            ))}
          </div>

          {/* Description */}
          <p className="px-4 py-3 text-xs text-bolt-elements-textSecondary leading-relaxed">
            {config.longDescription}
          </p>

          {/* Advanced settings */}
          <div className="border-t border-bolt-elements-borderColor">
            <button
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
              onClick={() => {
                // Toggle expanded state (futuro)
              }}
            >
              <div className="i-ph:caret-down text-sm" />
              <span>Advanced settings</span>
            </button>

            <div className="px-4 pb-3 space-y-2.5">
              {/* App testing toggle */}
              <div className="flex items-center gap-3">
                <div className="i-ph:device-mobile text-base text-bolt-elements-textSecondary" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-bolt-elements-textPrimary">App testing</p>
                  <p className="text-xs text-bolt-elements-textTertiary">Agent tests your app automatically</p>
                </div>
                <button
                  onClick={() => setAppTesting(!appTesting)}
                  className={classNames(
                    'relative w-9 h-5 rounded-full transition-colors',
                    appTesting ? 'bg-violet-500' : 'bg-bolt-elements-background-depth-4',
                    !config.features.appTesting && mode === 'lite' && 'opacity-40 cursor-not-allowed',
                  )}
                  disabled={mode === 'lite'}
                >
                  <span
                    className={classNames(
                      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      appTesting ? 'translate-x-4' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>

              {/* Code optimization toggle */}
              <div className="flex items-center gap-3">
                <div className="i-ph:code text-base text-bolt-elements-textSecondary" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-bolt-elements-textPrimary">Code optimization</p>
                  <p className="text-xs text-bolt-elements-textTertiary">Automatically reviews code for bugs and optimizations</p>
                </div>
                <button
                  onClick={() => setCodeOpt(!codeOpt)}
                  className={classNames(
                    'relative w-9 h-5 rounded-full transition-colors',
                    codeOpt ? 'bg-violet-500' : 'bg-bolt-elements-background-depth-4',
                    mode === 'lite' && 'opacity-40 cursor-not-allowed',
                  )}
                  disabled={mode === 'lite'}
                >
                  <span
                    className={classNames(
                      'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      codeOpt ? 'translate-x-4' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>

              {/* Turbo — Pro only */}
              <div className="flex items-center gap-3 opacity-50">
                <div className="i-ph:rocket-launch text-base text-bolt-elements-textSecondary" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-bolt-elements-textPrimary flex items-center gap-1.5">
                    Turbo
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs bg-violet-500/15 text-violet-400 border border-violet-500/20">
                      ✦ Pro
                    </span>
                  </p>
                  <p className="text-xs text-bolt-elements-textTertiary">Upgrade to Pro to unlock the fastest models.</p>
                </div>
                <button
                  disabled
                  className="relative w-9 h-5 rounded-full bg-bolt-elements-background-depth-4 cursor-not-allowed"
                >
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef } from 'react';
import useAppStore from '../store/useAppStore';
import { runRules, buildDatasetSummary } from '../services/ruleEngine';
import { generateGridSpec } from '../services/llmService';
import { fetchAEData } from '../services/territoryApi';

export default function ChatBar() {
  const step = useAppStore((s) => s.step);
  const filters = useAppStore((s) => s.filters);
  const manager = useAppStore((s) => s.manager);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const setGridSpec = useAppStore((s) => s.setGridSpec);
  const setIsLoading = useAppStore((s) => s.setIsLoading);
  const isLoading = useAppStore((s) => s.isLoading);

  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const disabled = step < 3;

  async function handleSubmit(e) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || isLoading || disabled) return;

    setInput('');
    addChatMessage({ role: 'user', text: prompt, tag: null });
    setIsLoading(true);

    try {
      const aeData = await fetchAEData({ ...filters, manager });
      const ruleOutput = runRules(aeData, filters);
      const summary = buildDatasetSummary(aeData, ruleOutput);
      const spec = await generateGridSpec(prompt, ruleOutput, summary);

      if (spec) {
        setGridSpec(spec);
        addChatMessage({ role: 'assistant', text: spec.narrative, tag: spec.tag });
      } else {
        addChatMessage({
          role: 'assistant',
          text: 'I was unable to generate a grid specification for that query. Please try rephrasing.',
          tag: 'rule',
        });
      }
    } catch (err) {
      console.error('[ChatBar] Error:', err);
      addChatMessage({
        role: 'assistant',
        text: 'An error occurred while processing your request. Please check the console for details.',
        tag: 'rule',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className={`chatbar ${disabled ? 'chatbar--disabled' : ''}`}>
      {disabled && (
        <div className="chatbar-locked-banner">
          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, flexShrink: 0 }}>
            <path d="M8 1a3.5 3.5 0 00-3.5 3.5V7H3a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1h-1.5V4.5A3.5 3.5 0 008 1zm-2 3.5a2 2 0 114 0V7H6V4.5z" />
          </svg>
          Chat unlocks at Step 3 — after manager selection and rule engine load
        </div>
      )}
      <form className="chatbar-form" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="chatbar-input"
          placeholder={disabled ? 'Chat available from Step 3…' : 'Ask about territory risks, capacity, recommendations…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isLoading}
          rows={1}
        />
        <button
          type="submit"
          className="chatbar-send"
          disabled={!input.trim() || disabled || isLoading}
          aria-label="Send"
        >
          {isLoading ? (
            <div className="spinner spinner--sm" />
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16 }}>
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.903 6.557H13.5a.75.75 0 010 1.5H4.182l-1.903 6.557a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          )}
        </button>
      </form>
      <div className="chatbar-hint">
        <span>↵ Send · Shift+↵ New line</span>
        <span>Rule engine runs first · LLM reasons on output</span>
      </div>
    </div>
  );
}

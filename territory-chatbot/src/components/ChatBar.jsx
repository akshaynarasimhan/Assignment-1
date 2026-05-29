import React, { useState, useRef } from 'react';
import useAppStore from '../store/useAppStore';
import { runRules, buildDatasetSummary } from '../services/ruleEngine';
import { generateGridSpec, parseAssignmentIntent } from '../services/llmService';
import { fetchAEData } from '../services/territoryApi';

const ASSIGNMENT_KEYWORDS = ['assign', 'move', 'give', 'transfer', 'remove', 'unassign', 'reverse'];

function isAssignmentIntent(text) {
  const lower = text.toLowerCase();
  return ASSIGNMENT_KEYWORDS.some((kw) => lower.includes(kw));
}

export default function ChatBar() {
  const step = useAppStore((s) => s.step);
  const manager = useAppStore((s) => s.manager);
  const allAEData = useAppStore((s) => s.allAEData);
  const allAccounts = useAppStore((s) => s.allAccounts);
  const assignAccount = useAppStore((s) => s.assignAccount);
  const unassignAccount = useAppStore((s) => s.unassignAccount);
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
      // Route to assignment handler or grid spec handler
      if (step >= 5 && isAssignmentIntent(prompt)) {
        await handleAssignmentPrompt(prompt);
      } else {
        await handleGridSpecPrompt(prompt);
      }
    } catch (err) {
      console.error('[ChatBar] Error:', err);
      addChatMessage({
        role: 'assistant',
        text: 'An error occurred while processing your request.',
        tag: 'rule',
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  async function handleGridSpecPrompt(prompt) {
    const aeData = await fetchAEData({ manager });
    const ruleOutput = runRules(aeData, null);
    const summary = buildDatasetSummary(aeData, ruleOutput);
    const spec = await generateGridSpec(prompt, ruleOutput, summary);
    if (spec) {
      setGridSpec(spec);
      addChatMessage({ role: 'assistant', text: spec.narrative, tag: spec.tag });
    } else {
      addChatMessage({ role: 'assistant', text: 'Could not generate a view for that query. Please try rephrasing.', tag: 'rule' });
    }
  }

  async function handleAssignmentPrompt(prompt) {
    // Use full roster + all accounts so cross-team moves always resolve
    const intent = await parseAssignmentIntent(prompt, allAEData, allAccounts);

    if (!intent) {
      addChatMessage({ role: 'assistant', text: 'Could not parse that instruction. Try: "Move Nexgen to Quinn Patel"', tag: 'rule' });
      return;
    }

    addChatMessage({ role: 'assistant', text: intent.narrative, tag: intent.tag });

    if (intent.intent === 'assign' && intent.actions?.length) {
      intent.actions.forEach((action) => {
        if (!action.company || !action.toAE) return;

        // Fuzzy match account against full account list
        const account = allAccounts.find((a) => {
          const co = a.company.toLowerCase();
          const q = action.company.toLowerCase();
          return co.includes(q) || q.includes(co.split(' ')[0]);
        });

        // Fuzzy match AE against full 120-rep roster
        const ae = allAEData.find((a) => {
          const name = a.aeName.toLowerCase();
          const q = action.toAE.toLowerCase();
          return name.includes(q) || q.includes(name.split(' ')[0]) || q.includes(name.split(' ')[1] ?? '___');
        });

        if (account && ae) {
          assignAccount(account, ae.id);
          addChatMessage({
            role: 'assistant',
            text: `✓ **${account.company}** moved to **${ae.aeName}** (${ae.role}).\nCV transferred: ~${Math.round(account.cv / 1000)}k. Metrics updated live in the Step 3 grid.`,
            tag: 'hybrid',
          });
        } else {
          const missing = !account
            ? `Could not find account matching "${action.company}".`
            : `Could not find AE matching "${action.toAE}". Try using first or last name.`;
          addChatMessage({ role: 'assistant', text: missing, tag: 'rule' });
        }
      });
    }

    if (intent.intent === 'unassign' && intent.actions?.length) {
      intent.actions.forEach((action) => {
        if (!action.company) return;
        const account = allAccounts.find((a) =>
          a.company.toLowerCase().includes(action.company.toLowerCase())
        );
        if (account) {
          unassignAccount(account.id);
          addChatMessage({ role: 'assistant', text: `✓ Assignment of **${account.company}** reversed. Metrics restored.`, tag: 'rule' });
        }
      });
    }

    if (intent.intent === 'query') {
      // Already shown the narrative — nothing more to do
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  const placeholder = disabled
    ? 'Chat available from Step 3…'
    : step >= 5
      ? 'Assign accounts: "Move Nexgen to Quinn" · Ask questions · Customise…'
      : 'Ask about territory risks, capacity, recommendations…';

  return (
    <div className={`chatbar ${disabled ? 'chatbar--disabled' : ''}`}>
      {disabled && (
        <div className="chatbar-locked-banner">
          <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 12, flexShrink: 0 }}>
            <path d="M8 1a3.5 3.5 0 00-3.5 3.5V7H3a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1h-1.5V4.5A3.5 3.5 0 008 1zm-2 3.5a2 2 0 114 0V7H6V4.5z" />
          </svg>
          Chat unlocks at Step 3
        </div>
      )}
      {step >= 5 && !disabled && (
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 2px 6px',
        }}>
          {[
            'Assign Nexgen to Quinn Patel',
            'Move Arcturus to Taylor Singh',
            'Which AE has most free capacity?',
            'Show me overloaded reps',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
              style={{
                fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface3)',
                border: '1px solid var(--border)', borderRadius: 4,
                padding: '3px 8px', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = 'var(--gartner)'; e.target.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <form className="chatbar-form" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className="chatbar-input"
          placeholder={placeholder}
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
        <span>{step >= 5 ? 'Natural language assignments supported' : 'Rule engine runs first · LLM reasons on output'}</span>
      </div>
    </div>
  );
}

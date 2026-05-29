import React, { useEffect, useRef } from 'react';
import useAppStore from '../store/useAppStore';

const TAG_META = {
  rule: { label: 'RULE', color: '#e3b341', bg: 'rgba(227,179,65,0.1)', border: 'rgba(227,179,65,0.25)' },
  llm: { label: 'LLM', color: '#79c0ff', bg: 'rgba(121,192,255,0.1)', border: 'rgba(121,192,255,0.25)' },
  hybrid: { label: 'HYBRID', color: '#56d364', bg: 'rgba(86,211,100,0.1)', border: 'rgba(86,211,100,0.25)' },
};

function TagBadge({ tag }) {
  if (!tag) return null;
  const meta = TAG_META[tag] ?? TAG_META.llm;
  return (
    <span style={{
      background: meta.bg,
      color: meta.color,
      border: `1px solid ${meta.border}`,
      borderRadius: 3,
      padding: '1px 6px',
      fontSize: 10,
      fontFamily: 'var(--mono)',
      fontWeight: 700,
      letterSpacing: '0.08em',
      flexShrink: 0,
    }}>
      {meta.label}
    </span>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const lines = message.text.split('\n');

  return (
    <div className={`msg-row ${isUser ? 'msg-row--user' : 'msg-row--assistant'}`}>
      {!isUser && (
        <div className="msg-avatar msg-avatar--ai">
          <svg viewBox="0 0 16 16" fill="none" style={{ width: 12 }}>
            <circle cx="8" cy="8" r="7" stroke="#0073ab" strokeWidth="1.5" />
            <path d="M5 9.5C5.5 10.5 6.5 11 8 11s2.5-.5 3-1.5" stroke="#0073ab" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="6" cy="6.5" r="1" fill="#0073ab" />
            <circle cx="10" cy="6.5" r="1" fill="#0073ab" />
          </svg>
        </div>
      )}
      <div className="msg-content-wrap">
        {!isUser && (
          <div className="msg-header">
            <span className="msg-sender">Territory IQ</span>
            <TagBadge tag={message.tag} />
          </div>
        )}
        <div className={`msg-bubble ${isUser ? 'msg-bubble--user' : 'msg-bubble--ai'}`}>
          {lines.map((line, i) => {
            if (!line.trim()) return <br key={i} />;
            // Bold **text** support
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
              <p key={i} style={{ margin: '2px 0' }}>
                {parts.map((part, j) =>
                  j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                )}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ChatMessages() {
  const chatHistory = useAppStore((s) => s.chatHistory);
  const isLoading = useAppStore((s) => s.isLoading);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (chatHistory.length === 0 && !isLoading) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 28, color: 'var(--text-muted)' }}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="chat-empty-title">Territory Intelligence</p>
        <p className="chat-empty-sub">Reach Step 3 to start the analysis. Rule engine and LLM will collaborate automatically.</p>
      </div>
    );
  }

  return (
    <div className="chat-messages">
      {chatHistory.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      {isLoading && (
        <div className="msg-row msg-row--assistant">
          <div className="msg-avatar msg-avatar--ai">
            <div className="spinner spinner--xs" />
          </div>
          <div className="msg-content-wrap">
            <div className="msg-bubble msg-bubble--ai msg-bubble--typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

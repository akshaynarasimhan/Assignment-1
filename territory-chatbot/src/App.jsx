import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ChatMessages from './components/ChatMessages';
import ChatBar from './components/ChatBar';
import Step1Filter from './components/steps/Step1Filter';
import Step2Manager from './components/steps/Step2Manager';
import Step3Metrics from './components/steps/Step3Metrics';
import Step4Collapse from './components/steps/Step4Collapse';
import Step5Recommend from './components/steps/Step5Recommend';
import useAppStore from './store/useAppStore';
import './App.css';

function StepContent() {
  const step = useAppStore((s) => s.step);
  switch (step) {
    case 1: return <Step1Filter />;
    case 2: return <Step2Manager />;
    case 3: return <Step3Metrics />;
    case 4: return <Step4Collapse />;
    case 5: return <Step5Recommend />;
    default: return <Step1Filter />;
  }
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);

  return (
    <div className="app-root">
      <div className="app-shell">

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <div className={`sidebar-drawer ${sidebarOpen ? 'sidebar-drawer--open' : ''}`}>
          <Sidebar />
        </div>

        {/* ── Centre: topbar + content ──────────────────────────── */}
        <div className="centre-col">
          <Topbar
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            chatOpen={chatOpen}
            onToggleChat={() => setChatOpen((v) => !v)}
          />
          <div className="content-scroll">
            <StepContent />
          </div>
        </div>

        {/* ── Chat panel ────────────────────────────────────────── */}
        <div className={`chat-drawer ${chatOpen ? 'chat-drawer--open' : ''}`}>
          <div className="chat-layout">
            <div className="chat-header">
              <span className="chat-header-title">Territory Intelligence</span>
              <span className="chat-header-sub">LLM + Rule Engine</span>
            </div>
            <div className="chat-messages-wrap">
              <ChatMessages />
            </div>
            <ChatBar />
          </div>
        </div>

      </div>
    </div>
  );
}

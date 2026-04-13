import React, { useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
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

  return (
    <div className="app-root">
      {/* Sidebar toggle button — always visible */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((v) => !v)}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarOpen ? '◀' : '▶'}
      </button>

      <div className="app-panels">
        {/* Sidebar — hidden via CSS when collapsed */}
        <div className={`sidebar-panel ${sidebarOpen ? 'sidebar-panel--open' : 'sidebar-panel--closed'}`}>
          <Sidebar />
        </div>

        {/* Main area — always fills remaining space */}
        <div className="main-panel">
          <div className="main-layout">
            <Topbar />
            <div className="main-body">
              <PanelGroup direction="horizontal" className="content-panel-group">
                <Panel defaultSize={52} minSize={35} className="panel-content">
                  <div className="content-scroll">
                    <StepContent />
                  </div>
                </Panel>
                <PanelResizeHandle className="resize-handle">
                  <div className="resize-handle-bar" />
                </PanelResizeHandle>
                <Panel defaultSize={48} minSize={36} maxSize={60} className="panel-chat">
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
                </Panel>
              </PanelGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

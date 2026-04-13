import React from 'react';
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
  return (
    <div className="app-root">
      <PanelGroup direction="horizontal" className="app-panel-group">
        <Panel defaultSize={18} minSize={15} maxSize={25} className="panel-sidebar">
          <Sidebar />
        </Panel>
        <PanelResizeHandle className="resize-handle">
          <div className="resize-handle-bar" />
        </PanelResizeHandle>
        <Panel className="panel-main">
          <div className="main-layout">
            <Topbar />
            <div className="main-body">
              <PanelGroup direction="horizontal" className="content-panel-group">
                <Panel defaultSize={62} minSize={45} className="panel-content">
                  <div className="content-scroll">
                    <StepContent />
                  </div>
                </Panel>
                <PanelResizeHandle className="resize-handle">
                  <div className="resize-handle-bar" />
                </PanelResizeHandle>
                <Panel defaultSize={38} minSize={28} maxSize={50} className="panel-chat">
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
        </Panel>
      </PanelGroup>
    </div>
  );
}

import { useState } from 'react';
import Dashboard from './components/Dashboard';
import SignalsFeed from './components/SignalsFeed';
import Watchlist from './components/Watchlist';
import { LayoutDashboard, Zap, ListChecks, TrendingUp } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'signals', label: 'EP Signals', icon: Zap },
  { id: 'watchlist', label: 'Watchlist', icon: ListChecks },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      {/* Top nav */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <TrendingUp size={16} className="text-slate-900" />
              </div>
              <div>
                <div className="font-black text-white text-sm tracking-tight">EP Signal Engine</div>
                <div className="text-xs text-slate-500 -mt-0.5 tracking-widest uppercase">Episodic Pivot</div>
              </div>
            </div>

            {/* Tab nav */}
            <nav className="flex items-center gap-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-amber-500 text-slate-900'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Status pill */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-slate-500">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'signals' && <SignalsFeed />}
        {activeTab === 'watchlist' && <Watchlist />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-slate-600">
          <span>EP Signal Engine &bull; Built with yfinance + OpenAI + Supabase + Resend</span>
          <span>Supabase Project: dwmpjtjbijksgbfdgjij</span>
        </div>
      </footer>
    </div>
  );
}

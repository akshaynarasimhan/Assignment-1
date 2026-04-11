import { useState, useEffect } from 'react';
import { getStats, runEngine } from '../api';
import StatCard from './StatCard';
import { Play, Mail, Activity, TrendingUp, Zap, Database } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch {
      // silent
    }
  };

  useEffect(() => { loadStats(); }, []);

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    setError('');
    try {
      const result = await runEngine();
      setRunResult(result);
      await loadStats();
    } catch {
      setError('Engine run failed. Check that the backend API is running.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Watchlist"
            value={stats?.watchlist_count}
            sub="active tickers"
            color="text-amber-400"
          />
          <StatCard
            label="Processed"
            value={stats?.total_processed}
            sub="headlines analyzed"
            color="text-slate-300"
          />
          <StatCard
            label="EP Signals"
            value={stats?.total_signals}
            sub="pivots detected"
            color="text-emerald-400"
          />
          <StatCard
            label="High"
            value={stats?.high}
            sub="critical signals"
            color="text-red-400"
          />
          <StatCard
            label="Medium"
            value={stats?.medium}
            sub="notable signals"
            color="text-amber-400"
          />
          <StatCard
            label="Low"
            value={stats?.low}
            sub="minor signals"
            color="text-blue-400"
          />
        </div>
      </div>

      {/* Engine controls */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Engine Control</h2>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Activity size={20} className="text-amber-400" />
                <h3 className="font-semibold text-white">EP Signal Engine</h3>
                <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 text-xs rounded-full border border-emerald-500/30 font-medium">
                  Ready
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Fetches the latest news from yfinance for all tickers in your watchlist, 
                applies AI-powered EP signal detection, deduplicates against prior runs, 
                and sends a digest email when new signals are found.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <TrendingUp size={14} className="text-amber-400/70" />
                  <span>yfinance news fetch</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Zap size={14} className="text-amber-400/70" />
                  <span>GPT-4o-mini analysis</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Database size={14} className="text-amber-400/70" />
                  <span>Supabase dedup</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail size={14} className="text-amber-400/70" />
                  <span>Resend email digest</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <button
                onClick={handleRun}
                disabled={running}
                className="flex items-center gap-2.5 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
              >
                <Play size={16} className={running ? 'animate-pulse' : ''} />
                {running ? 'Running Engine...' : 'Run Engine Now'}
              </button>
            </div>
          </div>

          {runResult && (
            <div className="mt-5 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Zap size={15} />
                Engine run complete
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {runResult.signals_found > 0
                  ? `${runResult.signals_found} new EP signal${runResult.signals_found !== 1 ? 's' : ''} detected. Email digest sent to lakshaynarasimhan@gmail.com.`
                  : 'No new EP signals found. All headlines have been processed before or are noise.'}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Schedule info */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Automation</h2>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-2">Automatic Schedule</div>
              <p className="text-sm text-slate-500">
                Run <code className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs">python scheduler.py</code> to 
                start the engine automatically every 30 minutes.
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-2">Manual Email</div>
              <p className="text-sm text-slate-500">
                Run <code className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs">python mailer.py</code> to 
                send a digest of the most recent 50 signals immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

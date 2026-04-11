import { useState, useEffect } from 'react';
import { getStats, runEngine, sendDigest } from '../api';
import StatCard from './StatCard';
import { Play, Mail, Activity, TrendingUp, Zap, Database, Clock } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [running, setRunning] = useState(false);
  const [sending, setSending] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [digestResult, setDigestResult] = useState(null);
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

  const handleSendDigest = async () => {
    setSending(true);
    setDigestResult(null);
    try {
      await sendDigest();
      setDigestResult('Morning digest queued — email will arrive at lakshaynarasimhan@gmail.com shortly.');
    } catch {
      setDigestResult('Failed to send digest. Check RESEND_API_KEY.');
    } finally {
      setSending(false);
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
                  <span>Economic Times RSS</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <TrendingUp size={14} className="text-amber-400/70" />
                  <span>Moneycontrol RSS</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <TrendingUp size={14} className="text-amber-400/70" />
                  <span>Yahoo Finance + Google News</span>
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
                  <Clock size={14} className="text-amber-400/70" />
                  <span>Daily 8:00 AM IST digest</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <button
                onClick={handleRun}
                disabled={running}
                className="flex items-center gap-2.5 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
              >
                <Play size={16} className={running ? 'animate-pulse' : ''} />
                {running ? 'Running Engine...' : 'Run Engine Now'}
              </button>
              <button
                onClick={handleSendDigest}
                disabled={sending}
                className="flex items-center gap-2.5 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed border border-slate-600"
              >
                <Mail size={16} />
                {sending ? 'Sending...' : 'Send Morning Digest'}
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

          {digestResult && (
            <div className="mt-5 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-300 text-sm flex items-center gap-2">
              <Mail size={15} />
              {digestResult}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Clock size={14} className="text-amber-400" /> Daily 8:00 AM IST Digest
              </div>
              <p className="text-sm text-slate-500">
                Automatically sends a full digest of all EP signals from the last 24 hours to <span className="text-slate-300">lakshaynarasimhan@gmail.com</span>. Always sends — even if no signals (shows "markets are calm").
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Activity size={14} className="text-amber-400" /> 30-Min Engine Runs
              </div>
              <p className="text-sm text-slate-500">
                Engine fetches fresh news from <span className="text-amber-400/80">ET</span>, <span className="text-amber-400/80">MC</span>, <span className="text-amber-400/80">Yahoo</span> every 30 minutes. Start with: <code className="text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded text-xs">python scheduler.py</code>
              </p>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Mail size={14} className="text-amber-400" /> News Sources
              </div>
              <p className="text-sm text-slate-500">
                Economic Times (4 feeds) · Moneycontrol (3 feeds) · Yahoo Finance · Google News India — 300+ articles scanned per run across 115 Indian stocks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

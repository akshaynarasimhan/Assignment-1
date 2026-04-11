import { useState, useEffect } from 'react';
import { getSignals } from '../api';
import ScoreBadge from './ScoreBadge';
import CategoryBadge from './CategoryBadge';
import { Zap, RefreshCw } from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SignalsFeed() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getSignals(100);
      setSignals(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'All' ? signals : signals.filter(s => s.relevance_score === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">EP Signals</h2>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} signal{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {['All', 'High', 'Medium', 'Low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === f
                  ? 'bg-amber-500 text-slate-900'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={load}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading && filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">Loading signals...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Zap className="mx-auto mb-3 text-slate-600" size={36} />
          <div className="text-sm">No EP signals found yet.</div>
          <div className="text-xs mt-1 text-slate-600">Run the engine from the Dashboard tab to start detecting signals.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div
              key={s.id}
              className="bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 rounded-xl p-5 transition-all duration-200 hover:bg-slate-800/80"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="font-mono font-black text-amber-400 text-sm pt-0.5 shrink-0 w-14">{s.ticker}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">{s.headline}</p>
                    {s.ai_reasoning && (
                      <p className="text-xs text-slate-500 mt-1.5 italic">"{s.ai_reasoning}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5">
                      <CategoryBadge category={s.signal_category} />
                      {s.source && (
                        <span className="text-xs text-slate-600">{s.source}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <ScoreBadge score={s.relevance_score} />
                  <span className="text-xs text-slate-600">
                    {timeAgo(s.published_at || s.processed_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

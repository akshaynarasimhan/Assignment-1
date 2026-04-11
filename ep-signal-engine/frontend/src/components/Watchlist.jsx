import { useState, useEffect } from 'react';
import { getWatchlist, addTicker, removeTicker } from '../api';
import { Plus, Trash2, RefreshCw, TrendingUp } from 'lucide-react';

export default function Watchlist() {
  const [tickers, setTickers] = useState([]);
  const [newTicker, setNewTicker] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getWatchlist();
      setTickers(data);
    } catch {
      setError('Failed to load watchlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTicker.trim()) return;
    setAdding(true);
    setError('');
    try {
      await addTicker(newTicker.trim().toUpperCase(), newCompany.trim());
      setNewTicker('');
      setNewCompany('');
      await load();
    } catch {
      setError('Failed to add ticker. It may already exist.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (ticker) => {
    try {
      await removeTicker(ticker);
      setTickers(prev => prev.filter(t => t.ticker !== ticker));
    } catch {
      setError('Failed to remove ticker.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Watchlist</h2>
          <p className="text-sm text-slate-500 mt-0.5">{tickers.length} active ticker{tickers.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Add ticker form */}
      <form onSubmit={handleAdd} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
        <div className="text-sm font-semibold text-slate-300 mb-3">Add Ticker</div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ticker (e.g. AAPL)"
            value={newTicker}
            onChange={e => setNewTicker(e.target.value.toUpperCase())}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono uppercase text-sm"
            maxLength={10}
          />
          <input
            type="text"
            placeholder="Company name (optional)"
            value={newCompany}
            onChange={e => setNewCompany(e.target.value)}
            className="flex-[2] bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
          />
          <button
            type="submit"
            disabled={adding || !newTicker.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
      </form>

      {/* Ticker list */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading && tickers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Loading watchlist...</div>
        ) : tickers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="mx-auto mb-3 text-slate-600" size={32} />
            <div>No tickers in watchlist. Add some above.</div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticker</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Added</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {tickers.map((t, i) => (
                <tr key={t.id} className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${i === tickers.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-amber-400 text-sm">{t.ticker}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">{t.company_name || '—'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {t.added_at ? new Date(t.added_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemove(t.ticker)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                      title="Remove ticker"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function StatCard({ label, value, sub, color = 'text-amber-400' }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 flex flex-col gap-1">
      <div className="text-xs text-slate-500 uppercase tracking-widest font-medium">{label}</div>
      <div className={`text-3xl font-black ${color}`}>{value ?? '—'}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

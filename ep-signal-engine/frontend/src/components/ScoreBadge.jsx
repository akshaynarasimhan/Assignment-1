export default function ScoreBadge({ score }) {
  if (!score) return null;
  const styles = {
    High: 'bg-red-900/40 text-red-400 border border-red-500/50',
    Medium: 'bg-amber-900/40 text-amber-400 border border-amber-500/50',
    Low: 'bg-blue-900/40 text-blue-400 border border-blue-500/50',
  };
  const dots = { High: '●', Medium: '●', Low: '●' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[score] || 'bg-slate-700 text-slate-400'}`}>
      <span className="text-[8px]">{dots[score]}</span>
      {score}
    </span>
  );
}

const LABELS = {
  earnings_surprise: 'Earnings Surprise',
  fda_approval: 'FDA Action',
  major_contract: 'Major Contract',
  ceo_change: 'Leadership Change',
  m_and_a: 'M&A',
  regulatory: 'Regulatory',
  clinical_trial: 'Clinical Trial',
  bankruptcy: 'Bankruptcy',
  partnership: 'Partnership',
  noise: 'Noise',
  other: 'Other',
};

const COLORS = {
  earnings_surprise: 'bg-emerald-900/40 text-emerald-400',
  fda_approval: 'bg-purple-900/40 text-purple-400',
  major_contract: 'bg-cyan-900/40 text-cyan-400',
  ceo_change: 'bg-pink-900/40 text-pink-400',
  m_and_a: 'bg-orange-900/40 text-orange-400',
  regulatory: 'bg-red-900/40 text-red-400',
  clinical_trial: 'bg-indigo-900/40 text-indigo-400',
  bankruptcy: 'bg-rose-900/40 text-rose-400',
  partnership: 'bg-teal-900/40 text-teal-400',
  noise: 'bg-slate-700/40 text-slate-500',
  other: 'bg-slate-700/40 text-slate-400',
};

export default function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${COLORS[category] || COLORS.other}`}>
      {LABELS[category] || category}
    </span>
  );
}

import React from 'react';
import useAppStore from '../store/useAppStore';

function DeltaChip({ value, unit = '', inverse = false }) {
  if (value === 0 || value === undefined) return null;
  const positive = inverse ? value < 0 : value > 0;
  const color = positive ? 'var(--success)' : 'var(--danger)';
  const bg = positive ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)';
  const border = positive ? 'rgba(63,185,80,0.25)' : 'rgba(248,81,73,0.25)';
  const prefix = value > 0 ? '+' : '';
  return (
    <span style={{
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 4, padding: '1px 6px', fontSize: 11,
      fontFamily: 'var(--mono)', fontWeight: 700,
    }}>
      {prefix}{value}{unit}
    </span>
  );
}

function MetricCard({ label, baseVal, simVal, unit = '', inverse = false }) {
  const delta = simVal - baseVal;
  const changed = delta !== 0;
  return (
    <div style={{
      background: changed ? 'rgba(0,115,171,0.06)' : 'var(--surface3)',
      border: `1px solid ${changed ? 'rgba(0,115,171,0.25)' : 'var(--border)'}`,
      borderRadius: 6, padding: '8px 12px', minWidth: 110,
      transition: 'all 0.3s',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: changed ? 'var(--accent2)' : 'var(--text)' }}>
          {simVal}{unit}
        </span>
        {changed && <DeltaChip value={delta} unit={unit} inverse={inverse} />}
      </div>
      {changed && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          was {baseVal}{unit}
        </div>
      )}
    </div>
  );
}

export default function LiveDeltaBar() {
  const pendingChanges = useAppStore((s) => s.pendingChanges);
  const baseAEData = useAppStore((s) => s.baseAEData);
  const simulatedAEData = useAppStore((s) => s.simulatedAEData);
  const commitSimulation = useAppStore((s) => s.commitSimulation);
  const resetSimulation = useAppStore((s) => s.resetSimulation);
  const addChatMessage = useAppStore((s) => s.addChatMessage);

  if (pendingChanges.length === 0) return null;

  // Aggregate totals
  const totalBaseCV = baseAEData.reduce((s, ae) => s + ae.cv, 0);
  const totalSimCV = simulatedAEData.reduce((s, ae) => s + ae.cv, 0);
  const totalBaseCap = baseAEData.reduce((s, ae) => s + ae.availableCapacity, 0);
  const totalSimCap = simulatedAEData.reduce((s, ae) => s + ae.availableCapacity, 0);
  const overloadedBase = baseAEData.filter((ae) => ae.pctTargetFromSizeAchieved > 80).length;
  const overloadedSim = simulatedAEData.filter((ae) => ae.pctTargetFromSizeAchieved > 80).length;

  function handleCommit() {
    const count = pendingChanges.length;
    const cvChange = totalSimCV - totalBaseCV;
    commitSimulation();
    addChatMessage({
      role: 'assistant',
      text: `✓ ${count} assignment(s) committed. Territory baseline updated.\nCV change: ${cvChange >= 0 ? '+' : ''}${cvChange.toLocaleString()}  ·  Free capacity: ${totalSimCap > totalBaseCap ? '+' : ''}${totalSimCap - totalBaseCap}  ·  Overloaded AEs: ${overloadedSim} (was ${overloadedBase}).\nStep 3 grid now shows the committed state as the new baseline.`,
      tag: 'hybrid',
    });
  }

  function handleReset() {
    resetSimulation();
    addChatMessage({
      role: 'assistant',
      text: `Simulation reset. All ${pendingChanges.length} pending change(s) discarded. Territory restored to baseline.`,
      tag: 'rule',
    });
  }

  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid rgba(0,115,171,0.35)',
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 16,
      animation: 'slideIn 0.25s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: 'rgba(0,115,171,0.15)', color: 'var(--accent2)',
            border: '1px solid rgba(0,115,171,0.3)', borderRadius: 4,
            padding: '2px 8px', fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700,
          }}>
            LIVE SIMULATION
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {pendingChanges.length} pending assignment{pendingChanges.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleReset}
            style={{
              fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface3)',
              border: '1px solid var(--border)', borderRadius: 5,
              padding: '5px 12px', cursor: 'pointer',
            }}
          >
            ✕ Reset
          </button>
          <button
            onClick={handleCommit}
            style={{
              fontSize: 12, fontWeight: 600, color: 'white',
              background: 'var(--gartner)', border: 'none',
              borderRadius: 5, padding: '5px 14px', cursor: 'pointer',
            }}
          >
            ✓ Commit Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <MetricCard label="Total CV" baseVal={totalBaseCV.toLocaleString()} simVal={totalSimCV.toLocaleString()} />
        <MetricCard label="Free Capacity" baseVal={totalBaseCap} simVal={totalSimCap} />
        <MetricCard label="Overloaded AEs" baseVal={overloadedBase} simVal={overloadedSim} inverse={true} />
      </div>

      {pendingChanges.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {pendingChanges.map((c) => (
            <div key={c.accountId} style={{
              fontSize: 11, color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--mono)',
            }}>
              <span style={{ color: 'var(--accent2)' }}>→</span>
              <span style={{ color: 'var(--text)' }}>{c.account?.company ?? c.accountId}</span>
              <span>assigned to</span>
              <span style={{ color: 'var(--accent3)' }}>
                {c.toAEId}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeAlpine } from 'ag-grid-community';
import useAppStore from '../../store/useAppStore';
import { fetchAEData } from '../../services/territoryApi';
import { runRules, buildDatasetSummary } from '../../services/ruleEngine';
import { generateGridSpec } from '../../services/llmService';

// ── Cell renderers ────────────────────────────────────────────────────────

function DeltaBadge({ delta, inverse = false }) {
  if (!delta) return null;
  const positive = inverse ? delta < 0 : delta > 0;
  return (
    <span style={{
      fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700,
      color: positive ? 'var(--success)' : 'var(--danger)',
      background: positive ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)',
      border: `1px solid ${positive ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
      borderRadius: 3, padding: '0 4px', marginLeft: 4,
    }}>
      {delta > 0 ? '+' : ''}{delta}
    </span>
  );
}

function CVRenderer({ value, data }) {
  return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>
      {value?.toLocaleString()}
      <DeltaBadge delta={data?._cvDelta} />
    </span>
  );
}

function CapacityRenderer({ value, data }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {value > 0
        ? <span style={{ background: 'rgba(86,211,100,0.15)', color: '#56d364', border: '1px solid rgba(86,211,100,0.3)', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 600 }}>+{value}</span>
        : <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>0</span>
      }
      <DeltaBadge delta={data?._capDelta} />
    </div>
  );
}

function ProgressRenderer({ value, data }) {
  const clamp = Math.min(Math.max(value ?? 0, 0), 100);
  const color = clamp > 80 ? '#f85149' : clamp > 60 ? '#e3b341' : '#56d364';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      <div style={{ flex: 1, background: 'var(--surface3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${clamp}%`, background: color, height: '100%', borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ color, fontFamily: 'var(--mono)', fontSize: 11, minWidth: 34, textAlign: 'right' }}>{value}%</span>
      <DeltaBadge delta={data?._pctDelta} inverse={true} />
    </div>
  );
}

function AENameRenderer({ value, data }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {data?._isSimulated && (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#79c0ff', display: 'inline-block', flexShrink: 0 }} title="Simulated" />
      )}
      <span>{value}</span>
    </div>
  );
}

const COL_DEFS = [
  { field: 'aeName', headerName: 'AE Name', pinned: 'left', width: 160, cellRenderer: AENameRenderer },
  { field: 'role', headerName: 'Role', width: 180 },
  { field: 'cv', headerName: 'CV', width: 130, cellRenderer: CVRenderer },
  { field: 'targetBookingSize', headerName: 'Target Booking KW', width: 160, type: 'numericColumn', valueFormatter: (p) => p.value?.toLocaleString() },
  { field: 'availableCapacity', headerName: 'Available Capacity', width: 155, cellRenderer: CapacityRenderer },
  {
    field: 'pctTargetFromSizeAchieved', headerName: '% Target Achieved', width: 200,
    cellRenderer: ProgressRenderer,
    cellClassRules: {
      'row-critical': (p) => p.value > 80,
      'row-warning': (p) => p.value > 60 && p.value <= 80,
      'row-good': (p) => p.value <= 60,
    },
  },
  { field: 'proxyBuReview', headerName: 'Proxy BU Review', width: 130, type: 'numericColumn' },
  { field: 'proxyBuReview2', headerName: 'Proxy BU Review 2', width: 135, type: 'numericColumn' },
  { field: 'proxySizeDiscount', headerName: 'Proxy Size Disc.', width: 130, type: 'numericColumn' },
  { field: 'proxyGraded', headerName: 'Proxy Graded', width: 120, type: 'numericColumn' },
];

// ── Component ─────────────────────────────────────────────────────────────

export default function Step3Metrics() {
  const filters = useAppStore((s) => s.filters);
  const manager = useAppStore((s) => s.manager);
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const proceedToNextStep = useAppStore((s) => s.proceedToNextStep);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const setGridSpec = useAppStore((s) => s.setGridSpec);
  const setIsLoading = useAppStore((s) => s.setIsLoading);
  const isLoading = useAppStore((s) => s.isLoading);
  const resetAndLoad = useAppStore((s) => s.resetAndLoad);
  const dataLoaded = useAppStore((s) => s.dataLoaded);
  const simulatedAEData = useAppStore((s) => s.simulatedAEData);
  const pendingChanges = useAppStore((s) => s.pendingChanges);

  const gridRef = useRef(null);

  // Load AE data — only runs once per manager/filter combo.
  // If already loaded (navigated back), skip re-fetch to preserve simulation.
  useEffect(() => {
    if (dataLoaded) return; // simulation is live — don't overwrite
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchAEData({ ...filters, manager });
        resetAndLoad(data);
        const rules = runRules(data, filters);
        const summary = buildDatasetSummary(data, rules);
        const spec = await generateGridSpec(
          'Provide an initial territory overview highlighting capacity and CV risks.',
          rules, summary
        );
        if (spec) {
          setGridSpec(spec);
          addChatMessage({ role: 'assistant', text: spec.narrative, tag: spec.tag });
        }
        const condensedLog = rules.ruleLog.filter((l) => l.startsWith('[RULE') || l.includes('Rule engine'));
        addChatMessage({ role: 'assistant', text: condensedLog.join('\n'), tag: 'rule' });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [filters, manager, dataLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const darkTheme = useMemo(() => themeAlpine.withParams({
    backgroundColor: '#161b22', headerBackgroundColor: '#1c2230',
    oddRowBackgroundColor: '#192130', rowHoverColor: 'rgba(0,115,171,0.12)',
    borderColor: '#30363d', headerTextColor: '#8b949e', textColor: '#e6edf3',
    fontFamily: 'DM Sans, sans-serif', fontSize: 13, chromeBackgroundColor: '#1c2230',
  }), []);

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  const statusBar = useMemo(() => ({
    statusPanels: [
      { statusPanel: 'agTotalRowCountComponent', align: 'left' },
      { statusPanel: 'agAggregationComponent', align: 'right' },
    ],
  }), []);

  const getRowStyle = useCallback((params) => {
    if (params.data?._isSimulated) {
      return { background: 'rgba(0,115,171,0.08)', borderLeft: '3px solid #0073ab' };
    }
    return null;
  }, []);

  const ruleOutput = useMemo(() => {
    if (!simulatedAEData.length) return null;
    return runRules(simulatedAEData, filters);
  }, [simulatedAEData, filters]);

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-badge">Step 3</span>
        <h2 className="step-title">AE Metrics</h2>
        <p className="step-desc">
          Review territory metrics for {manager ?? 'the selected manager'}'s team.
          {pendingChanges.length > 0 && (
            <span style={{ color: '#79c0ff', background: 'rgba(121,192,255,0.1)', border: '1px solid rgba(121,192,255,0.25)', fontSize: 11, padding: '2px 8px', borderRadius: 4, marginLeft: 8 }}>
              ● {pendingChanges.length} simulation{pendingChanges.length !== 1 ? 's' : ''} active
            </span>
          )}
          {ruleOutput?.flags?.cv_breach && (
            <span className="alert-inline alert-inline--danger">
              ⚠ {ruleOutput.flags.breach_pct}% of AEs exceed CV threshold
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Running rule engine analysis…</span>
        </div>
      ) : (
        /* key={simulatedAEData.length + pendingChanges.length} forces full remount
           when simulation changes so AG Grid always shows fresh data */
        <div className="ag-grid-wrap" style={{ height: 380, width: '100%' }}>
          <AgGridReact
            key={`grid-${pendingChanges.length}`}
            ref={gridRef}
            rowData={simulatedAEData}
            columnDefs={COL_DEFS}
            defaultColDef={defaultColDef}
            theme={darkTheme}
            rowHeight={52}
            headerHeight={40}
            animateRows={true}
            statusBar={statusBar}
            getRowStyle={getRowStyle}
            suppressMenuHide={true}
          />
        </div>
      )}

      <div className="mode-section">
        <h3 className="mode-title">Select Rebalancing Mode</h3>
        <div className="mode-options">
          <button
            className={`mode-card ${mode === 'growth' ? 'mode-card--active mode-card--growth' : ''}`}
            onClick={() => setMode('growth')}
          >
            <div className="mode-icon">📈</div>
            <div className="mode-label">Growth</div>
            <div className="mode-desc">Assign new accounts to AEs with available capacity</div>
            {ruleOutput && <div className="mode-count">{ruleOutput.eligibleForGrowth.length} AE(s) eligible</div>}
          </button>
          <button
            className={`mode-card ${mode === 'collapse' ? 'mode-card--active mode-card--collapse' : ''}`}
            onClick={() => setMode('collapse')}
          >
            <div className="mode-icon">🔀</div>
            <div className="mode-label">Collapse</div>
            <div className="mode-desc">Reassign accounts from overloaded AEs to reduce risk</div>
            {ruleOutput && <div className="mode-count">{ruleOutput.eligibleForCollapse.length} AE(s) eligible</div>}
          </button>
        </div>
      </div>

      {mode && (
        <div className="step-footer">
          <div className="selection-summary">
            <span className={`tag-pill ${mode === 'growth' ? 'tag-pill--success' : 'tag-pill--warning'}`}>
              {mode === 'growth' ? 'Growth' : 'Collapse'}
            </span>
            <span className="summary-text">mode selected</span>
          </div>
          <button className="btn-primary" onClick={proceedToNextStep}>
            Proceed to Step 4 →
          </button>
        </div>
      )}
    </div>
  );
}

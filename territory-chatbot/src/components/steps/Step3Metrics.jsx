import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeAlpine } from 'ag-grid-community';
import useAppStore from '../../store/useAppStore';
import { fetchAEData } from '../../services/territoryApi';
import { runRules, buildDatasetSummary } from '../../services/ruleEngine';
import { generateGridSpec } from '../../services/llmService';

function CapacityRenderer({ value }) {
  if (value > 0) {
    return (
      <span style={{
        background: 'rgba(86, 211, 100, 0.15)',
        color: '#56d364',
        border: '1px solid rgba(86,211,100,0.3)',
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 12,
        fontFamily: 'var(--mono)',
        fontWeight: 600,
      }}>
        +{value}
      </span>
    );
  }
  return (
    <span style={{
      color: 'var(--text-muted)',
      fontFamily: 'var(--mono)',
      fontSize: 12,
    }}>
      0
    </span>
  );
}

function ProgressRenderer({ value }) {
  const clamp = Math.min(Math.max(value, 0), 100);
  let color = '#56d364';
  if (clamp > 80) color = '#f85149';
  else if (clamp > 60) color = '#e3b341';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{
        flex: 1,
        background: 'var(--surface3)',
        borderRadius: 4,
        height: 6,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${clamp}%`,
          background: color,
          height: '100%',
          borderRadius: 4,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        color,
        fontFamily: 'var(--mono)',
        fontSize: 11,
        minWidth: 36,
        textAlign: 'right',
      }}>
        {value}%
      </span>
    </div>
  );
}

const DEFAULT_COL_DEFS = [
  { field: 'aeName', headerName: 'AE Name', pinned: 'left', width: 160 },
  { field: 'role', headerName: 'Role', width: 180 },
  {
    field: 'cv',
    headerName: 'CV',
    width: 100,
    type: 'numericColumn',
    valueFormatter: (p) => p.value?.toLocaleString() ?? '',
  },
  {
    field: 'targetBookingSize',
    headerName: 'Target Booking Size KW',
    width: 160,
    type: 'numericColumn',
    valueFormatter: (p) => p.value?.toLocaleString() ?? '',
  },
  {
    field: 'availableCapacity',
    headerName: 'Available Capacity',
    width: 140,
    cellRenderer: CapacityRenderer,
  },
  {
    field: 'pctTargetFromSizeAchieved',
    headerName: '% Target from Size Achieved',
    width: 180,
    cellRenderer: ProgressRenderer,
    cellClassRules: {
      'row-critical': (p) => p.value > 80,
      'row-warning': (p) => p.value > 60 && p.value <= 80,
      'row-good': (p) => p.value <= 60,
    },
  },
  { field: 'proxyBuReview', headerName: 'Proxy Bu Review', width: 130, type: 'numericColumn' },
  { field: 'proxyBuReview2', headerName: 'Proxy Bu Review 2', width: 130, type: 'numericColumn' },
  { field: 'proxySizeDiscount', headerName: 'Proxy Size Discount', width: 140, type: 'numericColumn' },
  { field: 'proxyGraded', headerName: 'Proxy Graded', width: 120, type: 'numericColumn' },
];

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

  const gridRef = useRef(null);
  const [rowData, setRowData] = useState([]);
  const [ruleOutput, setRuleOutput] = useState(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchAEData({ ...filters, manager });
        setRowData(data);
        const rules = runRules(data, filters);
        setRuleOutput(rules);

        // Auto-run initial LLM analysis
        const summary = buildDatasetSummary(data, rules);
        const spec = await generateGridSpec(
          'Provide an initial territory overview highlighting capacity and CV risks.',
          rules,
          summary
        );

        if (spec) {
          setGridSpec(spec);
          addChatMessage({
            role: 'assistant',
            text: spec.narrative,
            tag: spec.tag,
          });
        }

        // Post rule log as chat messages
        const condensedLog = rules.ruleLog.filter((l) =>
          l.startsWith('[RULE') || l.includes('Rule engine')
        );
        addChatMessage({
          role: 'assistant',
          text: condensedLog.join('\n'),
          tag: 'rule',
        });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [filters, manager]); // eslint-disable-line react-hooks/exhaustive-deps

  const defaultColDef = useMemo(
    () => ({ sortable: true, filter: true, resizable: true }),
    []
  );

  const statusBar = useMemo(
    () => ({
      statusPanels: [
        { statusPanel: 'agTotalRowCountComponent', align: 'left' },
        { statusPanel: 'agAggregationComponent', align: 'right' },
      ],
    }),
    []
  );

  const darkTheme = useMemo(
    () =>
      themeAlpine.withParams({
        backgroundColor: '#161b22',
        headerBackgroundColor: '#1c2230',
        oddRowBackgroundColor: '#192130',
        rowHoverColor: 'rgba(0,115,171,0.12)',
        selectedRowBackgroundColor: 'rgba(0,115,171,0.2)',
        borderColor: '#30363d',
        headerTextColor: '#8b949e',
        textColor: '#e6edf3',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 13,
        spacing: 8,
        inputFocusBorder: { color: '#0073ab' },
        rangeSelectionBorderColor: '#0073ab',
        chromeBackgroundColor: '#1c2230',
      }),
    []
  );

  const onGridReady = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-badge">Step 3</span>
        <h2 className="step-title">AE Metrics</h2>
        <p className="step-desc">
          Review territory metrics for {manager ?? 'the selected manager'}'s team.
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
        <div className="ag-grid-wrap" style={{ height: 380, width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={DEFAULT_COL_DEFS}
            defaultColDef={defaultColDef}
            theme={darkTheme}
            rowHeight={52}
            headerHeight={40}
            animateRows={true}
            statusBar={statusBar}
            onGridReady={onGridReady}
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
            <div className="mode-desc">
              Assign new accounts to AEs with available capacity
            </div>
            {ruleOutput && (
              <div className="mode-count">
                {ruleOutput.eligibleForGrowth.length} AE(s) eligible
              </div>
            )}
          </button>
          <button
            className={`mode-card ${mode === 'collapse' ? 'mode-card--active mode-card--collapse' : ''}`}
            onClick={() => setMode('collapse')}
          >
            <div className="mode-icon">🔀</div>
            <div className="mode-label">Collapse</div>
            <div className="mode-desc">
              Reassign accounts from overloaded AEs to reduce risk
            </div>
            {ruleOutput && (
              <div className="mode-count">
                {ruleOutput.eligibleForCollapse.length} AE(s) eligible
              </div>
            )}
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

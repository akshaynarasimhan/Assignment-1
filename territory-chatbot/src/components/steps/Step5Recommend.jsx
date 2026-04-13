import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeAlpine } from 'ag-grid-community';
import useAppStore from '../../store/useAppStore';
import { fetchRebalanceAccounts } from '../../services/territoryApi';
import { MOCK_AE_DATA } from '../../constants/mockData';

function SegmentBadge({ value }) {
  const colors = {
    Enterprise: { bg: 'rgba(121,192,255,0.12)', color: '#79c0ff', border: 'rgba(121,192,255,0.3)' },
    'Large Enterprise': { bg: 'rgba(247,129,102,0.12)', color: '#f78166', border: 'rgba(247,129,102,0.3)' },
    Commercial: { bg: 'rgba(86,211,100,0.12)', color: '#56d364', border: 'rgba(86,211,100,0.3)' },
    SMB: { bg: 'rgba(227,179,65,0.12)', color: '#e3b341', border: 'rgba(227,179,65,0.3)' },
  };
  const style = colors[value] ?? { bg: 'rgba(139,148,158,0.12)', color: '#8b949e', border: 'rgba(139,148,158,0.3)' };
  return (
    <span style={{
      background: style.bg,
      color: style.color,
      border: `1px solid ${style.border}`,
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.02em',
    }}>
      {value}
    </span>
  );
}

const COLUMN_DEFS = [
  { field: 'aeName', headerName: 'AE Name', width: 130, pinned: 'left' },
  { field: 'company', headerName: 'Company', width: 260 },
  {
    field: 'cv',
    headerName: 'CV',
    width: 120,
    type: 'numericColumn',
    valueFormatter: (p) => `$${(p.value ?? 0).toLocaleString()}`,
  },
  { field: 'sinceDate', headerName: 'Since Date', width: 110 },
  { field: 'country', headerName: 'Country', width: 120 },
  { field: 'state', headerName: 'State', width: 100 },
  { field: 'industry', headerName: 'Industry', width: 140 },
  { field: 'segment', headerName: 'Segment', width: 110, cellRenderer: SegmentBadge },
  { field: 'sizeM', headerName: 'Size M', width: 90, type: 'numericColumn', valueFormatter: (p) => `${p.value}M` },
  {
    field: 'proxyPremiumNotes',
    headerName: 'Proxy / Premium Notes',
    flex: 1,
    tooltipField: 'proxyPremiumNotes',
    cellStyle: { color: 'var(--text-muted)', fontSize: 12 },
  },
];

export default function Step5Recommend() {
  const selectedAE = useAppStore((s) => s.selectedAE);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const mode = useAppStore((s) => s.mode);

  const gridRef = useRef(null);
  const [rowData, setRowData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [actionDone, setActionDone] = useState(null);

  const selectedAEData = useMemo(
    () => MOCK_AE_DATA.find((ae) => ae.id === selectedAE),
    [selectedAE]
  );

  useEffect(() => {
    fetchRebalanceAccounts(selectedAE).then(setRowData);
  }, [selectedAE]);

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
        chromeBackgroundColor: '#1c2230',
      }),
    []
  );

  const defaultColDef = useMemo(
    () => ({ sortable: true, filter: true, resizable: true }),
    []
  );

  const onRowClicked = useCallback(
    (params) => {
      setSelectedRow(params.data);
      addChatMessage({
        role: 'assistant',
        text: `Account selected: **${params.data.company}** (${params.data.segment}, $${params.data.cv.toLocaleString()} CV)\n${params.data.proxyPremiumNotes}`,
        tag: 'rule',
      });
    },
    [addChatMessage]
  );

  const handleAction = (action) => {
    setActionDone(action);
    const msgs = {
      proceed: `Rebalancing approved. ${selectedAEData?.aeName ?? 'AE'}'s territory updated in the system.`,
      customise: `Custom rebalancing initiated for ${selectedAEData?.aeName ?? 'AE'}. Opening configuration panel…`,
    };
    addChatMessage({ role: 'assistant', text: msgs[action] ?? '', tag: 'hybrid' });
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-badge">Step 5</span>
        <h2 className="step-title">Recommendations</h2>
        <p className="step-desc">
          {mode === 'growth'
            ? `Accounts recommended for assignment to ${selectedAEData?.aeName ?? 'the selected AE'}.`
            : `Accounts recommended for redistribution from ${selectedAEData?.aeName ?? 'the selected AE'}.`}
        </p>
      </div>

      {selectedAEData && (
        <div className="ae-summary-card">
          <div className="ae-summary-avatar">
            {selectedAEData.aeName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="ae-summary-info">
            <span className="ae-summary-name">{selectedAEData.aeName}</span>
            <span className="ae-summary-role">{selectedAEData.role}</span>
          </div>
          <div className="ae-summary-stats">
            <div className="ae-stat">
              <span className="ae-stat-label">CV</span>
              <span className="ae-stat-value">{selectedAEData.cv.toLocaleString()}</span>
            </div>
            <div className="ae-stat">
              <span className="ae-stat-label">Capacity</span>
              <span className="ae-stat-value" style={{ color: selectedAEData.availableCapacity > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                {selectedAEData.availableCapacity > 0 ? `+${selectedAEData.availableCapacity}` : '0'}
              </span>
            </div>
            <div className="ae-stat">
              <span className="ae-stat-label">Proxy</span>
              <span className="ae-stat-value">{selectedAEData.proxyGraded}</span>
            </div>
          </div>
        </div>
      )}

      <div className="ag-grid-wrap" style={{ height: 320, width: '100%', marginBottom: 16 }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={COLUMN_DEFS}
          defaultColDef={defaultColDef}
          theme={darkTheme}
          rowHeight={48}
          tooltipShowDelay={300}
          onRowClicked={onRowClicked}
          rowClass="clickable-row"
          animateRows={true}
        />
      </div>

      {selectedRow && (
        <div className="detail-panel">
          <div className="detail-panel-header">
            <span className="detail-company">{selectedRow.company}</span>
            <span className="tag-pill tag-pill--llm">{selectedRow.segment}</span>
          </div>
          <div className="detail-body">
            <div className="detail-field">
              <span className="detail-label">Notes</span>
              <span className="detail-value">{selectedRow.proxyPremiumNotes}</span>
            </div>
            {selectedRow.history && (
              <div className="detail-field">
                <span className="detail-label">History</span>
                <div className="history-list">
                  {selectedRow.history.map((h) => (
                    <div key={h.year} className="history-row">
                      <span className="history-year">{h.year}</span>
                      <span className="history-cv">${h.cv.toLocaleString()}</span>
                      <span className="history-note">{h.notes}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {actionDone ? (
        <div className="action-done">
          <span className="tag-pill tag-pill--success">✓ {actionDone === 'proceed' ? 'Approved' : 'Customising'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Action recorded. Continue in chat panel for further analysis.
          </span>
        </div>
      ) : (
        <div className="action-bar">
          <button className="btn-primary" onClick={() => handleAction('proceed')}>
            ✓ Proceed
          </button>
          <button className="btn-secondary" onClick={() => handleAction('customise')}>
            ✎ Customise
          </button>
          <button
            className="btn-ghost"
            onClick={() =>
              addChatMessage({ role: 'user', text: 'What are the risks of this rebalancing?', tag: 'llm' })
            }
          >
            💬 Discuss in Chat
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { themeAlpine } from 'ag-grid-community';
import useAppStore from '../../store/useAppStore';
import { fetchRebalanceAccounts } from '../../services/territoryApi';
import { MOCK_AE_DATA } from '../../constants/mockData';
import LiveDeltaBar from '../LiveDeltaBar';

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
      background: style.bg, color: style.color, border: `1px solid ${style.border}`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600,
    }}>{value}</span>
  );
}

function AssignedBadge({ assignedTo }) {
  if (!assignedTo) return null;
  return (
    <span style={{
      background: 'rgba(86,211,100,0.12)', color: '#56d364',
      border: '1px solid rgba(86,211,100,0.3)', borderRadius: 4,
      padding: '1px 6px', fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 700,
    }}>✓ ASSIGNED</span>
  );
}

export default function Step5Recommend() {
  const selectedAE = useAppStore((s) => s.selectedAE);
  const simulatedAEData = useAppStore((s) => s.simulatedAEData);
  const assignments = useAppStore((s) => s.assignments);
  const assignAccount = useAppStore((s) => s.assignAccount);
  const unassignAccount = useAppStore((s) => s.unassignAccount);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const mode = useAppStore((s) => s.mode);

  const gridRef = useRef(null);
  const [allAccounts, setAllAccounts] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const selectedAEData = useMemo(
    () => simulatedAEData.find((ae) => ae.id === selectedAE) ?? MOCK_AE_DATA.find((ae) => ae.id === selectedAE),
    [simulatedAEData, selectedAE]
  );

  // Load all accounts (not just for this AE — user can assign any account)
  useEffect(() => {
    fetchRebalanceAccounts(null).then(setAllAccounts);
  }, []);

  const darkTheme = useMemo(() => themeAlpine.withParams({
    backgroundColor: '#161b22', headerBackgroundColor: '#1c2230',
    oddRowBackgroundColor: '#192130', rowHoverColor: 'rgba(0,115,171,0.12)',
    selectedRowBackgroundColor: 'rgba(0,115,171,0.2)',
    borderColor: '#30363d', headerTextColor: '#8b949e', textColor: '#e6edf3',
    fontFamily: 'DM Sans, sans-serif', fontSize: 13, chromeBackgroundColor: '#1c2230',
  }), []);

  const columnDefs = useMemo(() => [
    {
      field: 'assigned', headerName: '', width: 80, sortable: false, filter: false,
      cellRenderer: ({ data }) => <AssignedBadge assignedTo={assignments[data.id]} />,
    },
    { field: 'aeName', headerName: 'Current AE', width: 130, pinned: 'left' },
    { field: 'company', headerName: 'Company', width: 240 },
    { field: 'cv', headerName: 'CV', width: 110, type: 'numericColumn', valueFormatter: (p) => `$${(p.value ?? 0).toLocaleString()}` },
    { field: 'sinceDate', headerName: 'Since', width: 90 },
    { field: 'country', headerName: 'Country', width: 100 },
    { field: 'state', headerName: 'State', width: 90 },
    { field: 'industry', headerName: 'Industry', width: 130 },
    { field: 'segment', headerName: 'Segment', width: 120, cellRenderer: SegmentBadge },
    { field: 'sizeM', headerName: 'Size M', width: 80, type: 'numericColumn', valueFormatter: (p) => `${p.value}M` },
    { field: 'proxyPremiumNotes', headerName: 'Notes', flex: 1, tooltipField: 'proxyPremiumNotes', cellStyle: { color: 'var(--text-muted)', fontSize: 12 } },
  ], [assignments]);

  const defaultColDef = useMemo(() => ({ sortable: true, filter: true, resizable: true }), []);

  const getRowStyle = useCallback((params) => {
    if (assignments[params.data?.id]) {
      return { background: 'rgba(86,211,100,0.06)', borderLeft: '3px solid rgba(86,211,100,0.4)' };
    }
    return null;
  }, [assignments]);

  const onRowClicked = useCallback((params) => {
    setSelectedRow(params.data);
    addChatMessage({
      role: 'assistant',
      text: `Account selected: **${params.data.company}** (${params.data.segment}, $${params.data.cv.toLocaleString()} CV)\n${params.data.proxyPremiumNotes}`,
      tag: 'rule',
    });
  }, [addChatMessage]);

  function handleAssign(account) {
    if (!selectedAE) return;
    assignAccount(account, selectedAE);
    addChatMessage({
      role: 'assistant',
      text: `**${account.company}** assigned to **${selectedAEData?.aeName ?? selectedAE}**. Metrics updated live in Step 3 grid.`,
      tag: 'hybrid',
    });
  }

  function handleUnassign(account) {
    unassignAccount(account.id);
    addChatMessage({
      role: 'assistant',
      text: `Assignment of **${account.company}** reversed. Metrics restored.`,
      tag: 'rule',
    });
  }

  return (
    <div className="step-container">
      <div className="step-header">
        <span className="step-badge">Step 5</span>
        <h2 className="step-title">Account Assignments</h2>
        <p className="step-desc">
          Click any account row to preview it, then assign it to the selected AE.
          Metrics update live in the Step 3 grid.
        </p>
      </div>

      {/* Live delta bar — appears as soon as any assignment is made */}
      <LiveDeltaBar />

      {/* Selected AE summary */}
      {selectedAEData && (
        <div className="ae-summary-card" style={{ marginBottom: 14 }}>
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
              <span className="ae-stat-value" style={{ color: selectedAEData._cvDelta ? 'var(--accent2)' : 'var(--text)' }}>
                {selectedAEData.cv?.toLocaleString()}
                {selectedAEData._cvDelta ? <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 4 }}>+{selectedAEData._cvDelta}</span> : null}
              </span>
            </div>
            <div className="ae-stat">
              <span className="ae-stat-label">Capacity</span>
              <span className="ae-stat-value" style={{ color: selectedAEData.availableCapacity > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {selectedAEData.availableCapacity > 0 ? `+${selectedAEData.availableCapacity}` : '0'}
              </span>
            </div>
            <div className="ae-stat">
              <span className="ae-stat-label">% Target</span>
              <span className="ae-stat-value" style={{ color: selectedAEData.pctTargetFromSizeAchieved > 80 ? 'var(--danger)' : selectedAEData.pctTargetFromSizeAchieved > 60 ? 'var(--warning)' : 'var(--success)' }}>
                {selectedAEData.pctTargetFromSizeAchieved}%
              </span>
            </div>
            <div className="ae-stat">
              <span className="ae-stat-label">Proxy</span>
              <span className="ae-stat-value">{selectedAEData.proxyGraded}</span>
            </div>
          </div>
        </div>
      )}

      {/* Account grid */}
      <div className="ag-grid-wrap" style={{ height: 280, width: '100%', marginBottom: 14 }}>
        <AgGridReact
          ref={gridRef}
          rowData={allAccounts}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          theme={darkTheme}
          rowHeight={48}
          tooltipShowDelay={300}
          onRowClicked={onRowClicked}
          animateRows={true}
          getRowStyle={getRowStyle}
          rowClass="clickable-row"
        />
      </div>

      {/* Account action panel */}
      {selectedRow && (
        <div className="detail-panel" style={{ marginBottom: 14 }}>
          <div className="detail-panel-header">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="detail-company">{selectedRow.company}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {selectedRow.industry} · {selectedRow.country} · ${selectedRow.cv.toLocaleString()} CV
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <SegmentBadge value={selectedRow.segment} />
              {assignments[selectedRow.id] ? (
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: '5px 12px' }}
                  onClick={() => handleUnassign(selectedRow)}
                >
                  ✕ Remove Assignment
                </button>
              ) : (
                <button
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '5px 14px' }}
                  onClick={() => handleAssign(selectedRow)}
                  disabled={!selectedAE}
                >
                  + Assign to {selectedAEData?.aeName?.split(' ')[0] ?? 'AE'}
                </button>
              )}
            </div>
          </div>
          <div className="detail-body" style={{ marginTop: 10 }}>
            <div className="detail-field">
              <span className="detail-label">Notes</span>
              <span className="detail-value">{selectedRow.proxyPremiumNotes}</span>
            </div>
            {selectedRow.history && (
              <div className="detail-field" style={{ marginTop: 8 }}>
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

      {/* Mode-based action hint */}
      <div style={{
        padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>{mode === 'growth' ? '📈' : '🔀'}</span>
        <span>
          {mode === 'growth'
            ? 'Growth mode: click an account row then use the Assign button to add it to the selected AE. Capacity and CV update instantly.'
            : 'Collapse mode: click an account row to review it, then assign to redistribute from the overloaded AE.'}
          {' '}You can also <strong style={{ color: 'var(--text)' }}>type in the chat panel</strong> to assign accounts via natural language.
        </span>
      </div>
    </div>
  );
}

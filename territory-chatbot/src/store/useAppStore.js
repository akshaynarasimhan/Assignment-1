import { create } from 'zustand';
import { MOCK_AE_DATA, REBALANCE_ACCOUNTS } from '../constants/mockData';

const useAppStore = create((set, get) => ({
  // ── Workflow ──────────────────────────────────────────────────────────────
  step: 1,
  filters: null,
  manager: null,
  mode: null,
  selectedAE: null,

  // ── Chat ──────────────────────────────────────────────────────────────────
  chatHistory: [],
  isLoading: false,
  gridSpec: null,

  // ── Simulation ────────────────────────────────────────────────────────────
  // baseAEData  : snapshot loaded once at Step 3 — NEVER overwritten after initial load
  // simulatedAEData: live copy recalculated on every assignment change
  baseAEData: [],
  simulatedAEData: [],
  assignments: {},        // { [accountId]: aeId }
  pendingChanges: [],     // audit log
  dataLoaded: false,      // guard: prevents re-fetch from resetting simulation

  // Full-roster references for cross-team LLM matching
  allAEData: MOCK_AE_DATA,
  allAccounts: REBALANCE_ACCOUNTS,

  // ── Setters ───────────────────────────────────────────────────────────────
  setStep: (step) => set({ step }),
  setFilters: (filters) => set({ filters }),
  setManager: (manager) => set({ manager }),
  setMode: (mode) => set({ mode }),
  setSelectedAE: (selectedAE) => set({ selectedAE }),
  setGridSpec: (gridSpec) => set({ gridSpec }),
  setIsLoading: (isLoading) => set({ isLoading }),

  // Only set base data if not already loaded for this manager/filter combo.
  // This prevents navigating back to Step 3 from blowing away the simulation.
  setBaseAEData: (data, force = false) => {
    const { dataLoaded } = get();
    if (dataLoaded && !force) return; // guard — don't overwrite during active session
    set({ baseAEData: data, simulatedAEData: [...data], dataLoaded: true });
  },

  // Call this when filters/manager change (new workflow run)
  resetAndLoad: (data) => {
    set({
      baseAEData: data,
      simulatedAEData: [...data],
      assignments: {},
      pendingChanges: [],
      dataLoaded: true,
    });
  },

  // ── Assignment actions ────────────────────────────────────────────────────
  assignAccount: (account, toAEId) => {
    const { assignments, baseAEData, pendingChanges } = get();
    const fromAEId = assignments[account.id] ?? null;

    const newAssignments = { ...assignments, [account.id]: toAEId };
    const newSimulated = recalculate(baseAEData, newAssignments);

    const existing = pendingChanges.findIndex((c) => c.accountId === account.id);
    const newChanges = [...pendingChanges];
    const entry = { accountId: account.id, fromAEId, toAEId, account };
    if (existing >= 0) newChanges[existing] = entry;
    else newChanges.push(entry);

    set({ assignments: newAssignments, simulatedAEData: newSimulated, pendingChanges: newChanges });
  },

  unassignAccount: (accountId) => {
    const { assignments, baseAEData, pendingChanges } = get();
    const newAssignments = { ...assignments };
    delete newAssignments[accountId];
    const newSimulated = recalculate(baseAEData, newAssignments);
    set({
      assignments: newAssignments,
      simulatedAEData: newSimulated,
      pendingChanges: pendingChanges.filter((c) => c.accountId !== accountId),
    });
  },

  // Commit: the simulated state becomes the new baseline
  commitSimulation: () => {
    const { simulatedAEData } = get();
    // Strip simulation delta markers from committed rows
    const committed = simulatedAEData.map(({ _isSimulated, _cvDelta, _capDelta, _pctDelta, ...ae }) => ae);
    set({ baseAEData: committed, simulatedAEData: committed, pendingChanges: [], assignments: {} });
  },

  resetSimulation: () => {
    const { baseAEData } = get();
    set({ simulatedAEData: [...baseAEData], assignments: {}, pendingChanges: [] });
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
  addChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  clearChatHistory: () => set({ chatHistory: [] }),

  proceedToNextStep: () => {
    const { step } = get();
    if (step < 5) set({ step: step + 1 });
  },

  reset: () => set({
    step: 1, filters: null, manager: null, mode: null, selectedAE: null,
    chatHistory: [], gridSpec: null, isLoading: false,
    baseAEData: [], simulatedAEData: [], assignments: {}, pendingChanges: [], dataLoaded: false,
  }),
}));

// ── Simulation engine ─────────────────────────────────────────────────────
// Transfers CV from original AE to destination AE for every assignment.
function recalculate(baseAEData, assignments) {
  const cvDeltas = {};
  const capDeltas = {};

  Object.entries(assignments).forEach(([accountId, toAEId]) => {
    const account = REBALANCE_ACCOUNTS.find((a) => a.id === accountId);
    const cvValue = account ? Math.round(account.cv / 1000) : 200;

    // Deduct from original owner
    const fromAE = MOCK_AE_DATA.find((ae) => ae.aeName === account?.aeName);
    if (fromAE && fromAE.id !== toAEId) {
      cvDeltas[fromAE.id] = (cvDeltas[fromAE.id] ?? 0) - cvValue;
      capDeltas[fromAE.id] = (capDeltas[fromAE.id] ?? 0) + 1;
    }

    // Add to destination
    cvDeltas[toAEId] = (cvDeltas[toAEId] ?? 0) + cvValue;
    capDeltas[toAEId] = (capDeltas[toAEId] ?? 0) - 1;
  });

  return baseAEData.map((ae) => {
    const cvDelta = cvDeltas[ae.id] ?? 0;
    const capDelta = capDeltas[ae.id] ?? 0;
    const newCV = Math.max(0, ae.cv + cvDelta);
    const newCap = Math.max(0, ae.availableCapacity + capDelta);
    const origPct = ae.targetBookingSize > 0
      ? Math.round((ae.cv / ae.targetBookingSize) * 100) : ae.pctTargetFromSizeAchieved;
    const newPct = ae.targetBookingSize > 0
      ? Math.min(100, Math.round((newCV / ae.targetBookingSize) * 100)) : origPct;

    return {
      ...ae,
      cv: newCV,
      availableCapacity: newCap,
      pctTargetFromSizeAchieved: newPct,
      _isSimulated: cvDelta !== 0 || capDelta !== 0,
      _cvDelta: cvDelta,
      _capDelta: capDelta,
      _pctDelta: newPct - origPct,
    };
  });
}

export default useAppStore;

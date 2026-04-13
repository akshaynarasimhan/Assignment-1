import { create } from 'zustand';
import { MOCK_AE_DATA, REBALANCE_ACCOUNTS } from '../constants/mockData';

const useAppStore = create((set, get) => ({
  // ── Workflow state ───────────────────────────────────────────────────────
  step: 1,
  filters: null,
  manager: null,
  mode: null,
  selectedAE: null,

  // ── Chat ─────────────────────────────────────────────────────────────────
  chatHistory: [],
  isLoading: false,

  // ── Grid spec from LLM ───────────────────────────────────────────────────
  gridSpec: null,

  // ── Simulation state ─────────────────────────────────────────────────────
  assignments: {},           // { [accountId]: aeId }
  baseAEData: [],            // filtered AE team loaded at Step 3
  simulatedAEData: [],       // recalculated on every assignment
  allAEData: MOCK_AE_DATA,   // full 120-rep roster — used for cross-team assignments
  allAccounts: REBALANCE_ACCOUNTS, // all accounts — used by LLM matcher
  pendingChanges: [],

  // ── Setters ──────────────────────────────────────────────────────────────
  setStep: (step) => set({ step }),
  setFilters: (filters) => set({ filters }),
  setManager: (manager) => set({ manager }),
  setMode: (mode) => set({ mode }),
  setSelectedAE: (selectedAE) => set({ selectedAE }),
  setGridSpec: (gridSpec) => set({ gridSpec }),
  setIsLoading: (isLoading) => set({ isLoading }),

  setBaseAEData: (data) =>
    set({ baseAEData: data, simulatedAEData: [...data] }),

  // ── Assignment actions ────────────────────────────────────────────────────
  assignAccount: (account, toAEId) => {
    const { assignments, baseAEData, pendingChanges } = get();
    const fromAEId = assignments[account.id] ?? null;
    if (fromAEId === toAEId) return;

    const newAssignments = { ...assignments, [account.id]: toAEId };
    const newSimulated = recalculate(baseAEData, newAssignments);

    const existing = pendingChanges.findIndex((c) => c.accountId === account.id);
    let newChanges = [...pendingChanges];
    if (existing >= 0) {
      newChanges[existing] = { accountId: account.id, fromAEId, toAEId, account };
    } else {
      newChanges.push({ accountId: account.id, fromAEId, toAEId, account });
    }

    set({ assignments: newAssignments, simulatedAEData: newSimulated, pendingChanges: newChanges });
  },

  unassignAccount: (accountId) => {
    const { assignments, baseAEData } = get();
    const newAssignments = { ...assignments };
    delete newAssignments[accountId];
    const newSimulated = recalculate(baseAEData, newAssignments);
    set({
      assignments: newAssignments,
      simulatedAEData: newSimulated,
      pendingChanges: get().pendingChanges.filter((c) => c.accountId !== accountId),
    });
  },

  commitSimulation: () => {
    const { simulatedAEData } = get();
    set({ baseAEData: simulatedAEData, pendingChanges: [], assignments: {} });
  },

  resetSimulation: () => {
    const { baseAEData } = get();
    set({ simulatedAEData: baseAEData, assignments: {}, pendingChanges: [] });
  },

  // ── Chat ─────────────────────────────────────────────────────────────────
  addChatMessage: (message) =>
    set((state) => ({ chatHistory: [...state.chatHistory, message] })),
  clearChatHistory: () => set({ chatHistory: [] }),

  proceedToNextStep: () => {
    const { step } = get();
    if (step < 5) set({ step: step + 1 });
  },

  reset: () =>
    set({
      step: 1, filters: null, manager: null, mode: null, selectedAE: null,
      chatHistory: [], gridSpec: null, isLoading: false,
      assignments: {}, baseAEData: [], simulatedAEData: [], pendingChanges: [],
    }),
}));

// ── Simulation engine (pure function) ─────────────────────────────────────
// Moves account CV from original AE owner to destination AE.
// Works across the FULL roster, not just the filtered team.
function recalculate(baseAEData, assignments) {
  const cvDeltas = {};      // { aeId: deltaCV }
  const capDeltas = {};     // { aeId: deltaCapacity }

  Object.entries(assignments).forEach(([accountId, toAEId]) => {
    // Look up account real CV from the full accounts list
    const account = REBALANCE_ACCOUNTS.find((a) => a.id === accountId);
    // Use account CV scaled to thousands to match AE cv units, or 200 flat
    const cvValue = account ? Math.round(account.cv / 1000) : 200;

    // The original AE listed on the account loses CV
    const originalAEName = account?.aeName;
    const fromAE = MOCK_AE_DATA.find((ae) => ae.aeName === originalAEName);
    if (fromAE && fromAE.id !== toAEId) {
      cvDeltas[fromAE.id] = (cvDeltas[fromAE.id] ?? 0) - cvValue;
      capDeltas[fromAE.id] = (capDeltas[fromAE.id] ?? 0) + 1; // freed a slot
    }

    // Destination AE gains CV and uses a capacity slot
    cvDeltas[toAEId] = (cvDeltas[toAEId] ?? 0) + cvValue;
    capDeltas[toAEId] = (capDeltas[toAEId] ?? 0) - 1;
  });

  return baseAEData.map((ae) => {
    const cvDelta = cvDeltas[ae.id] ?? 0;
    const capDelta = capDeltas[ae.id] ?? 0;
    const newCV = Math.max(0, ae.cv + cvDelta);
    const newCap = Math.max(0, ae.availableCapacity + capDelta);
    const newPct = ae.targetBookingSize > 0
      ? Math.min(100, Math.round((newCV / ae.targetBookingSize) * 100))
      : ae.pctTargetFromSizeAchieved;
    const origPct = ae.targetBookingSize > 0
      ? Math.round((ae.cv / ae.targetBookingSize) * 100)
      : ae.pctTargetFromSizeAchieved;

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

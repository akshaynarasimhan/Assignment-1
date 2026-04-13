import { create } from 'zustand';

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
  // assignments: { [accountId]: aeId }  — which AE each account is assigned to
  assignments: {},
  // baseAEData: the original unmodified AE array loaded at Step 3
  baseAEData: [],
  // simulatedAEData: recalculated after every assignment change
  simulatedAEData: [],
  // pendingChanges: array of { accountId, fromAE, toAE, account } for audit log
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
    set({ baseAEData: data, simulatedAEData: data }),

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
// For each assignment, transfer account CV to new AE and recalculate metrics.
function recalculate(baseAEData, assignments) {
  // Build CV delta map: { aeId: deltaCV }
  const cvDeltas = {};
  const capacityDeltas = {};

  Object.entries(assignments).forEach(([accountId, toAEId]) => {
    // Each assigned account adds a fixed CV contribution (account sizeM * 100k)
    // and consumes 1 capacity slot on the receiving AE
    if (!cvDeltas[toAEId]) cvDeltas[toAEId] = 0;
    if (!capacityDeltas[toAEId]) capacityDeltas[toAEId] = 0;
    cvDeltas[toAEId] += 150; // approximate CV gain per account assignment
    capacityDeltas[toAEId] -= 1;
  });

  return baseAEData.map((ae) => {
    const cvDelta = cvDeltas[ae.id] ?? 0;
    const capDelta = capacityDeltas[ae.id] ?? 0;
    const newCV = Math.max(0, ae.cv + cvDelta);
    const newCapacity = Math.max(0, ae.availableCapacity + capDelta);
    const newPct = ae.targetBookingSize > 0
      ? Math.min(100, Math.round((newCV / ae.targetBookingSize) * 100))
      : ae.pctTargetFromSizeAchieved;

    return {
      ...ae,
      cv: newCV,
      availableCapacity: newCapacity,
      pctTargetFromSizeAchieved: newPct,
      _isSimulated: cvDelta !== 0 || capDelta !== 0,
      _cvDelta: cvDelta,
      _capDelta: capDelta,
      _pctDelta: newPct - ae.pctTargetFromSizeAchieved,
    };
  });
}

export default useAppStore;

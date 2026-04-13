import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  step: 1,
  filters: null,
  manager: null,
  mode: null,
  selectedAE: null,
  chatHistory: [],
  gridSpec: null,
  isLoading: false,

  setStep: (step) => set({ step }),

  setFilters: (filters) => set({ filters }),

  setManager: (manager) => set({ manager }),

  setMode: (mode) => set({ mode }),

  setSelectedAE: (selectedAE) => set({ selectedAE }),

  addChatMessage: (message) =>
    set((state) => ({
      chatHistory: [...state.chatHistory, message],
    })),

  clearChatHistory: () => set({ chatHistory: [] }),

  setGridSpec: (gridSpec) => set({ gridSpec }),

  setIsLoading: (isLoading) => set({ isLoading }),

  proceedToNextStep: () => {
    const { step } = get();
    if (step < 5) set({ step: step + 1 });
  },

  reset: () =>
    set({
      step: 1,
      filters: null,
      manager: null,
      mode: null,
      selectedAE: null,
      chatHistory: [],
      gridSpec: null,
      isLoading: false,
    }),
}));

export default useAppStore;

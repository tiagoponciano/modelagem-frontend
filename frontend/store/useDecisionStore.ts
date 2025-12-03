import { create } from "zustand";

export interface Option {
  id: string;
  name: string;
}

export interface Criterion {
  id: string;
  name: string;
}

interface Project {
  title: string;
  cities: Option[];
  criteria: Criterion[];
  // NOVO: Guarda os pesos das comparações dos critérios
  // Ex: "idCriterioA-idCriterioB": 5 (A é 5x mais importante que B)
  criteriaMatrix: Record<string, number>;
}

interface DecisionStore {
  project: Project;
  setProjectTitle: (title: string) => void;
  addCity: (option: Option) => void;
  removeCity: (id: string) => void;
  addCriterion: (criterion: Criterion) => void;
  removeCriterion: (id: string) => void;

  // NOVO: Ação para salvar um julgamento
  setCriteriaJudgment: (idA: string, idB: string, value: number) => void;

  resetProject: () => void;
}

export const useDecisionStore = create<DecisionStore>((set) => ({
  project: {
    title: "",
    cities: [],
    criteria: [],
    criteriaMatrix: {}, // Inicializa vazio
  },

  setProjectTitle: (title) =>
    set((state) => ({ project: { ...state.project, title } })),

  addCity: (option) =>
    set((state) => ({
      project: { ...state.project, cities: [...state.project.cities, option] },
    })),

  removeCity: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        cities: state.project.cities.filter((c) => c.id !== id),
      },
    })),

  addCriterion: (criterion) =>
    set((state) => ({
      project: {
        ...state.project,
        criteria: [...state.project.criteria, criterion],
      },
    })),

  removeCriterion: (id) =>
    set((state) => ({
      project: {
        ...state.project,
        criteria: state.project.criteria.filter((c) => c.id !== id),
      },
    })),

  // --- NOVA LÓGICA DE MATRIZ ---
  setCriteriaJudgment: (idA, idB, value) =>
    set((state) => ({
      project: {
        ...state.project,
        criteriaMatrix: {
          ...state.project.criteriaMatrix,
          [`${idA}-${idB}`]: value, // Guarda A vs B = valor
          // Opcional: Poderíamos guardar o inverso aqui, mas a matemática faz depois
        },
      },
    })),

  resetProject: () =>
    set({
      project: { title: "", cities: [], criteria: [], criteriaMatrix: {} },
    }),
}));

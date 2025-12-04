import { create } from "zustand";

// --- TIPOS E INTERFACES ---

export interface Option {
  id: string;
  name: string;
}

export interface Criterion {
  id: string;
  name: string;
}

export type CriterionType = "BENEFIT" | "COST";

// Chave: "idCidade-idCriterio" -> Valor numérico
export type EvaluationValues = Record<string, number>;

// Chave: "idCriterio" -> "BENEFIT" ou "COST"
export type CriteriaConfig = Record<string, CriterionType>;

interface Project {
  title: string;
  cities: Option[];
  criteria: Criterion[];
  // Pesos das comparações entre critérios (Matriz AHP)
  criteriaMatrix: Record<string, number>;
  // Valores reais (Input da tabela)
  evaluationValues: EvaluationValues;
  // Configuração (Maior melhor ou Menor melhor)
  criteriaConfig: CriteriaConfig;
}

interface DecisionStore {
  project: Project;

  // Ações Básicas
  setProjectTitle: (title: string) => void;
  addCity: (option: Option) => void;
  removeCity: (id: string) => void;
  addCriterion: (criterion: Criterion) => void;
  removeCriterion: (id: string) => void;

  // Ações de Matriz e Avaliação
  setCriteriaJudgment: (idA: string, idB: string, value: number) => void;
  setEvaluationValue: (
    cityId: string,
    criterionId: string,
    value: number
  ) => void;
  setCriterionType: (criterionId: string, type: CriterionType) => void;

  // Reset
  resetProject: () => void;
}

// --- IMPLEMENTAÇÃO DA STORE ---

export const useDecisionStore = create<DecisionStore>((set) => ({
  project: {
    title: "",
    cities: [],
    criteria: [],
    criteriaMatrix: {},
    evaluationValues: {},
    criteriaConfig: {},
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

  setCriteriaJudgment: (idA, idB, value) =>
    set((state) => ({
      project: {
        ...state.project,
        criteriaMatrix: {
          ...state.project.criteriaMatrix,
          [`${idA}-${idB}`]: value,
        },
      },
    })),

  setEvaluationValue: (cityId, criterionId, value) =>
    set((state) => ({
      project: {
        ...state.project,
        evaluationValues: {
          ...state.project.evaluationValues,
          [`${cityId}-${criterionId}`]: value,
        },
      },
    })),

  setCriterionType: (criterionId, type) =>
    set((state) => ({
      project: {
        ...state.project,
        criteriaConfig: {
          ...state.project.criteriaConfig,
          [criterionId]: type,
        },
      },
    })),

  resetProject: () =>
    set({
      project: {
        title: "",
        cities: [],
        criteria: [],
        criteriaMatrix: {},
        evaluationValues: {},
        criteriaConfig: {},
      },
    }),
}));

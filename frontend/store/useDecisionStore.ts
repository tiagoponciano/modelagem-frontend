import { create } from "zustand";

export interface Option {
  id: string;
  name: string;
}

export interface Criterion {
  id: string;
  name: string;
}

export type CriterionType = "BENEFIT" | "COST";

export type EvaluationValues = Record<string, number>;

export type CriteriaConfig = Record<string, CriterionType>;

interface Project {
  title: string;
  cities: Option[];
  criteria: Criterion[];
  criteriaMatrix: Record<string, number>;
  evaluationValues: EvaluationValues;
  criteriaConfig: CriteriaConfig;
}

interface DecisionStore {
  project: Project;
  editingProjectId: string | null;

  setProjectTitle: (title: string) => void;
  addCity: (option: Option) => void;
  removeCity: (id: string) => void;
  addCriterion: (criterion: Criterion) => void;
  removeCriterion: (id: string) => void;

  setCriteriaJudgment: (idA: string, idB: string, value: number) => void;
  setEvaluationValue: (
    cityId: string,
    criterionId: string,
    value: number
  ) => void;
  setCriterionType: (criterionId: string, type: CriterionType) => void;

  resetProject: () => void;
  loadProject: (
    projectData: {
      title: string;
      cities?: Option[];
      criteria?: Criterion[];
      criteriaMatrix?: Record<string, number>;
      evaluationValues?: EvaluationValues;
      criteriaConfig?: CriteriaConfig;
    },
    projectId?: string
  ) => void;
}

export const useDecisionStore = create<DecisionStore>((set) => ({
  project: {
    title: "",
    cities: [],
    criteria: [],
    criteriaMatrix: {},
    evaluationValues: {},
    criteriaConfig: {},
  },
  editingProjectId: null,

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
      editingProjectId: null,
    }),

  loadProject: (projectData, projectId) =>
    set({
      project: {
        title: projectData.title || "",
        cities: projectData.cities || [],
        criteria: projectData.criteria || [],
        criteriaMatrix: projectData.criteriaMatrix || {},
        evaluationValues: projectData.evaluationValues || {},
        criteriaConfig: projectData.criteriaConfig || {},
      },
      editingProjectId: projectId || null,
    }),
}));

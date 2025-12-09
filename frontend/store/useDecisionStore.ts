import { create } from "zustand";

export interface Option {
  id: string;
  name: string;
}

export interface CriterionField {
  id: string;
  name: string;
  type: "number" | "text" | "currency" | "percentage";
  unit?: string;
  question?: string;
}

export interface SubCriterion {
  id: string;
  name: string;
  criterionId: string;
}

export interface Criterion {
  id: string;
  name: string;
  fields?: CriterionField[];
  type?: "BENEFIT" | "COST";
}

export type CriterionType = "BENEFIT" | "COST";

export type EvaluationValues = Record<string, number>;

export type CriteriaConfig = Record<string, CriterionType>;

export type CriterionFieldValues = Record<string, Record<string, number | string>>;

interface Project {
  title: string;
  cities: Option[];
  criteria: Criterion[];
  subCriteria: SubCriterion[];
  criteriaMatrix: Record<string, number>;
  evaluationValues: EvaluationValues;
  criteriaConfig: CriteriaConfig;
  criterionFieldValues?: CriterionFieldValues;
}

interface DecisionStore {
  project: Project;
  editingProjectId: string | null;

  setEditingProjectId: (id: string | null) => void;
  setProjectTitle: (title: string) => void;
  addCity: (option: Option) => void;
  removeCity: (id: string) => void;
  addCriterion: (criterion: Criterion) => void;
  removeCriterion: (id: string) => void;
  addSubCriterion: (criterionId: string, name: string) => void;
  removeSubCriterion: (subCriterionId: string) => void;

  setCriteriaJudgment: (idA: string, idB: string, value: number) => void;
  setEvaluationValue: (
    cityId: string,
    criterionId: string,
    value: number
  ) => void;
  setCriterionType: (criterionId: string, type: CriterionType) => void;
  updateCriterion: (criterionId: string, updates: Partial<Criterion>) => void;
  setCriterionFieldValue: (
    cityId: string,
    criterionId: string,
    fieldKey: string,
    value: number | string
  ) => void;

  resetProject: () => void;
  loadProject: (
    projectData: {
      title: string;
      cities?: Option[];
      criteria?: Criterion[];
      subCriteria?: SubCriterion[];
      criteriaMatrix?: Record<string, number>;
      evaluationValues?: EvaluationValues;
      criteriaConfig?: CriteriaConfig;
      criterionFieldValues?: CriterionFieldValues;
    },
    projectId?: string
  ) => void;
}

export const useDecisionStore = create<DecisionStore>((set) => ({
  project: {
    title: "",
    cities: [],
    criteria: [],
    subCriteria: [],
    criteriaMatrix: {},
    evaluationValues: {},
    criteriaConfig: {},
    criterionFieldValues: {},
  },
  editingProjectId: null,

  setEditingProjectId: (id) =>
    set({ editingProjectId: id }),

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
        subCriteria: state.project.subCriteria?.filter((sc) => sc.criterionId !== id) || [],
      },
    })),

  addSubCriterion: (criterionId, name) =>
    set((state) => ({
      project: {
        ...state.project,
        subCriteria: [
          ...(state.project.subCriteria || []),
          {
            id: crypto.randomUUID(),
            name,
            criterionId,
          },
        ],
      },
    })),

  removeSubCriterion: (subCriterionId) =>
    set((state) => ({
      project: {
        ...state.project,
        subCriteria: (state.project.subCriteria || []).filter(
          (sc) => sc.id !== subCriterionId
        ),
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

  updateCriterion: (criterionId, updates) =>
    set((state) => ({
      project: {
        ...state.project,
        criteria: state.project.criteria.map((c) =>
          c.id === criterionId ? { ...c, ...updates } : c
        ),
      },
    })),

  setCriterionFieldValue: (cityId, criterionId, fieldKey, value) =>
    set((state) => {
      const key = criterionId === "" ? cityId : `${cityId}-${criterionId}`;
      return {
        project: {
          ...state.project,
          criterionFieldValues: {
            ...state.project.criterionFieldValues,
            [key]: {
              ...state.project.criterionFieldValues?.[key],
              [fieldKey]: value,
            },
          },
        },
      };
    }),

  resetProject: () =>
    set({
      project: {
        title: "",
        cities: [],
        criteria: [],
        subCriteria: [],
        criteriaMatrix: {},
        evaluationValues: {},
        criteriaConfig: {},
        criterionFieldValues: {},
      },
      editingProjectId: null,
    }),

  loadProject: (projectData, projectId) =>
    set({
      project: {
        title: projectData.title || "",
        cities: projectData.cities || [],
        criteria: projectData.criteria || [],
        subCriteria: projectData.subCriteria || [],
        criteriaMatrix: projectData.criteriaMatrix || {},
        evaluationValues: projectData.evaluationValues || {},
        criteriaConfig: projectData.criteriaConfig || {},
        criterionFieldValues: projectData.criterionFieldValues || {},
      },
      editingProjectId: projectId || null,
    }),
}));

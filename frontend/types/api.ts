import type {
  Option,
  Criterion,
  EvaluationValues,
  CriteriaConfig,
  CriterionFieldValues,
} from "../store/useDecisionStore";

export interface ProjectSummary {
  id: string;
  title: string;
  status: "Rascunho" | "Concluído";
  updatedAt: string;
  alternativesCount: number;
  criteriaCount: number;
}

export interface RankingItem {
  id: string;
  name: string;
  score: number;
  formattedScore: string;
}

export interface Project {
  id: string;
  title: string;
  cities?: Option[];
  criteria?: Criterion[];
  criteriaMatrix?: Record<string, number>;
  evaluationValues?: EvaluationValues;
  criteriaConfig?: CriteriaConfig;
  criterionFieldValues?: CriterionFieldValues;
  originalData?: {
    title?: string;
    cities?: Option[];
    criteria?: { id: string; name: string }[];
    criteriaMatrix?: Record<string, number>;
    evaluationValues?: EvaluationValues;
    criteriaConfig?: CriteriaConfig;
  };
  results?: {
    ranking: RankingItem[];
    criteriaWeights: Record<string, number>;
    matrixRaw?: number[][];
    lambdaMax?: number;
    consistencyIndex?: number;
    consistencyRatio?: number;
    randomIndex?: number;
    isConsistent?: boolean;
    eigenvector?: number[];
  };
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  alternativesCount?: number;
  criteriaCount?: number;
}

export type ProjectInput = Omit<Project, "id">;

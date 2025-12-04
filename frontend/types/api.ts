import type { Option, Criterion, EvaluationValues, CriteriaConfig } from "../store/useDecisionStore";

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
  cities: Option[];
  criteria: Criterion[];
  criteriaMatrix: Record<string, number>;
  evaluationValues: EvaluationValues;
  criteriaConfig: CriteriaConfig;
  originalData?: {
    criteria: { id: string; name: string }[];
  };
  results?: {
    ranking: RankingItem[];
    criteriaWeights: Record<string, number>;
  };
}

export type ProjectInput = Omit<Project, "id">;


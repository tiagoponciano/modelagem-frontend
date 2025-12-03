// src/types/index.ts

export interface CityOption {
  id: string;
  name: string;
}

export interface CriteriaWeight {
  criteriaA: string;
  criteriaB: string;
  value: number; // 1 a 9
}

export interface CityData {
  cityId: string;
  rentCost: number;       // R$/m²
  laborCost: number;      // Salário
  distancePort: number;   // Km
  securityScore: number;  // 1-5
}

export interface DecisionProject {
  title: string;
  cities: CityOption[];
  weights: CriteriaWeight[];
  data: CityData[];
}
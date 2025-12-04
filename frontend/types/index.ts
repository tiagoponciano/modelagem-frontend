export interface CityOption {
  id: string;
  name: string;
}

export interface CriteriaWeight {
  criteriaA: string;
  criteriaB: string;
  value: number;
}

export interface CityData {
  cityId: string;
  rentCost: number;
  laborCost: number;
  distancePort: number;
  securityScore: number;
}

export interface DecisionProject {
  title: string;
  cities: CityOption[];
  weights: CriteriaWeight[];
  data: CityData[];
}
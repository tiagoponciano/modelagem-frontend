export const API_BASE_URL = "http://localhost:3001";

export const API_ENDPOINTS = {
  PROJECTS: `${API_BASE_URL}/projects`,
  PROJECT_BY_ID: (id: string) => `${API_BASE_URL}/projects/${id}`,
} as const;


export const API_BASE_URL = "https://modelagem-backend.vercel.app/";

export const API_ENDPOINTS = {
  PROJECTS: `${API_BASE_URL}/projects`,
  PROJECT_BY_ID: (id: string) => `${API_BASE_URL}/projects/${id}`,
  UPDATE_PROJECT: (id: string) => `${API_BASE_URL}/projects/${id}`,
  DELETE_PROJECT: (id: string) => `${API_BASE_URL}/projects/${id}`,
  CALCULATE: `${API_BASE_URL}/projects/calculate`,
} as const;

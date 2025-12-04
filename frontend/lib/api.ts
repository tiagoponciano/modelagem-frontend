import { API_ENDPOINTS } from "./constants";
import type { Project, ProjectInput, ProjectSummary } from "../types/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(
      `Erro HTTP: ${response.status} - ${response.statusText}`,
      response.status,
      response.statusText
    );
  }
  return response.json();
}

export const api = {
  async getProjects(): Promise<ProjectSummary[]> {
    try {
      const response = await fetch(API_ENDPOINTS.PROJECTS);
      return handleResponse<ProjectSummary[]>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Não foi possível conectar com o servidor.");
    }
  },

  async getProjectById(id: string): Promise<Project> {
    try {
      const allProjects = await this.getProjects();
      const project = allProjects.find((p) => p.id === id);
      if (!project) {
        throw new ApiError("Projeto não encontrado ou ID inválido.", 404);
      }
      return project as Project;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Não foi possível conectar com o servidor.");
    }
  },

  async createProject(project: ProjectInput): Promise<Project> {
    try {
      const response = await fetch(API_ENDPOINTS.PROJECTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      return handleResponse<Project>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Não foi possível criar o projeto.");
    }
  },
};


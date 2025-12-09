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
    let errorMessage = `Erro HTTP: ${response.status} - ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (typeof errorData === "string") {
        errorMessage = errorData;
      }
    } catch {}
    throw new ApiError(errorMessage, response.status, response.statusText);
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
      const response = await fetch(API_ENDPOINTS.PROJECT_BY_ID(id));
      return handleResponse<Project>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Não foi possível conectar com o servidor.");
    }
  },

  async createProject(project: ProjectInput): Promise<Project> {
    try {
      const { originalData, results, ...projectData } = project;

      const response = await fetch(API_ENDPOINTS.PROJECTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      return handleResponse<Project>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Não foi possível criar o projeto.");
    }
  },

  async updateProject(
    id: string,
    project: Partial<ProjectInput>
  ): Promise<Project> {
    try {
      const { originalData, results, ...projectData } = project;

      const response = await fetch(API_ENDPOINTS.UPDATE_PROJECT(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      if (response.status === 404) {
        throw new ApiError(
          "Endpoint PATCH não encontrado no backend. O método PATCH pode não estar implementado.",
          404
        );
      }

      if (response.status === 405) {
        throw new ApiError(
          "Método PATCH não permitido. Verifique se o backend está configurado corretamente.",
          405
        );
      }

      return handleResponse<Project>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Não foi possível atualizar o projeto.");
    }
  },

  async deleteProject(
    id: string,
    username: string,
    password: string
  ): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_PROJECT(id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
      });

      if (response.status === 204 || response.status === 200) {
        return;
      }

      if (response.status === 404) {
        let errorMessage =
          "Endpoint DELETE não encontrado no backend. O método DELETE pode não estar implementado.";
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {}
        throw new ApiError(errorMessage, 404);
      }

      if (response.status === 405) {
        throw new ApiError(
          "Método DELETE não permitido. Verifique se o backend está configurado corretamente.",
          405
        );
      }

      if (response.status === 401 || response.status === 403) {
        let errorMessage =
          "Credenciais inválidas ou sem permissão para excluir.";
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {}
        throw new ApiError(errorMessage, response.status);
      }

      if (!response.ok) {
        await handleResponse<never>(response);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Não foi possível excluir o projeto.");
    }
  },

  async saveDraft(project: Partial<ProjectInput> & { id?: string }): Promise<Project> {
    try {
      const { originalData, results, ...projectData } = project;

      const response = await fetch(API_ENDPOINTS.SAVE_DRAFT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      return handleResponse<Project>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Não foi possível salvar o rascunho.");
    }
  },

  async updateDraft(
    id: string,
    project: Partial<ProjectInput>
  ): Promise<Project> {
    try {
      const { originalData, results, ...projectData } = project;

      const response = await fetch(API_ENDPOINTS.UPDATE_DRAFT(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      return handleResponse<Project>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Não foi possível atualizar o rascunho.");
    }
  },
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Project, ProjectInput, ProjectSummary } from "../types/api";

export function useProjects() {
  return useQuery<ProjectSummary[]>({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useProject(id: string | undefined) {
  return useQuery<Project | undefined>({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) return undefined;
      return api.getProjectById(id);
    },
    enabled: !!id,
    retry: 1,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, ProjectInput>({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<
    Project,
    Error,
    { id: string; project: Partial<ProjectInput> }
  >({
    mutationFn: ({ id, project }) => api.updateProject(id, project),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { id: string; username: string; password: string }
  >({
    mutationFn: ({ id, username, password }) =>
      api.deleteProject(id, username, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, Partial<ProjectInput> & { id?: string }>({
    mutationFn: (project) => api.saveDraft(project),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: ["project", data.id] });
      }
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();

  return useMutation<
    Project,
    Error,
    { id: string; project: Partial<ProjectInput> }
  >({
    mutationFn: ({ id, project }) => api.updateDraft(id, project),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
    },
  });
}

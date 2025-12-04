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


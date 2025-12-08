"use client";

import { ThemeToggle } from "../components/ThemeToggle";
import { DeleteProjectModal } from "../components/DeleteProjectModal";
import { useRouter } from "next/navigation";
import { useDecisionStore } from "../store/useDecisionStore";
import { useProjects, useDeleteProject } from "../hooks/useProjects";
import { useState } from "react";
import { api } from "../lib/api";

export default function Home() {
  const router = useRouter();
  const { resetProject, loadProject } = useDecisionStore();
  const { data: projects = [], isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    projectId: string;
    projectTitle: string;
  }>({ isOpen: false, projectId: "", projectTitle: "" });

  const handleStartNew = () => {
    resetProject();
    router.push("/setup");
  };

  const handleEditProject = (projectId: string) => {
    router.push(`/results/${projectId}`);
  };

  const handleEditCriteria = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    try {
      const projectData = await api.getProjectById(projectId);
      const originalData = projectData.originalData;

      let cities: Array<{ id: string; name: string }> = [];

      if (Array.isArray(projectData.cities) && projectData.cities.length > 0) {
        cities = projectData.cities;
      } else if (
        Array.isArray(originalData?.cities) &&
        originalData.cities.length > 0
      ) {
        cities = originalData.cities;
      } else if (
        projectData.results?.ranking &&
        Array.isArray(projectData.results.ranking) &&
        projectData.results.ranking.length > 0
      ) {
        cities = projectData.results.ranking.map((item) => ({
          id: item.id,
          name: item.name,
        }));
      } else if (
        Array.isArray((projectData as any).alternatives) &&
        (projectData as any).alternatives.length > 0
      ) {
        cities = (projectData as any).alternatives;
      } else if (
        Array.isArray((projectData as any).options) &&
        (projectData as any).options.length > 0
      ) {
        cities = (projectData as any).options;
      }

      loadProject(
        {
          title: projectData.title || originalData?.title || "",
          cities: cities,
          criteria: Array.isArray(projectData.criteria)
            ? projectData.criteria
            : Array.isArray(originalData?.criteria)
            ? originalData.criteria.map((c) => ({ id: c.id, name: c.name }))
            : [],
          criteriaMatrix:
            projectData.criteriaMatrix || originalData?.criteriaMatrix || {},
          evaluationValues:
            projectData.evaluationValues ||
            originalData?.evaluationValues ||
            {},
          criteriaConfig:
            projectData.criteriaConfig || originalData?.criteriaConfig || {},
        },
        projectId
      );
      router.push("/setup");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao carregar projeto para edição."
      );
    }
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    projectId: string,
    title: string
  ) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, projectId, projectTitle: title });
  };

  const handleDeleteConfirm = async (username: string, password: string) => {
    await deleteProject.mutateAsync({
      id: deleteModal.projectId,
      username,
      password,
    });
    setDeleteModal({ isOpen: false, projectId: "", projectTitle: "" });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-400/20 dark:bg-blue-900/20 blur-[100px] rounded-full pointer-events-none" />
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Decision Matrix
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Sistema de Apoio à Decisão Multicritério (AHP)
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white dark:ring-slate-800">
              TP
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 text-center mb-16 transition-colors duration-300">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-6 text-blue-600 dark:text-blue-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              O que vamos decidir hoje?
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 font-light">
              Utilize o método AHP para comparar cidades, fornecedores ou
              estratégias de forma matemática e imparcial.
            </p>

            <button
              onClick={handleStartNew}
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1"
            >
              + Criar Nova Análise
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              Histórico Recente
              <span className="text-xs font-normal px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
                {projects.length}
              </span>
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl"
                ></div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 bg-white/50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl backdrop-blur-sm">
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                Nenhum projeto encontrado.
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Seus rascunhos e análises concluídas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => handleEditProject(proj.id)}
                  className="group bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-none relative"
                >
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button
                      onClick={(e) => handleDeleteClick(e, proj.id, proj.title)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                      title="Excluir projeto"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleEditCriteria(e, proj.id)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all opacity-0 group-hover:opacity-100"
                      title="Editar critérios"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`p-2.5 rounded-xl transition-colors ${
                        proj.status === "Concluído"
                          ? "bg-green-100/50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-orange-100/50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                      }`}
                    >
                      {proj.status === "Concluído" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        proj.status === "Concluído"
                          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-400"
                          : "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/30 dark:bg-orange-900/10 dark:text-orange-400"
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {proj.title}
                  </h4>

                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        ></path>
                      </svg>
                      {proj.alternativesCount} Opções
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        ></path>
                      </svg>
                      {proj.criteriaCount} Critérios
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400 dark:text-slate-500">
                    <span>
                      Atualizado em{" "}
                      {new Date(proj.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform text-blue-600 dark:text-blue-400 font-semibold">
                      Abrir &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <DeleteProjectModal
        isOpen={deleteModal.isOpen}
        onClose={() =>
          setDeleteModal({ isOpen: false, projectId: "", projectTitle: "" })
        }
        onConfirm={handleDeleteConfirm}
        projectTitle={deleteModal.projectTitle}
      />
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";
import { ThemeToggle } from "../../../components/ThemeToggle";
import { useProject } from "../../../hooks/useProjects";
import { useNavigation } from "../../../hooks/useNavigation";
import type { Project } from "../../../types/api";

export default function ResultsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { navigate } = useNavigation();
  const { data: projectData, isLoading, error } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative">
        <h1 className="text-2xl text-slate-800 dark:text-white flex items-center gap-4">
          <svg
            className="animate-spin h-6 w-6 text-emerald-500"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Calculando Resultados...
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Aguarde o processamento do AHP.
        </p>
      </div>
    );
  }

  if (error || (!isLoading && !projectData)) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative">
        <h1 className="text-2xl text-red-500">
          {error instanceof Error ? error.message : "Erro ao carregar dados."}
        </h1>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  if (!projectData?.results) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative">
        <h1 className="text-2xl text-red-500 mb-2">
          Dados do projeto incompletos.
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          O backend não retornou os resultados calculados.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  const {
    ranking,
    criteriaWeights,
    lambdaMax,
    consistencyIndex,
    consistencyRatio,
    randomIndex,
    isConsistent,
  } = projectData.results;

  const criteriaNames =
    projectData.originalData?.criteria ||
    projectData.criteria?.map((c) => ({ id: c.id, name: c.name })) ||
    [];

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 py-6 px-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-200/20 dark:bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10 h-full flex flex-col">
        <div className="mb-4 text-center flex-shrink-0">
          <h1 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-2">
            {projectData.title}
          </h1>
          <p className="text-base text-slate-700 dark:text-slate-300">
            Resultado da Análise Multicritério (AHP)
          </p>
        </div>

        {isConsistent === false && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-500 rounded-xl shadow-md flex-shrink-0">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                  Atenção: Análise com Inconsistência Detectada (CR ≥ 0.1)
                </h3>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          <div className="lg:col-span-2 space-y-3 overflow-y-auto pr-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3 border-b border-slate-200 dark:border-slate-800 pb-2 sticky top-0 bg-slate-50 dark:bg-slate-950 z-10">
              Ranking Final
            </h2>

            {ranking.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border-2 transition-all shadow-md ${
                  index === 0
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 shadow-emerald-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-black ${
                        index === 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        index === 0
                          ? "text-emerald-800 dark:text-emerald-200"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>

                  <span
                    className={`text-2xl font-extrabold ${
                      index === 0
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {item.formattedScore}
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                  <div
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: item.score + "%",
                      backgroundColor: index === 0 ? "#10B981" : "#64748B",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-2">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                Pesos dos Critérios
              </h3>

              <div className="space-y-3">
                {Object.entries(criteriaWeights).map(([id, weight], index) => {
                  const criterionName =
                    criteriaNames.find((c) => c.id === id)?.name ||
                    `Critério ${index + 1}`;
                  const percentage = weight * 100;

                  return (
                    <div key={id}>
                      <div className="flex justify-between text-sm font-medium mb-1.5 text-slate-600 dark:text-slate-300">
                        <span className="truncate">{criterionName}</span>
                        <span className="font-bold text-slate-800 dark:text-white ml-2">
                          {percentage.toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-indigo-500 transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {lambdaMax !== undefined &&
              consistencyIndex !== undefined &&
              consistencyRatio !== undefined &&
              randomIndex !== undefined && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex-shrink-0">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                    Métricas de Consistência
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Lambda Max (λmax)
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {lambdaMax.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Índice de Consistência (CI)
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {consistencyIndex.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Índice Aleatório (RI)
                      </span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {randomIndex.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Razão de Consistência (CR)
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isConsistent === false
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {consistencyRatio.toFixed(4)}
                        {isConsistent === false && " ⚠️"}
                      </span>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isConsistent === false
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {isConsistent === false
                            ? "Análise inconsistente (CR ≥ 0.1)"
                            : "Análise consistente (CR < 0.1)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            <div className="flex-shrink-0">
              <button
                onClick={() => navigate("/")}
                className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white text-base px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
              >
                Iniciar Nova Análise
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

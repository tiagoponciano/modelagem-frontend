"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ThemeToggle } from "../../../components/ThemeToggle";

// Interface para o resultado simplificado que vem do Backend
interface RankingItem {
  id: string;
  name: string;
  score: number;
  formattedScore: string;
}

interface ProjectData {
  id: string;
  title: string;
  // O originalData é útil para pegar o nome dos critérios
  originalData: {
    criteria: { id: string; name: string }[];
  };
  results: {
    ranking: RankingItem[];
    criteriaWeights: Record<string, number>;
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca os dados do projeto calculado
  useEffect(() => {
    async function fetchResults() {
      if (!projectId) return;

      try {
        // Busca a lista completa para encontrar o projeto pelo ID (NestJS em memória)
        const response = await fetch(`http://localhost:3001/projects`);
        if (!response.ok) throw new Error("Erro ao carregar projetos.");

        const allProjects: ProjectData[] = await response.json();
        const foundProject = allProjects.find((p) => p.id === projectId);

        if (!foundProject) {
          setError("Projeto não encontrado ou ID inválido.");
        } else {
          setProjectData(foundProject);
        }
      } catch (e) {
        setError("Não foi possível conectar com o servidor de cálculo.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();
  }, [projectId]);

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

  if (error || !projectData) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative">
        <h1 className="text-2xl text-red-500">
          {error || "Erro ao carregar dados."}
        </h1>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  const { ranking, criteriaWeights } = projectData.results;
  const criteriaNames = projectData.originalData.criteria;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 relative overflow-x-hidden transition-colors duration-300">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-200/20 dark:bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-6xl mx-auto relative z-10">
        {/* Header de Resultados */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-2">
            {projectData.title}
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300">
            Resultado da Análise Multicritério (AHP)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna 1: Ranking e Vencedor */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              Ranking Final
            </h2>

            {ranking.map((item, index) => (
              <div
                key={item.id}
                className={`p-5 rounded-xl border-2 transition-all shadow-md ${
                  index === 0
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 scale-105 shadow-emerald-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {/* Posição */}
                    <span
                      className={`text-3xl font-black ${
                        index === 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      #{index + 1}
                    </span>
                    {/* Nome */}
                    <span
                      className={`text-xl font-bold ${
                        index === 0
                          ? "text-emerald-800 dark:text-emerald-200"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>

                  {/* Score/Pontuação */}
                  <span
                    className={`text-3xl font-extrabold ${
                      index === 0
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {item.formattedScore}
                  </span>
                </div>

                {/* Barra de Pontuação */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-3">
                  <div
                    className="h-2.5 rounded-full transition-all duration-1000"
                    style={{
                      width: item.score + "%",
                      backgroundColor: index === 0 ? "#10B981" : "#64748B",
                    }} // Emerald-500 vs Slate-500
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Coluna 2: Pesos dos Critérios */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                Pesos dos Critérios (AHP)
              </h3>

              {Object.entries(criteriaWeights).map(([id, weight]) => {
                const criterionName =
                  criteriaNames.find((c) => c.id === id)?.name ||
                  "Desconhecido";
                // O peso do AHP já é normalizado no backend, então multiplicamos por 100
                const percentage = weight * 100;

                return (
                  <div key={id} className="mb-4">
                    <div className="flex justify-between text-sm font-medium mb-1 text-slate-600 dark:text-slate-300">
                      <span>{criterionName}</span>
                      <span className="font-bold text-slate-800 dark:text-white">
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

            {/* Botão de Nova Análise */}
            <div className="mt-8">
              <button
                onClick={() => router.push("/")}
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

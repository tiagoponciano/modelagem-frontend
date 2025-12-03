"use client";

import { useState, useEffect } from "react";
import { useDecisionStore } from "../../store/useDecisionStore";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../../components/ThemeToggle";

export default function SetupPage() {
  const router = useRouter();
  const { project, setProjectTitle, addCity, removeCity, resetProject } =
    useDecisionStore();

  const [newCityName, setNewCityName] = useState("");
  const [isNavigating, setIsNavigating] = useState(false); // <--- NOVO ESTADO DE LOADING

  const handleAddCity = () => {
    if (!newCityName.trim()) return;
    addCity({
      id: crypto.randomUUID(),
      name: newCityName,
    });
    setNewCityName("");
  };

  const handleNextStep = () => {
    // Validação
    if (!project.title || project.cities.length < 2) {
      alert("Por favor, preencha o título e adicione pelo menos 2 opções.");
      return;
    }

    // 1. Ativa o estado de carregamento
    setIsNavigating(true);

    // 2. Navega direto (sem alert)
    router.push("/criteria");
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-200/20 dark:bg-indigo-900/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Botão de Tema */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6 px-2">
          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              &larr;
            </span>
            Voltar ao Início
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
            <span className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
              Passo 1 de 3
            </span>
          </div>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-white/20 dark:border-slate-800 transition-all duration-300">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              Iniciar nova análise
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-light">
              Defina o objetivo e as opções (alternativas).
            </p>
          </div>

          {/* 1. Título */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Objetivo da Decisão
            </label>
            <input
              type="text"
              autoFocus
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: Qual carro devo comprar?"
              value={project.title}
              onChange={(e) => setProjectTitle(e.target.value)}
              disabled={isNavigating} // Trava enquanto carrega
            />
          </div>

          {/* 2. Adicionar Alternativas */}
          <div className="mb-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Opções Disponíveis
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Digite uma opção..."
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCity()}
                disabled={isNavigating}
              />
              <button
                onClick={handleAddCity}
                disabled={!newCityName.trim() || isNavigating}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 rounded-lg font-semibold transition-all shadow-md active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* LISTA FIXA */}
          <div className="mt-4 h-60 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col relative overflow-hidden">
            {project.cities.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mb-2 opacity-20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p className="text-sm">Adicione pelo menos 2 opções.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {project.cities.map((city) => (
                  <div
                    key={city.id}
                    className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 pl-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-indigo-400 dark:hover:border-indigo-500 transition-all animate-in fade-in slide-in-from-bottom-2"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-4">
                      {city.name}
                    </span>
                    <button
                      onClick={() => removeCity(city.id)}
                      disabled={isNavigating}
                      className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Remover"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RODAPÉ DO CARD COM LOADING NO BOTÃO */}
          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleNextStep}
              disabled={isNavigating} // Impede cliques duplos
              className="bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-wait text-white text-base px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
            >
              {isNavigating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
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
                  Processando...
                </>
              ) : (
                <>
                  Próximo Passo
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

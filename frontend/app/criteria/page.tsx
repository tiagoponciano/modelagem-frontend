"use client";

import { useDecisionStore } from "../../store/useDecisionStore";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useNavigation } from "../../hooks/useNavigation";
import { useForm } from "../../hooks/useForm";

export default function CriteriaPage() {
  const { project, addCriterion, removeCriterion } = useDecisionStore();
  const { navigate, isNavigating } = useNavigation();
  const { values, setValue, handleChange } = useForm({ newCriterionName: "" });

  const handleAddCriterion = () => {
    if (!values.newCriterionName.trim()) return;
    addCriterion({
      id: crypto.randomUUID(),
      name: values.newCriterionName,
    });
    setValue("newCriterionName", "");
  };

  const handleNextStep = () => {
    if (project.criteria.length < 2) {
      alert(
        "Por favor, adicione pelo menos 2 critérios (ex: Preço, Qualidade)."
      );
      return;
    }
    navigate("/data-entry?page=0");
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-200/20 dark:bg-purple-900/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="flex items-center justify-between mb-6 px-2">
          <button
            onClick={() => navigate("/setup")}
            className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              &larr;
            </span>
            Voltar para Opções
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-600 dark:bg-purple-400"></span>
            <span className="text-xs font-bold tracking-widest text-purple-600 dark:text-purple-400 uppercase">
              Passo 2 de 2
            </span>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-white/20 dark:border-slate-800 transition-all duration-300">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              Definir Critérios
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-light">
              O que é importante para tomar essa decisão? (Ex: Custo, Benefício)
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Decisão Atual
            </label>
            <div className="w-full p-3 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
              {project.title || "Projeto sem nome"}
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Adicionar Critério
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Ex: Custo, Conforto, Rapidez..."
                value={values.newCriterionName}
                onChange={handleChange("newCriterionName")}
                onKeyDown={(e) => e.key === "Enter" && handleAddCriterion()}
                disabled={isNavigating}
              />
              <button
                onClick={handleAddCriterion}
                disabled={!values.newCriterionName.trim() || isNavigating}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 rounded-lg font-semibold transition-all shadow-md active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-4 h-60 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-slate-100 dark:border-slate-800/50 flex flex-col relative overflow-hidden">
            {project.criteria.length === 0 ? (
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm">Adicione pelo menos 2 critérios.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {project.criteria.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 pl-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-purple-400 dark:hover:border-purple-500 transition-all animate-in fade-in slide-in-from-bottom-2"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-4">
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeCriterion(item.id)}
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

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={handleNextStep}
              disabled={isNavigating}
              className="bg-slate-900 dark:bg-purple-600 hover:bg-slate-800 dark:hover:bg-purple-500 disabled:opacity-70 disabled:cursor-wait text-white text-base px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
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
                  Ir para Comparações
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

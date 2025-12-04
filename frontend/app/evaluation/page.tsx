"use client";

import { useDecisionStore } from "../../store/useDecisionStore";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useNavigation } from "../../hooks/useNavigation";
import { useCreateProject, useUpdateProject } from "../../hooks/useProjects";

export default function EvaluationPage() {
  const { navigate } = useNavigation();
  const { project, editingProjectId, setEvaluationValue, setCriterionType } =
    useDecisionStore();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const handleFinish = async () => {
    if (project.criteria.length === 0 || project.cities.length === 0) {
      alert("Erro: Defina pelo menos 2 opções e 2 critérios.");
      return;
    }

    const allValuesFilled = project.cities.every((city) =>
      project.criteria.every((crit) => {
        const value = project.evaluationValues[`${city.id}-${crit.id}`];
        return value !== undefined && value !== null && !isNaN(value);
      })
    );

    if (!allValuesFilled) {
      alert(
        "Por favor, preencha todos os valores de avaliação antes de calcular."
      );
      return;
    }

    const allCriteriaHaveType = project.criteria.every(
      (crit) =>
        project.criteriaConfig[crit.id] === "BENEFIT" ||
        project.criteriaConfig[crit.id] === "COST"
    );

    if (!allCriteriaHaveType) {
      alert(
        "Por favor, defina o tipo (Benefício ou Custo) para todos os critérios."
      );
      return;
    }

    try {
      let data;
      if (editingProjectId) {
        data = await updateProject.mutateAsync({
          id: editingProjectId,
          project: {
            title: project.title,
            cities: project.cities,
            criteria: project.criteria,
            criteriaMatrix: project.criteriaMatrix,
            evaluationValues: project.evaluationValues,
            criteriaConfig: project.criteriaConfig,
          },
        });
      } else {
        data = await createProject.mutateAsync(project);
      }
      navigate(`/results/${data.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Houve um erro no cálculo. Verifique o console do backend.";
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-12 px-4 relative overflow-x-hidden transition-colors duration-300">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-200/20 dark:bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="flex items-center justify-between mb-8 px-2">
          <button
            onClick={() => navigate("/matrix")}
            className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
          >
            &larr; Voltar
          </button>
          <span className="text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
            Passo Final
          </span>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 transition-all">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Inserir Dados
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Preencha valores reais. Defina{" "}
              <strong className="text-emerald-600">Benefício (↑)</strong> ou{" "}
              <strong className="text-red-500">Custo (↓)</strong>.
            </p>
          </div>

          {project.criteria.length === 0 || project.cities.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 mb-8 p-12 text-center bg-slate-50 dark:bg-slate-950/50">
              <p className="text-slate-500 dark:text-slate-400 mb-2">
                {project.criteria.length === 0 && project.cities.length === 0
                  ? "Adicione critérios e opções para continuar."
                  : project.criteria.length === 0
                  ? "Adicione pelo menos 2 critérios para continuar."
                  : "Adicione pelo menos 2 opções para continuar."}
              </p>
              <button
                onClick={() => navigate("/criteria")}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Voltar para definir critérios
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 mb-8 custom-scrollbar pb-2">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-100 dark:bg-slate-950/50 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-bold sticky left-0 bg-slate-100 dark:bg-slate-950 z-10 shadow-sm">
                      Opções Critérios
                    </th>
                    {project.criteria.map((crit) => (
                      <th key={crit.id} className="px-6 py-3 min-w-[200px]">
                        <div className="flex flex-col items-center text-center gap-2">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {crit.name}
                          </span>
                          <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1 gap-1">
                            <button
                              onClick={() =>
                                setCriterionType(crit.id, "BENEFIT")
                              }
                              className={`
      px-3 py-1 rounded-md text-[11px] font-bold transition-all w-20 text-center
      ${
        project.criteriaConfig[crit.id] === "BENEFIT"
          ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-sm"
          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      }
    `}
                            >
                              ↑ Maior
                            </button>

                            <button
                              onClick={() => setCriterionType(crit.id, "COST")}
                              className={`
      px-3 py-1 rounded-md text-[11px] font-bold transition-all w-20 text-center
      ${
        project.criteriaConfig[crit.id] === "COST"
          ? "bg-white dark:bg-slate-700 text-red-500 shadow-sm"
          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      }
    `}
                            >
                              ↓ Menor
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {project.cities.map((city, idx) => (
                    <tr
                      key={city.id}
                      className={`border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        idx % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-slate-50/50 dark:bg-slate-900/50"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white sticky left-0 bg-inherit z-10 shadow-sm">
                        {city.name}
                      </td>
                      {project.criteria.map((crit) => (
                        <td key={crit.id} className="px-6 py-4">
                          <input
                            type="number"
                            placeholder="0.00"
                            className="w-full p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                            value={
                              project.evaluationValues[
                                `${city.id}-${crit.id}`
                              ] || ""
                            }
                            onChange={(e) =>
                              setEvaluationValue(
                                city.id,
                                crit.id,
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={handleFinish}
              disabled={createProject.isPending || updateProject.isPending}
              className="bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-lg px-10 py-4 rounded-xl font-bold transition-all shadow-xl hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
            >
              {createProject.isPending || updateProject.isPending
                ? "Calculando..."
                : editingProjectId
                ? "Atualizar e Calcular"
                : "Calcular Resultado"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

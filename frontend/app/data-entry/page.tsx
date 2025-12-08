"use client";

import { useDecisionStore } from "../../store/useDecisionStore";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useNavigation } from "../../hooks/useNavigation";
import { useCreateProject, useUpdateProject } from "../../hooks/useProjects";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

interface Warehouse {
  id: string;
  name: string;
}

interface Port {
  id: string;
  name: string;
}

const DATA_PAGES = [
  { id: "price-per-m2", name: "Preço por m²", type: "price" },
  { id: "logistics-security", name: "Logística e Segurança", type: "score" },
  { id: "port-distance", name: "Distância até o Porto", type: "distance" },
];

export default function DataEntryPage() {
  const searchParams = useSearchParams();
  const { navigate } = useNavigation();
  const { project, editingProjectId, setCriterionFieldValue } =
    useDecisionStore();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const pageParam = searchParams.get("page");
  const pageIndex = pageParam ? Math.max(0, parseInt(pageParam, 10)) : 0;
  const currentPage = DATA_PAGES[pageIndex];

  const [warehousesByCity, setWarehousesByCity] = useState<
    Record<string, Warehouse[]>
  >(() => {
    const initial: Record<string, Warehouse[]> = {};
    project.cities.forEach((city) => {
      initial[city.id] = [
        { id: crypto.randomUUID(), name: "Galpão 1" },
        { id: crypto.randomUUID(), name: "Galpão 2" },
      ];
    });
    return initial;
  });

  const [ports, setPorts] = useState<Port[]>([
    { id: "port-itajai", name: "Porto Itajaí" },
    { id: "port-navegantes", name: "Porto Navegantes" },
  ]);

  const [selectedPortIndex, setSelectedPortIndex] = useState(0);
  const selectedPort = ports[selectedPortIndex];

  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  if (!currentPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Página não encontrada.
          </p>
          <button
            onClick={() => navigate("/matrix")}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Voltar para matrix
          </button>
        </div>
      </div>
    );
  }

  const addWarehouse = (cityId: string) => {
    setWarehousesByCity((prev) => {
      const cityWarehouses = prev[cityId] || [];
      const newWarehouse: Warehouse = {
        id: crypto.randomUUID(),
        name: `Galpão ${cityWarehouses.length + 1}`,
      };
      return {
        ...prev,
        [cityId]: [...cityWarehouses, newWarehouse],
      };
    });
  };

  const getFieldValue = (
    cityId: string,
    warehouseId: string,
    fieldId: string
  ): number => {
    const key = `${cityId}-${currentPage.id}`;
    const fieldValues = project.criterionFieldValues?.[key];
    const fullFieldKey = `${warehouseId}-${fieldId}`;
    const value = fieldValues?.[fullFieldKey];
    return typeof value === "number" ? value : 0;
  };

  const setFieldValue = (
    cityId: string,
    warehouseId: string,
    fieldId: string,
    value: number
  ) => {
    const key = `${cityId}-${currentPage.id}`;
    const fullFieldKey = `${warehouseId}-${fieldId}`;
    setCriterionFieldValue(cityId, currentPage.id, fullFieldKey, value);
  };

  const calculatePricePerM2 = (cityId: string, warehouseId: string): number => {
    const aluguel = getFieldValue(cityId, warehouseId, "aluguel");
    const m2 = getFieldValue(cityId, warehouseId, "m2");
    if (m2 > 0) {
      return aluguel / m2;
    }
    return 0;
  };

  const calculateCityAverages = (cityId: string) => {
    const warehouses = warehousesByCity[cityId] || [];
    if (warehouses.length === 0) {
      return { aluguel: 0, m2: 0, pricePerM2: 0 };
    }

    let totalAluguel = 0;
    let totalM2 = 0;
    let totalPricePerM2 = 0;
    let count = 0;

    warehouses.forEach((warehouse) => {
      const aluguel = getFieldValue(cityId, warehouse.id, "aluguel");
      const m2 = getFieldValue(cityId, warehouse.id, "m2");
      const pricePerM2 = calculatePricePerM2(cityId, warehouse.id);

      if (aluguel > 0 || m2 > 0) {
        totalAluguel += aluguel;
        totalM2 += m2;
        totalPricePerM2 += pricePerM2;
        count++;
      }
    });

    const avgCount = count > 0 ? count : 1;
    return {
      aluguel: totalAluguel / avgCount,
      m2: totalM2 / avgCount,
      pricePerM2: totalPricePerM2 / avgCount,
    };
  };

  const getPriceAhpValue = (
    cityAId: string,
    cityBId: string
  ): number | null => {
    const key = `${cityAId}-${currentPage.id}`;
    const fieldValues = project.criterionFieldValues?.[key];
    const value = fieldValues?.[`ahp-price-${cityBId}`];
    return typeof value === "number" ? value : null;
  };

  const setPriceAhpValue = (
    cityAId: string,
    cityBId: string,
    value: number
  ) => {
    if (cityAId === cityBId) return;

    if (value === 0 || isNaN(value)) {
      setCriterionFieldValue(
        cityAId,
        currentPage.id,
        `ahp-price-${cityBId}`,
        0
      );
      setCriterionFieldValue(
        cityBId,
        currentPage.id,
        `ahp-price-${cityAId}`,
        0
      );
      return;
    }

    const roundedValue = Math.round(value * 100) / 100;
    setCriterionFieldValue(
      cityAId,
      currentPage.id,
      `ahp-price-${cityBId}`,
      roundedValue
    );

    const reciprocalValue = Math.round((1 / roundedValue) * 100) / 100;
    setCriterionFieldValue(
      cityBId,
      currentPage.id,
      `ahp-price-${cityAId}`,
      reciprocalValue
    );
  };

  const calculatePriceAhpMatrix = () => {
    const matrix: number[][] = [];
    const cityIds = project.cities.map((c) => c.id);

    project.cities.forEach((cityA, idxA) => {
      const row: number[] = [];
      project.cities.forEach((cityB, idxB) => {
        if (cityA.id === cityB.id) {
          row.push(1);
        } else {
          const isUpperTriangle = idxA < idxB;
          const value = getPriceAhpValue(cityA.id, cityB.id);

          if (value !== null && value !== undefined) {
            row.push(value);
          } else if (!isUpperTriangle) {
            const reverseValue = getPriceAhpValue(cityB.id, cityA.id);
            if (reverseValue !== null && reverseValue > 0) {
              row.push(1 / reverseValue);
            } else {
              row.push(1);
            }
          } else {
            row.push(1);
          }
        }
      });
      matrix.push(row);
    });

    return { matrix, cityIds };
  };

  const calculatePricePriorities = () => {
    const { matrix, cityIds } = calculatePriceAhpMatrix();

    if (matrix.length === 0) {
      return {};
    }

    const n = matrix.length;

    const columnSums: number[] = new Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        columnSums[j] += matrix[i][j];
      }
    }

    const normalizedMatrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      normalizedMatrix.push([]);
      for (let j = 0; j < n; j++) {
        normalizedMatrix[i][j] =
          columnSums[j] > 0 ? matrix[i][j] / columnSums[j] : 0;
      }
    }

    const priorities: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += normalizedMatrix[i][j];
      }
      priorities[cityIds[i]] = sum / n;
    }

    return { priorities, normalizedMatrix, matrix, cityIds };
  };

  const calculateConsistencyMetrics = () => {
    const { matrix, cityIds } = calculatePriceAhpMatrix();
    const { priorities } = calculatePricePriorities();

    if (matrix.length === 0 || !priorities) {
      return {
        lambda: 0,
        CI: 0,
        RI: 0,
        CR: 0,
        weightedMatrix: [],
        weightedSums: [],
      };
    }

    const n = matrix.length;

    const weightedMatrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      weightedMatrix.push([]);
      for (let j = 0; j < n; j++) {
        const priority = priorities[cityIds[j]] || 0;
        weightedMatrix[i][j] = matrix[i][j] * priority;
      }
    }

    const weightedSums: number[] = [];
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += weightedMatrix[i][j];
      }
      const priority = priorities[cityIds[i]] || 0;
      weightedSums.push(priority > 0 ? sum / priority : 0);
    }

    let lambda = 0;
    for (let i = 0; i < n; i++) {
      lambda += weightedSums[i];
    }
    lambda = lambda / n;

    const CI = (lambda - n) / (n - 1);

    const RITable: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0.58,
      4: 0.9,
      5: 1.12,
      6: 1.24,
      7: 1.32,
      8: 1.41,
      9: 1.45,
      10: 1.49,
    };

    const RI = RITable[n] || 1.12;
    const CR = RI > 0 ? CI / RI : 0;

    return { lambda, CI, RI, CR, weightedMatrix, weightedSums };
  };

  const getLogisticsScore = (cityId: string): number => {
    const key = `${cityId}-${currentPage.id}`;
    const fieldValues = project.criterionFieldValues?.[key];
    const value = fieldValues?.["score"];
    return typeof value === "number" ? value : 0;
  };

  const setLogisticsScore = (cityId: string, score: number) => {
    const key = `${cityId}-${currentPage.id}`;
    setCriterionFieldValue(cityId, currentPage.id, "score", score);
  };

  const getScoreLabel = (score: number): string => {
    const labels: Record<number, string> = {
      1: "Péssimo",
      2: "Ruim",
      3: "Regular",
      4: "Muito bom",
      5: "Excelente",
    };
    return labels[score] || "";
  };

  const getScoreDescription = (score: number): string => {
    const descriptions: Record<number, string> = {
      1: "Acesso precário e alta taxa de roubos.",
      2: "Trânsito severo (gargalo constante) ou área de risco.",
      3: "Obras na pista ou acesso via urbana.",
      4: "Boa infraestrutura com gargalos pontuais.",
      5: "Acesso duplicado/direto e baixo risco.",
    };
    return descriptions[score] || "";
  };

  const getScoreColor = (score: number): string => {
    const colors: Record<number, string> = {
      1: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700",
      2: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700",
      3: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700",
      4: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700",
      5: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700",
    };
    return (
      colors[score] ||
      "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
    );
  };

  const getDistance = (cityId: string, portId: string): number => {
    const key = `${cityId}-${currentPage.id}`;
    const fieldValues = project.criterionFieldValues?.[key];
    const value = fieldValues?.[`distance-${portId}`];
    return typeof value === "number" ? value : 0;
  };

  const setDistance = (cityId: string, portId: string, distance: number) => {
    const key = `${cityId}-${currentPage.id}`;
    setCriterionFieldValue(
      cityId,
      currentPage.id,
      `distance-${portId}`,
      distance
    );
  };

  const getAhpValue = (
    cityAId: string,
    cityBId: string,
    portId: string
  ): number => {
    const key = `${cityAId}-${currentPage.id}`;
    const fieldValues = project.criterionFieldValues?.[key];
    const value = fieldValues?.[`ahp-${portId}-${cityBId}`];
    return typeof value === "number" ? value : 0;
  };

  const setAhpValue = (
    cityAId: string,
    cityBId: string,
    portId: string,
    value: number
  ) => {
    const key = `${cityAId}-${currentPage.id}`;
    setCriterionFieldValue(
      cityAId,
      currentPage.id,
      `ahp-${portId}-${cityBId}`,
      value
    );
  };

  const calculatePriorityFromDistance = (
    portId: string
  ): Record<string, number> => {
    const matrix: number[][] = [];
    const cityIds = project.cities.map((c) => c.id);

    project.cities.forEach((cityA) => {
      const row: number[] = [];
      project.cities.forEach((cityB) => {
        if (cityA.id === cityB.id) {
          row.push(1);
        } else {
          let value = getAhpValue(cityA.id, cityB.id, portId);

          if (value === 0) {
            const distanceA = getDistance(cityA.id, portId);
            const distanceB = getDistance(cityB.id, portId);
            if (distanceA > 0 && distanceB > 0) {
              value = distanceB / distanceA;
              if (value > 9) value = 9;
              if (value < 1 / 9) value = 1 / 9;
            } else {
              value = 1;
            }
          }

          row.push(value);
        }
      });
      matrix.push(row);
    });

    if (matrix.length === 0) {
      return {};
    }

    const n = matrix.length;
    const columnSums: number[] = new Array(n).fill(0);

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        columnSums[j] += matrix[i][j];
      }
    }

    const normalizedMatrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      normalizedMatrix.push([]);
      for (let j = 0; j < n; j++) {
        normalizedMatrix[i][j] = matrix[i][j] / columnSums[j];
      }
    }

    const priorities: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const rowSum = normalizedMatrix[i].reduce((sum, val) => sum + val, 0);
      priorities[cityIds[i]] = rowSum / n;
    }

    return priorities;
  };

  const handleNext = () => {
    if (pageIndex < DATA_PAGES.length - 1) {
      navigate(`/data-entry?page=${pageIndex + 1}`);
    }
  };

  const handlePrevious = () => {
    if (pageIndex > 0) {
      navigate(`/data-entry?page=${pageIndex - 1}`);
    } else {
      navigate("/matrix");
    }
  };

  const handleFinish = async () => {
    if (project.criteria.length === 0 || project.cities.length === 0) {
      alert("Erro: Defina pelo menos 2 opções e 2 critérios.");
      return;
    }

    const evaluationValues: Record<string, number> = {};
    const updatedFieldValues = { ...project.criterionFieldValues };

    project.cities.forEach((city) => {
      project.criteria.forEach((crit) => {
        const key = `${city.id}-${crit.id}`;

        if (currentPage.type === "price") {
          const warehouses = warehousesByCity[city.id] || [];
          const averages = calculateCityAverages(city.id);

          const priceCriterion = project.criteria.find(
            (c) =>
              c.name.toLowerCase().includes("preço") ||
              c.name.toLowerCase().includes("preco") ||
              c.name.toLowerCase().includes("custo")
          );

          if (priceCriterion && crit.id === priceCriterion.id) {
            const { priorities } = calculatePricePriorities();
            const priority = priorities?.[city.id] || 0;
            evaluationValues[key] =
              priority > 0 ? priority : averages.pricePerM2;
            const cityKey = `${city.id}-${currentPage.id}`;
            if (!updatedFieldValues[cityKey]) {
              updatedFieldValues[cityKey] = {};
            }

            project.cities.forEach((otherCity) => {
              if (city.id !== otherCity.id) {
                const ahpValue = getPriceAhpValue(city.id, otherCity.id);
                if (ahpValue !== null && ahpValue > 0) {
                  updatedFieldValues[cityKey][`ahp-price-${otherCity.id}`] =
                    ahpValue;
                }
              }
            });
            updatedFieldValues[cityKey]["average-aluguel"] = averages.aluguel;
            updatedFieldValues[cityKey]["average-m2"] = averages.m2;
            updatedFieldValues[cityKey]["average-pricePerM2"] =
              averages.pricePerM2;
          }
        } else if (currentPage.type === "score") {
          const score = getLogisticsScore(city.id);

          const logisticsCriterion = project.criteria.find(
            (c) =>
              c.name.toLowerCase().includes("logística") ||
              c.name.toLowerCase().includes("logistica") ||
              c.name.toLowerCase().includes("segurança") ||
              c.name.toLowerCase().includes("seguranca")
          );

          if (logisticsCriterion && crit.id === logisticsCriterion.id) {
            evaluationValues[key] = score;
            const cityKey = `${city.id}-${currentPage.id}`;
            if (!updatedFieldValues[cityKey]) {
              updatedFieldValues[cityKey] = {};
            }
            updatedFieldValues[cityKey]["score"] = score;
          }
        } else if (currentPage.type === "distance") {
          const distanceCriterion = project.criteria.find(
            (c) =>
              c.name.toLowerCase().includes("distância") ||
              c.name.toLowerCase().includes("distancia") ||
              c.name.toLowerCase().includes("porto")
          );

          if (distanceCriterion && crit.id === distanceCriterion.id) {
            ports.forEach((port) => {
              const priorities = calculatePriorityFromDistance(port.id);
              const priority = priorities[city.id] || 0;

              const cityKey = `${city.id}-${currentPage.id}`;
              if (!updatedFieldValues[cityKey]) {
                updatedFieldValues[cityKey] = {};
              }

              const distance = getDistance(city.id, port.id);
              updatedFieldValues[cityKey][`distance-${port.id}`] = distance;
              updatedFieldValues[cityKey][`priority-${port.id}`] = priority;

              project.cities.forEach((otherCity) => {
                if (city.id !== otherCity.id) {
                  const ahpValue = getAhpValue(city.id, otherCity.id, port.id);
                  if (ahpValue > 0) {
                    updatedFieldValues[cityKey][
                      `ahp-${port.id}-${otherCity.id}`
                    ] = ahpValue;
                  }
                }
              });
            });

            const mainPriorities = calculatePriorityFromDistance(ports[0].id);
            const mainPriority = mainPriorities[city.id] || 0;
            evaluationValues[key] = mainPriority;
          }
        }
      });
    });

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
            evaluationValues,
            criteriaConfig: project.criteriaConfig,
            criterionFieldValues: updatedFieldValues,
          },
        });
      } else {
        data = await createProject.mutateAsync({
          ...project,
          evaluationValues,
          criterionFieldValues: updatedFieldValues,
        });
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

  const isLastPage = pageIndex === DATA_PAGES.length - 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col py-6 px-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-200/20 dark:bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 px-2">
          <button
            onClick={handlePrevious}
            className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
          >
            &larr; Voltar
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Página {pageIndex + 1} de {DATA_PAGES.length}
            </span>
            <span className="text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
              {currentPage.name}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              {project.title || "Projeto sem nome"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {currentPage.type === "score"
                ? "Avalie cada cidade com uma nota de 1 a 5 conforme a legenda abaixo."
                : currentPage.type === "distance"
                ? "Preencha os dados de distância até o porto para cada cidade."
                : "Preencha os dados para cada cidade. O preço por m² será calculado automaticamente."}
            </p>
            {currentPage.type === "score" && (
              <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Legenda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <div
                      key={score}
                      className={`p-3 rounded-lg border-2 ${getScoreColor(
                        score
                      )}`}
                    >
                      <div className="font-bold text-lg mb-1">
                        {score} - {getScoreLabel(score)}
                      </div>
                      <div className="text-xs">
                        {getScoreDescription(score)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {project.cities.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Adicione pelo menos 2 cidades para continuar.
                </p>
                <button
                  onClick={() => navigate("/setup")}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  Voltar para setup
                </button>
              </div>
            </div>
          ) : currentPage.type === "distance" ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Distâncias (km)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-950/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20">
                          Cidades
                        </th>
                        {ports.map((port) => (
                          <th
                            key={port.id}
                            className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20"
                          >
                            {port.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {project.cities.map((city, idx) => (
                        <tr
                          key={city.id}
                          className={`border-b border-slate-200 dark:border-slate-800 ${
                            idx % 2 === 0
                              ? "bg-white dark:bg-slate-900"
                              : "bg-slate-50/50 dark:bg-slate-900/50"
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                            {city.name}
                          </td>
                          {ports.map((port) => {
                            const distance = getDistance(city.id, port.id);
                            return (
                              <td
                                key={port.id}
                                className="px-4 py-3 border-r border-slate-200 dark:border-slate-800"
                              >
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder="0.0"
                                  className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center text-sm"
                                  value={distance > 0 ? distance : ""}
                                  onChange={(e) => {
                                    const value =
                                      parseFloat(e.target.value) || 0;
                                    setDistance(city.id, port.id, value);
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Matriz de Comparação AHP - {selectedPort.name}
                  </h2>
                  <div className="flex gap-2">
                    {ports.map((port, idx) => (
                      <button
                        key={port.id}
                        onClick={() => setSelectedPortIndex(idx)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          idx === selectedPortIndex
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                        }`}
                      >
                        {port.name}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Compare as cidades baseado na distância até o porto. Menor
                  distância = maior prioridade.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-950/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20 sticky left-0 z-10">
                          Cidades
                        </th>
                        {project.cities.map((city) => (
                          <th
                            key={city.id}
                            className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20 min-w-[120px]"
                          >
                            {city.name}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 bg-orange-100 dark:bg-orange-900/20">
                          Prioridades
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.cities.map((cityA, idxA) => {
                        const priorities = calculatePriorityFromDistance(
                          selectedPort.id
                        );
                        const priority = priorities[cityA.id] || 0;

                        return (
                          <tr
                            key={cityA.id}
                            className={`border-b border-slate-200 dark:border-slate-800 ${
                              idxA % 2 === 0
                                ? "bg-white dark:bg-slate-900"
                                : "bg-slate-50/50 dark:bg-slate-900/50"
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-inherit z-10">
                              {cityA.name}
                            </td>
                            {project.cities.map((cityB) => {
                              if (cityA.id === cityB.id) {
                                return (
                                  <td
                                    key={cityB.id}
                                    className="px-4 py-3 text-center bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800"
                                  >
                                    1
                                  </td>
                                );
                              }

                              const savedAhpValue = getAhpValue(
                                cityA.id,
                                cityB.id,
                                selectedPort.id
                              );
                              const distanceA = getDistance(
                                cityA.id,
                                selectedPort.id
                              );
                              const distanceB = getDistance(
                                cityB.id,
                                selectedPort.id
                              );

                              let ahpValue = savedAhpValue;

                              if (
                                ahpValue === 0 &&
                                distanceA > 0 &&
                                distanceB > 0
                              ) {
                                ahpValue = distanceB / distanceA;
                                if (ahpValue > 9) ahpValue = 9;
                                if (ahpValue < 1 / 9) ahpValue = 1 / 9;
                              }

                              return (
                                <td
                                  key={cityB.id}
                                  className="px-4 py-3 border-r border-slate-200 dark:border-slate-800"
                                >
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0"
                                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center text-sm"
                                    value={
                                      ahpValue > 0 ? ahpValue.toFixed(3) : ""
                                    }
                                    onChange={(e) => {
                                      const value =
                                        parseFloat(e.target.value) || 0;
                                      setAhpValue(
                                        cityA.id,
                                        cityB.id,
                                        selectedPort.id,
                                        value
                                      );
                                    }}
                                  />
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20">
                              {priority > 0 ? priority.toFixed(3) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : currentPage.type === "score" ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-950/50 sticky top-0 z-20">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20 min-w-[200px]">
                        Cidade
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20 min-w-[150px]">
                        Nota
                      </th>
                      <th className="px-6 py-4 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20">
                        Avaliação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.cities.map((city, idx) => {
                      const score = getLogisticsScore(city.id);
                      return (
                        <tr
                          key={city.id}
                          className={`border-b border-slate-200 dark:border-slate-800 ${
                            idx % 2 === 0
                              ? "bg-white dark:bg-slate-900"
                              : "bg-slate-50/50 dark:bg-slate-900/50"
                          }`}
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                            {city.name}
                          </td>
                          <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-800">
                            <div className="flex justify-center">
                              <select
                                value={score || ""}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  setLogisticsScore(city.id, value);
                                }}
                                className={`p-3 rounded-lg border-2 font-bold text-center text-lg min-w-[100px] focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${
                                  score > 0
                                    ? getScoreColor(score)
                                    : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                                }`}
                              >
                                <option value="">Selecione</option>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {score > 0 ? (
                              <div
                                className={`p-3 rounded-lg border-2 ${getScoreColor(
                                  score
                                )}`}
                              >
                                <div className="font-bold text-base mb-1">
                                  {score} - {getScoreLabel(score)}
                                </div>
                                <div className="text-sm">
                                  {getScoreDescription(score)}
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-400 dark:text-slate-500 text-sm">
                                Selecione uma nota
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {project.cities.map((city) => {
                const warehouses = warehousesByCity[city.id] || [];
                const averages = calculateCityAverages(city.id);

                return (
                  <div
                    key={city.id}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {city.name}
                      </h2>
                      <button
                        onClick={() => addWarehouse(city.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Adicionar Galpão
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-950/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20">
                              Galpão
                            </th>
                            <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20">
                              Aluguel (R$)
                            </th>
                            <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20">
                              m²
                            </th>
                            <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-orange-100 dark:bg-orange-900/20">
                              Preço/m² (R$)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {warehouses.map((warehouse, idx) => {
                            const aluguel = getFieldValue(
                              city.id,
                              warehouse.id,
                              "aluguel"
                            );
                            const m2 = getFieldValue(
                              city.id,
                              warehouse.id,
                              "m2"
                            );
                            const pricePerM2 = calculatePricePerM2(
                              city.id,
                              warehouse.id
                            );

                            return (
                              <tr
                                key={warehouse.id}
                                className={`border-b border-slate-200 dark:border-slate-800 ${
                                  idx % 2 === 0
                                    ? "bg-white dark:bg-slate-900"
                                    : "bg-slate-50/50 dark:bg-slate-900/50"
                                }`}
                              >
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                                  {warehouse.name}
                                </td>
                                <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center text-sm"
                                    value={aluguel > 0 ? aluguel : ""}
                                    onChange={(e) => {
                                      const value =
                                        parseFloat(e.target.value) || 0;
                                      setFieldValue(
                                        city.id,
                                        warehouse.id,
                                        "aluguel",
                                        value
                                      );
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0"
                                    className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center text-sm"
                                    value={m2 > 0 ? m2 : ""}
                                    onChange={(e) => {
                                      const value =
                                        parseFloat(e.target.value) || 0;
                                      setFieldValue(
                                        city.id,
                                        warehouse.id,
                                        "m2",
                                        value
                                      );
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                  <div className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 text-center text-sm font-mono">
                                    {pricePerM2 > 0
                                      ? pricePerM2.toFixed(2)
                                      : "-"}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-orange-100 dark:bg-orange-900/30 font-bold border-t-2 border-orange-500">
                            <td className="px-4 py-3 text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                              Média
                            </td>
                            <td className="px-4 py-3 text-center text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                              {averages.aluguel > 0
                                ? averages.aluguel.toFixed(2)
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                              {averages.m2 > 0 ? averages.m2.toFixed(2) : "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                              {averages.pricePerM2 > 0
                                ? averages.pricePerM2.toFixed(2)
                                : "-"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {currentPage.type === "price" && (
                <>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                      Matriz de Comparação AHP - Preço por m²
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Preencha a matriz AHP manualmente usando a escala Saaty
                      (1/9 a 9). Compare as cidades baseado no preço por m².
                      Menor preço = maior prioridade.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-950/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-100 dark:bg-blue-900/20 sticky left-0 z-10">
                              Preço m²
                            </th>
                            {project.cities.map((city) => (
                              <th
                                key={city.id}
                                className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-100 dark:bg-blue-900/20 min-w-[120px]"
                              >
                                {city.name}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 bg-pink-100 dark:bg-pink-900/20 min-w-[120px]">
                              Prioridades
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.cities.map((cityA, idxA) => {
                            const { priorities } = calculatePricePriorities();
                            const priority = priorities?.[cityA.id] || 0;

                            const allPriorities = Object.values(
                              priorities || {}
                            );
                            const maxPriority =
                              allPriorities.length > 0
                                ? Math.max(...allPriorities)
                                : 0;
                            const isMaxPriority =
                              priority === maxPriority && priority > 0;

                            return (
                              <tr
                                key={cityA.id}
                                className={`border-b border-slate-200 dark:border-slate-800 ${
                                  idxA % 2 === 0
                                    ? "bg-white dark:bg-slate-900"
                                    : "bg-slate-50/50 dark:bg-slate-900/50"
                                }`}
                              >
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-inherit z-10">
                                  {cityA.name}
                                </td>
                                {project.cities.map((cityB, idxB) => {
                                  if (cityA.id === cityB.id) {
                                    return (
                                      <td
                                        key={cityB.id}
                                        className="px-4 py-3 text-center bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800 font-bold"
                                      >
                                        1
                                      </td>
                                    );
                                  }

                                  const isLowerTriangle = idxA > idxB;
                                  const savedAhpValue = getPriceAhpValue(
                                    cityA.id,
                                    cityB.id
                                  );
                                  const displayValue =
                                    savedAhpValue !== null
                                      ? savedAhpValue
                                      : null;

                                  const inputKey = `${cityA.id}-${cityB.id}`;
                                  const localInputValue = inputValues[inputKey];
                                  const inputDisplayValue =
                                    localInputValue !== undefined
                                      ? localInputValue
                                      : displayValue !== null &&
                                        displayValue > 0
                                      ? displayValue.toFixed(2)
                                      : "";

                                  if (isLowerTriangle) {
                                    return (
                                      <td
                                        key={cityB.id}
                                        className="px-4 py-3 border-r border-slate-200 dark:border-slate-800"
                                      >
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder="1"
                                          className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center text-sm"
                                          value={inputDisplayValue}
                                          onChange={(e) => {
                                            const inputValue = e.target.value;

                                            if (inputValue === "") {
                                              setInputValues((prev) => ({
                                                ...prev,
                                                [inputKey]: "",
                                              }));
                                              return;
                                            }

                                            const regex = /^\d*\.?\d{0,2}$/;
                                            if (regex.test(inputValue)) {
                                              setInputValues((prev) => ({
                                                ...prev,
                                                [inputKey]: inputValue,
                                              }));
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const inputValue =
                                              e.target.value.trim();

                                            setInputValues((prev) => {
                                              const newValues = { ...prev };
                                              delete newValues[inputKey];
                                              return newValues;
                                            });

                                            if (
                                              inputValue === "" ||
                                              inputValue === "." ||
                                              inputValue === "-"
                                            ) {
                                              setPriceAhpValue(
                                                cityA.id,
                                                cityB.id,
                                                0
                                              );
                                              return;
                                            }

                                            const numValue =
                                              parseFloat(inputValue);

                                            if (
                                              !isNaN(numValue) &&
                                              numValue >= 0.01 &&
                                              numValue <= 9
                                            ) {
                                              const rounded =
                                                Math.round(numValue * 100) /
                                                100;
                                              setPriceAhpValue(
                                                cityA.id,
                                                cityB.id,
                                                rounded
                                              );
                                            } else {
                                              setPriceAhpValue(
                                                cityA.id,
                                                cityB.id,
                                                0
                                              );
                                            }
                                          }}
                                          onFocus={(e) => {
                                            if (
                                              displayValue !== null &&
                                              displayValue > 0
                                            ) {
                                              setInputValues((prev) => ({
                                                ...prev,
                                                [inputKey]:
                                                  displayValue.toFixed(2),
                                              }));
                                            }
                                          }}
                                        />
                                      </td>
                                    );
                                  }

                                  return (
                                    <td
                                      key={cityB.id}
                                      className="px-4 py-3 border-r border-slate-200 dark:border-slate-800"
                                    >
                                      <input
                                        type="text"
                                        readOnly
                                        className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 text-center text-sm font-mono cursor-not-allowed"
                                        value={
                                          displayValue !== null &&
                                          displayValue > 0
                                            ? displayValue.toFixed(2)
                                            : "-"
                                        }
                                      />
                                    </td>
                                  );
                                })}
                                <td
                                  className={`px-4 py-3 text-center font-bold ${
                                    isMaxPriority
                                      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30"
                                      : "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20"
                                  }`}
                                >
                                  {priority > 0 ? priority.toFixed(3) : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                      Pelo Cálculo da Consistência, temos:
                    </h2>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-950/50">
                          <tr>
                            <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-100 dark:bg-blue-900/20">
                              Cidades
                            </th>
                            {project.cities.map((city) => (
                              <th
                                key={city.id}
                                className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-100 dark:bg-blue-900/20"
                              >
                                {city.name}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 bg-blue-100 dark:bg-blue-900/20">
                              Soma
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const { weightedMatrix, weightedSums } =
                              calculateConsistencyMetrics();
                            const { priorities, matrix } =
                              calculatePricePriorities();
                            return project.cities.map((city, idx) => {
                              const row = weightedMatrix?.[idx] || [];
                              const priority = priorities?.[city.id] || 0;

                              let rowSum = 0;
                              for (let j = 0; j < row.length; j++) {
                                rowSum += row[j];
                              }

                              const sumDividedByPriority =
                                priority > 0 ? rowSum / priority : 0;

                              return (
                                <tr
                                  key={city.id}
                                  className={`border-b border-slate-200 dark:border-slate-800 ${
                                    idx % 2 === 0
                                      ? "bg-white dark:bg-slate-900"
                                      : "bg-slate-50/50 dark:bg-slate-900/50"
                                  }`}
                                >
                                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                                    {city.name}
                                  </td>
                                  {row.map((value, colIdx) => {
                                    return (
                                      <td
                                        key={colIdx}
                                        className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800"
                                      >
                                        {value > 0 ? value.toFixed(3) : "-"}
                                      </td>
                                    );
                                  })}
                                  <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                                    {sumDividedByPriority > 0
                                      ? sumDividedByPriority.toFixed(3)
                                      : "-"}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                            λ (Lambda)
                          </div>
                          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            {calculateConsistencyMetrics().lambda > 0
                              ? calculateConsistencyMetrics().lambda.toFixed(4)
                              : "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                            CI
                          </div>
                          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            {calculateConsistencyMetrics().CI > 0
                              ? calculateConsistencyMetrics().CI.toFixed(4)
                              : "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                            RI (para {project.cities.length}x
                            {project.cities.length})
                          </div>
                          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            {calculateConsistencyMetrics().RI > 0
                              ? calculateConsistencyMetrics().RI.toFixed(4)
                              : "-"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                            CR
                          </div>
                          <div
                            className={`text-lg font-bold ${
                              calculateConsistencyMetrics().CR < 0.1
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {calculateConsistencyMetrics().CR > 0
                              ? calculateConsistencyMetrics().CR.toFixed(4)
                              : "-"}
                            {calculateConsistencyMetrics().CR > 0 &&
                              calculateConsistencyMetrics().CR < 0.1 && (
                                <span className="ml-2 text-xs">✓ CORRETO</span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Página {pageIndex + 1} de {DATA_PAGES.length} - {currentPage.name}
            </div>
            <div className="flex gap-3">
              {!isLastPage ? (
                <button
                  onClick={handleNext}
                  className="bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-base px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-0.5"
                >
                  Próxima Página →
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={createProject.isPending || updateProject.isPending}
                  className="bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-lg px-10 py-3 rounded-xl font-bold transition-all shadow-xl hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                >
                  {createProject.isPending || updateProject.isPending
                    ? "Calculando..."
                    : editingProjectId
                    ? "Atualizar e Calcular"
                    : "Calcular Resultado"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

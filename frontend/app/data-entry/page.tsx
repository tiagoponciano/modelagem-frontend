"use client";

import { useDecisionStore } from "../../store/useDecisionStore";
import { ThemeToggle } from "../../components/ThemeToggle";
import { useNavigation } from "../../hooks/useNavigation";
import {
  useCreateProject,
  useUpdateProject,
  useSaveDraft,
  useUpdateDraft,
} from "../../hooks/useProjects";
import {
  useState,
  useMemo,
  useEffect,
  Suspense,
  useRef,
  useCallback,
} from "react";
import { useSearchParams } from "next/navigation";
import { API_ENDPOINTS } from "../../lib/constants";

interface Warehouse {
  id: string;
  name: string;
}

interface Port {
  id: string;
  name: string;
}

const DATA_PAGES = [
  {
    id: "criteria-priorities",
    name: "Prioridades dos Critérios",
    type: "criteria-priorities",
  },
  {
    id: "decision-final",
    name: "Decisão Final",
    type: "decision-final",
  },
];

function DataEntryPageContent() {
  const searchParams = useSearchParams();
  const { navigate } = useNavigation();
  const {
    project,
    editingProjectId,
    setEditingProjectId,
    setCriterionFieldValue,
    setCriteriaJudgment,
    addSubCriterion,
    removeSubCriterion,
  } = useDecisionStore();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const saveDraft = useSaveDraft();
  const updateDraft = useUpdateDraft();

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>("");

  const pageParam = searchParams.get("page");
  const criterionIdParam = searchParams.get("criterion");

  const pageIndex = pageParam ? Math.max(0, parseInt(pageParam, 10)) : 0;

  const totalPages = 2 + project.criteria.length;

  const isDecisionPage = pageIndex === totalPages - 1;
  const criterionPageIndex =
    pageIndex > 0 && !isDecisionPage ? pageIndex - 1 : -1;
  const currentCriterionByIndex =
    criterionPageIndex >= 0 && criterionPageIndex < project.criteria.length
      ? project.criteria[criterionPageIndex]
      : null;

  const currentPage =
    pageIndex === 0
      ? DATA_PAGES[0]
      : isDecisionPage
      ? DATA_PAGES[1]
      : {
          id: currentCriterionByIndex?.id || "criterion-page",
          name: currentCriterionByIndex?.name || "Critério",
          type: "criterion",
        };

  const currentCriterion = criterionIdParam
    ? project.criteria.find((c) => c.id === criterionIdParam)
    : null;

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

  const [calculationResults, setCalculationResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateInRealTime = async () => {
    if (project.criteria.length < 2 || project.cities.length < 2) {
      return;
    }

    setIsCalculating(true);
    try {
      const response = await fetch(API_ENDPOINTS.CALCULATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title,
          cities: project.cities,
          criteria: project.criteria,
          subCriteria: project.subCriteria || [],
          criteriaMatrix: project.criteriaMatrix,
          criterionFieldValues: project.criterionFieldValues || {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Dados recebidos do backend:", data);
        const results = data?.results || data?.calculationResults || data;
        setCalculationResults(results);
      } else {
        console.error(
          "Erro na resposta:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Erro detalhado:", errorText);
      }
    } catch (error) {
      console.error("Erro ao calcular:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(project.criteriaMatrix || {}).length > 0) {
        calculateInRealTime();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    project.criteriaMatrix,
    project.criteria,
    project.cities,
    project.subCriteria,
    project.criterionFieldValues,
  ]);

  const autoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const dataToSave = {
          title: project.title,
          cities: project.cities,
          criteria: project.criteria,
          subCriteria: project.subCriteria || [],
          criteriaMatrix: project.criteriaMatrix || {},
          evaluationValues: project.evaluationValues || {},
          criteriaConfig: project.criteriaConfig || {},
          criterionFieldValues: project.criterionFieldValues || {},
        };

        const dataString = JSON.stringify(dataToSave);

        if (dataString === lastSavedDataRef.current) {
          return;
        }

        if (
          !project.title ||
          project.cities.length === 0 ||
          project.criteria.length === 0
        ) {
          return;
        }

        if (editingProjectId) {
          await updateDraft.mutateAsync({
            id: editingProjectId,
            project: dataToSave,
          });
          lastSavedDataRef.current = dataString;
        } else {
          const savedProject = await saveDraft.mutateAsync(dataToSave);
          if (savedProject?.id) {
            setEditingProjectId(savedProject.id);
          }
          lastSavedDataRef.current = dataString;
        }
      } catch (error) {
        console.error("Erro ao salvar automaticamente:", error);
      }
    }, 2000);
  }, [
    project.title,
    project.cities,
    project.criteria,
    project.subCriteria,
    project.criteriaMatrix,
    project.evaluationValues,
    project.criteriaConfig,
    project.criterionFieldValues,
    editingProjectId,
    saveDraft,
    updateDraft,
  ]);

  useEffect(() => {
    autoSave();

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSave]);

  if (!currentPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Página não encontrada.
          </p>
          <button
            onClick={() => navigate("/criteria")}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            Voltar para critérios
          </button>
        </div>
      </div>
    );
  }

  const addWarehouse = () => {
    setWarehousesByCity((prev) => {
      const updated: Record<string, Warehouse[]> = {};

      project.cities.forEach((city) => {
        const cityWarehouses = prev[city.id] || [];
        const maxWarehouses = Math.max(
          ...project.cities.map((c) => (prev[c.id] || []).length),
          cityWarehouses.length
        );
        const newWarehouse: Warehouse = {
          id: crypto.randomUUID(),
          name: `Galpão ${maxWarehouses + 1}`,
        };
        updated[city.id] = [...cityWarehouses, newWarehouse];
      });

      return updated;
    });
  };

  const removeWarehouse = (cityId: string, warehouseId: string) => {
    setWarehousesByCity((prev) => {
      const cityWarehouses = prev[cityId] || [];
      const filtered = cityWarehouses.filter((w) => w.id !== warehouseId);

      const updated = { ...prev };
      updated[cityId] = filtered.map((w, idx) => ({
        ...w,
        name: `Galpão ${idx + 1}`,
      }));

      return updated;
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

  const getCriteriaAhpValue = (
    criterionAId: string,
    criterionBId: string
  ): number | null => {
    const key = `${criterionAId}-${criterionBId}`;
    const reverseKey = `${criterionBId}-${criterionAId}`;
    const value = project.criteriaMatrix[key];
    const reverseValue = project.criteriaMatrix[reverseKey];

    if (value !== undefined && value > 0) {
      return value;
    }
    if (reverseValue !== undefined && reverseValue > 0) {
      return 1 / reverseValue;
    }
    return null;
  };

  const setCriteriaAhpValue = (
    criterionAId: string,
    criterionBId: string,
    value: number
  ) => {
    if (criterionAId === criterionBId) return;

    if (value === 0 || isNaN(value)) {
      setCriteriaJudgment(criterionAId, criterionBId, 0);
      setCriteriaJudgment(criterionBId, criterionAId, 0);
      return;
    }

    const roundedValue = Math.round(value * 100) / 100;
    setCriteriaJudgment(criterionAId, criterionBId, roundedValue);

    const reciprocalValue = Math.round((1 / roundedValue) * 100) / 100;
    setCriteriaJudgment(criterionBId, criterionAId, reciprocalValue);
  };

  const getSubCriterionAhpValue = (
    subCriterionId: string,
    cityAId: string,
    cityBId: string
  ): number | null => {
    const key = `${subCriterionId}-${cityAId}-${cityBId}`;
    const reverseKey = `${subCriterionId}-${cityBId}-${cityAId}`;
    const value = project.criterionFieldValues?.[key]?.["ahp-value"];
    const reverseValue =
      project.criterionFieldValues?.[reverseKey]?.["ahp-value"];

    if (typeof value === "number" && value > 0) {
      return value;
    }
    if (typeof reverseValue === "number" && reverseValue > 0) {
      return 1 / reverseValue;
    }
    return null;
  };

  const setSubCriterionAhpValue = (
    subCriterionId: string,
    cityAId: string,
    cityBId: string,
    value: number
  ) => {
    if (cityAId === cityBId) return;

    const keyA = `${subCriterionId}-${cityAId}-${cityBId}`;
    const keyB = `${subCriterionId}-${cityBId}-${cityAId}`;

    if (value === 0 || isNaN(value)) {
      setCriterionFieldValue(keyA, "", "ahp-value", 0);
      setCriterionFieldValue(keyB, "", "ahp-value", 0);
      return;
    }

    const roundedValue = Math.round(value * 100) / 100;
    setCriterionFieldValue(keyA, "", "ahp-value", roundedValue);

    const reciprocalValue = Math.round((1 / roundedValue) * 100) / 100;
    setCriterionFieldValue(keyB, "", "ahp-value", reciprocalValue);
  };

  const getSubCriterionTitle = (subCriterionId: string): string => {
    const key = `title-${subCriterionId}`;
    const value = project.criterionFieldValues?.[key]?.["title"];
    return typeof value === "string" ? value : "";
  };

  const getSubCriterion = (subCriterionId: string) => {
    return (project.subCriteria || []).find((sc) => sc.id === subCriterionId);
  };

  const setSubCriterionTitle = (subCriterionId: string, title: string) => {
    const key = `title-${subCriterionId}`;
    setCriterionFieldValue(key, "title", "title", title);
  };

  const getSubWeightValue = (
    criterionId: string,
    subAId: string,
    subBId: string
  ): number | null => {
    const key = `${criterionId}-${subAId}-${subBId}`;
    const reverseKey = `${criterionId}-${subBId}-${subAId}`;
    const value = project.criterionFieldValues?.[key]?.["subw"];
    const reverseValue = project.criterionFieldValues?.[reverseKey]?.["subw"];
    if (typeof value === "number" && value > 0) return value;
    if (typeof reverseValue === "number" && reverseValue > 0)
      return 1 / reverseValue;
    return null;
  };

  const setSubWeightValue = (
    criterionId: string,
    subAId: string,
    subBId: string,
    value: number
  ) => {
    if (subAId === subBId) return;

    const keyA = `${criterionId}-${subAId}-${subBId}`;
    const keyB = `${criterionId}-${subBId}-${subAId}`;

    if (value === 0 || isNaN(value)) {
      setCriterionFieldValue(keyA, "", "subw", 0);
      setCriterionFieldValue(keyB, "", "subw", 0);
      return;
    }
    const rounded = Math.round(value * 100) / 100;
    setCriterionFieldValue(keyA, "", "subw", rounded);
    const reciprocal = Math.round((1 / rounded) * 100) / 100;
    setCriterionFieldValue(keyB, "", "subw", reciprocal);
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
    if (isDecisionPage) return;

    if (pageIndex === 0) {
      if (project.criteria.length > 0) {
        navigate(`/data-entry?page=1`);
      } else {
        alert("Adicione pelo menos um critério para continuar.");
        navigate("/criteria");
      }
      return;
    }

    const criterionIndex = pageIndex - 1;
    if (criterionIndex < project.criteria.length - 1) {
      navigate(`/data-entry?page=${pageIndex + 1}`);
      return;
    }

    navigate(`/data-entry?page=${totalPages - 1}`);
  };

  const handlePrevious = () => {
    if (pageIndex > 0) {
      navigate(`/data-entry?page=${pageIndex - 1}`);
    } else {
      navigate("/criteria");
    }
  };

  const isLastPage =
    project.criteria.length > 0
      ? pageIndex === totalPages - 1
      : pageIndex === 0;

  const handleFinish = async () => {
    if (project.criteria.length === 0 || project.cities.length === 0) {
      alert("Erro: Defina pelo menos 2 opções e 2 critérios.");
      return;
    }

    try {
      const completeProjectData = {
        title: project.title,
        cities: project.cities,
        criteria: project.criteria,
        subCriteria: project.subCriteria || [],
        criteriaMatrix: project.criteriaMatrix || {},
        evaluationValues: project.evaluationValues || {},
        criteriaConfig: project.criteriaConfig || {},
        criterionFieldValues: project.criterionFieldValues || {},
        status: "Concluído",
      };

      console.log("Dados completos sendo salvos:", {
        ...completeProjectData,
        criterionFieldValuesKeys: Object.keys(
          completeProjectData.criterionFieldValues
        ),
        criterionFieldValuesCount: Object.keys(
          completeProjectData.criterionFieldValues
        ).length,
        subCriteriaCount: completeProjectData.subCriteria.length,
      });

      let data;
      if (editingProjectId) {
        data = await updateProject.mutateAsync({
          id: editingProjectId,
          project: completeProjectData,
        });
      } else {
        data = await createProject.mutateAsync(completeProjectData);
      }

      console.log("Projeto salvo com sucesso:", {
        id: data.id,
        hasCriterionFieldValues: !!data.criterionFieldValues,
        criterionFieldValuesKeys: data.criterionFieldValues
          ? Object.keys(data.criterionFieldValues)
          : [],
        hasSubCriteria: !!data.subCriteria,
        subCriteriaCount: data.subCriteria?.length || 0,
      });

      navigate(`/results/${data.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Houve um erro ao salvar. Verifique o console do backend.";
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col py-6 px-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-200/20 dark:bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-6 right-6 z-[99999]">
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
              Página {pageIndex + 1} de {totalPages}
            </span>
            <span className="text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
              {currentCriterionByIndex
                ? currentCriterionByIndex.name
                : currentPage.name}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              {project.title || "Projeto sem nome"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {currentPage.type === "criteria-priorities"
                ? "Compare os critérios entre si usando a escala Saaty (1/9 a 9). Preencha a matriz AHP manualmente."
                : currentCriterionByIndex
                ? `Adicione subcritérios para ${currentCriterionByIndex.name} e preencha as matrizes AHP comparando as cidades.`
                : ""}
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

          {project.criteria.length < 2 ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  Adicione pelo menos 2 critérios para continuar.
                </p>
                <button
                  onClick={() => navigate("/criteria")}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  Voltar para critérios
                </button>
              </div>
            </div>
          ) : currentPage.type === "criteria-priorities" ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Matriz de Comparação AHP - Critérios
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Preencha a matriz AHP manualmente usando a escala Saaty (1/9 a
                  9). Compare os critérios entre si.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-950/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-100 dark:bg-blue-900/20 sticky left-0 z-10">
                          Critérios
                        </th>
                        {project.criteria.map((criterion) => (
                          <th
                            key={criterion.id}
                            className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-100 dark:bg-blue-900/20 min-w-[120px]"
                          >
                            {criterion.name}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 bg-pink-100 dark:bg-pink-900/20 min-w-[120px]">
                          Prioridades
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.criteria.map((criterionA, idxA) => {
                        const criteriaPriorities =
                          calculationResults?.criteriaPriorities?.priorities ||
                          {};
                        const priority = criteriaPriorities[criterionA.id] || 0;

                        const allPriorities = Object.values(
                          criteriaPriorities
                        ) as number[];
                        const maxPriority =
                          allPriorities.length > 0
                            ? Math.max(...allPriorities)
                            : 0;
                        const isMaxPriority =
                          priority === maxPriority && priority > 0;

                        return (
                          <tr
                            key={criterionA.id}
                            className={`border-b border-slate-200 dark:border-slate-800 ${
                              idxA % 2 === 0
                                ? "bg-white dark:bg-slate-900"
                                : "bg-slate-50/50 dark:bg-slate-900/50"
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-inherit z-10">
                              {criterionA.name}
                            </td>
                            {project.criteria.map((criterionB, idxB) => {
                              if (criterionA.id === criterionB.id) {
                                return (
                                  <td
                                    key={criterionB.id}
                                    className="px-4 py-3 text-center bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800 font-bold"
                                  >
                                    1
                                  </td>
                                );
                              }

                              const isLowerTriangle = idxA > idxB;
                              const savedAhpValue = getCriteriaAhpValue(
                                criterionA.id,
                                criterionB.id
                              );
                              const displayValue =
                                savedAhpValue !== null ? savedAhpValue : null;

                              const inputKey = `${criterionA.id}-${criterionB.id}`;
                              const localInputValue = inputValues[inputKey];
                              const inputDisplayValue =
                                localInputValue !== undefined
                                  ? localInputValue
                                  : displayValue !== null && displayValue > 0
                                  ? displayValue.toFixed(2)
                                  : "";

                              if (isLowerTriangle) {
                                return (
                                  <td
                                    key={criterionB.id}
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

                                        const regex =
                                          /^(0?\.?\d{0,2}|[1-9]\d*\.?\d{0,2})$/;
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
                                          setCriteriaAhpValue(
                                            criterionA.id,
                                            criterionB.id,
                                            0
                                          );
                                          return;
                                        }

                                        const numValue = parseFloat(inputValue);

                                        if (
                                          !isNaN(numValue) &&
                                          numValue >= 0.01 &&
                                          numValue <= 9
                                        ) {
                                          const rounded =
                                            Math.round(numValue * 100) / 100;
                                          setCriteriaAhpValue(
                                            criterionA.id,
                                            criterionB.id,
                                            rounded
                                          );
                                        } else {
                                          setCriteriaAhpValue(
                                            criterionA.id,
                                            criterionB.id,
                                            0
                                          );
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.currentTarget.blur();
                                        }
                                      }}
                                      onFocus={(e) => {
                                        if (
                                          displayValue !== null &&
                                          displayValue > 0
                                        ) {
                                          setInputValues((prev) => ({
                                            ...prev,
                                            [inputKey]: displayValue.toFixed(2),
                                          }));
                                        }
                                      }}
                                    />
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={criterionB.id}
                                  className="px-4 py-3 border-r border-slate-200 dark:border-slate-800"
                                >
                                  <input
                                    type="text"
                                    readOnly
                                    className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 text-center text-sm font-mono cursor-not-allowed"
                                    value={
                                      displayValue !== null && displayValue > 0
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
                          Critérios
                        </th>
                        {project.criteria.map((criterion) => (
                          <th
                            key={criterion.id}
                            className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-100 dark:bg-blue-900/20"
                          >
                            {criterion.name}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 bg-blue-100 dark:bg-blue-900/20">
                          Soma
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const consistency =
                          calculationResults?.criteriaConsistency;
                        const weightedMatrix =
                          consistency?.weightedMatrix || [];
                        const criteriaPriorities =
                          calculationResults?.criteriaPriorities?.priorities ||
                          {};

                        return project.criteria.map((criterion, idx) => {
                          const row = weightedMatrix[idx] || [];
                          const priority =
                            criteriaPriorities[criterion.id] || 0;

                          let rowSum = 0;
                          for (let j = 0; j < row.length; j++) {
                            rowSum += row[j];
                          }

                          const sumDividedByPriority =
                            priority > 0 ? rowSum / priority : 0;

                          return (
                            <tr
                              key={criterion.id}
                              className={`border-b border-slate-200 dark:border-slate-800 ${
                                idx % 2 === 0
                                  ? "bg-white dark:bg-slate-900"
                                  : "bg-slate-50/50 dark:bg-slate-900/50"
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                                {criterion.name}
                              </td>
                              {row.map((value: number, colIdx: number) => (
                                <td
                                  key={colIdx}
                                  className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800"
                                >
                                  {value > 0 ? value.toFixed(3) : "-"}
                                </td>
                              ))}
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
                        {(() => {
                          const consistency =
                            calculationResults?.criteriaConsistency;
                          return consistency && consistency.lambda > 0
                            ? consistency.lambda.toFixed(4)
                            : "-";
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                        CI
                      </div>
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        {(() => {
                          const consistency =
                            calculationResults?.criteriaConsistency;
                          return consistency && consistency.CI > 0
                            ? consistency.CI.toFixed(4)
                            : "-";
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                        RI
                      </div>
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        {(() => {
                          const consistency =
                            calculationResults?.criteriaConsistency;
                          return consistency && consistency.RI > 0
                            ? consistency.RI.toFixed(2)
                            : "-";
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                        CR
                      </div>
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        {(() => {
                          const consistency =
                            calculationResults?.criteriaConsistency;
                          return consistency && consistency.CR > 0
                            ? consistency.CR.toFixed(4)
                            : "-";
                        })()}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const consistency = calculationResults?.criteriaConsistency;
                    if (!consistency || !consistency.CR) return null;

                    if (consistency.CR > 0.1) {
                      return (
                        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                          <p className="text-sm font-bold text-red-800 dark:text-red-200">
                            ⚠️ Atenção: CR &gt; 0.1. A matriz pode ser
                            inconsistente.
                          </p>
                        </div>
                      );
                    }

                    if (consistency.CR > 0 && consistency.CR <= 0.1) {
                      return (
                        <div className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-lg">
                          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                            ✓ CR &lt; 0.1. Matriz consistente!
                          </p>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>
            </div>
          ) : isDecisionPage ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Decisão Final
                </h2>

                {project.criteria.length === 0 ||
                project.cities.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <p>
                      Adicione critérios e cidades para ver o resultado final.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto mb-8">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/30">
                              Prioridade de Critérios
                            </th>
                            {project.criteria.map((criterion) => {
                              const resultsData =
                                calculationResults?.results ||
                                calculationResults ||
                                {};
                              const criteriaWeights =
                                resultsData.criteriaWeights ||
                                calculationResults?.criteriaPriorities
                                  ?.priorities ||
                                {};

                              const weight =
                                typeof criteriaWeights[criterion.id] ===
                                "number"
                                  ? criteriaWeights[criterion.id]
                                  : 0;
                              return (
                                <th
                                  key={criterion.id}
                                  className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/30"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                      {weight > 0 ? weight.toFixed(3) : "-"}
                                    </span>
                                    <span className="text-sm font-semibold">
                                      {criterion.name}
                                    </span>
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {project.cities.map((city, idx) => {
                            const resultsTable =
                              calculationResults?.results?.table ||
                              calculationResults?.table ||
                              {};
                            const rawTable = resultsTable?.raw || {};
                            const cityScores = rawTable[city.id] || {};

                            const fallbackScores =
                              calculationResults?.cityCriterionScores?.[
                                city.id
                              ] || {};

                            return (
                              <tr
                                key={`${city.id}-top`}
                                className={`border-b border-slate-200 dark:border-slate-800 ${
                                  idx % 2 === 0
                                    ? "bg-white dark:bg-slate-900"
                                    : "bg-slate-50/50 dark:bg-slate-900/50"
                                }`}
                              >
                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/20">
                                  {city.name}
                                </td>
                                {project.criteria.map((criterion) => {
                                  const score =
                                    typeof cityScores[criterion.id] === "number"
                                      ? cityScores[criterion.id]
                                      : typeof fallbackScores[criterion.id] ===
                                        "number"
                                      ? fallbackScores[criterion.id]
                                      : 0;
                                  return (
                                    <td
                                      key={`${city.id}-${criterion.id}-topcell`}
                                      className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800"
                                    >
                                      {score > 0 ? score.toFixed(3) : "-"}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr>
                            <th
                              rowSpan={2}
                              className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/30"
                            >
                              Critérios Alternativas
                            </th>
                            {project.criteria.map((criterion) => (
                              <th
                                key={`${criterion.id}-name-bottom`}
                                rowSpan={2}
                                className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/30"
                              >
                                {criterion.name}
                              </th>
                            ))}
                            <th
                              rowSpan={2}
                              className="px-4 py-3 text-center font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30"
                            >
                              Decisão Final
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.cities.map((city, idx) => {
                            const resultsTable =
                              calculationResults?.results?.table ||
                              calculationResults?.table ||
                              {};

                            const resultsData =
                              calculationResults?.results ||
                              calculationResults ||
                              {};
                            const criteriaWeights =
                              resultsData.criteriaWeights ||
                              calculationResults?.criteriaPriorities
                                ?.priorities ||
                              {};

                            const rawTable = resultsTable?.raw || {};
                            const cityScores = rawTable[city.id] || {};
                            const fallbackScores =
                              calculationResults?.cityCriterionScores?.[
                                city.id
                              ] || {};

                            const weightedTable = resultsTable?.weighted || {};
                            const backendWeightedValues =
                              weightedTable[city.id] || {};

                            let finalDecisionSum = 0;
                            const weightedValues = project.criteria.map(
                              (criterion) => {
                                if (
                                  typeof backendWeightedValues[criterion.id] ===
                                  "number"
                                ) {
                                  const value =
                                    backendWeightedValues[criterion.id];
                                  finalDecisionSum += value;
                                  return value;
                                }

                                const criterionWeight =
                                  typeof criteriaWeights[criterion.id] ===
                                  "number"
                                    ? criteriaWeights[criterion.id]
                                    : 0;

                                const cityPriority =
                                  typeof cityScores[criterion.id] === "number"
                                    ? cityScores[criterion.id]
                                    : typeof fallbackScores[criterion.id] ===
                                      "number"
                                    ? fallbackScores[criterion.id]
                                    : 0;

                                const weightedValue =
                                  criterionWeight * cityPriority;
                                finalDecisionSum += weightedValue;

                                return weightedValue;
                              }
                            );

                            const finalScores = resultsTable?.finalScores || {};
                            const finalScoresPercent =
                              resultsTable?.finalScoresPercent || {};

                            let finalDecisionValue: string | null = null;

                            if (
                              typeof finalScoresPercent[city.id] === "string"
                            ) {
                              finalDecisionValue = finalScoresPercent[city.id];
                            } else if (
                              typeof finalScores[city.id] === "number"
                            ) {
                              finalDecisionValue = `${(
                                finalScores[city.id] * 100
                              ).toFixed(2)}%`;
                            } else if (finalDecisionSum > 0) {
                              finalDecisionValue = `${(
                                finalDecisionSum * 100
                              ).toFixed(2)}%`;
                            }

                            return (
                              <tr
                                key={`${city.id}-bottom`}
                                className={`border-b border-slate-200 dark:border-slate-800 ${
                                  idx % 2 === 0
                                    ? "bg-white dark:bg-slate-900"
                                    : "bg-slate-50/50 dark:bg-slate-900/50"
                                }`}
                              >
                                <td className="px-4 py-3 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/20">
                                  {city.name}
                                </td>
                                {project.criteria.map(
                                  (criterion, criterionIdx) => {
                                    const weightedValue =
                                      weightedValues[criterionIdx] || 0;
                                    return (
                                      <td
                                        key={`${city.id}-${criterion.id}-bottomcell`}
                                        className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800"
                                      >
                                        {weightedValue > 0
                                          ? weightedValue.toFixed(4)
                                          : "-"}
                                      </td>
                                    );
                                  }
                                )}
                                <td className="px-4 py-3 text-center font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30">
                                  {finalDecisionValue || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : currentCriterionByIndex ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {currentCriterionByIndex.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nome do subcritério"
                      className="px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          addSubCriterion(
                            currentCriterionByIndex.id,
                            e.currentTarget.value.trim()
                          );
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement;
                        if (input?.value.trim()) {
                          addSubCriterion(
                            currentCriterionByIndex.id,
                            input.value.trim()
                          );
                          input.value = "";
                        }
                      }}
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
                      Adicionar Subcritério
                    </button>
                  </div>
                </div>

                {(() => {
                  const subCriteria = (project.subCriteria || []).filter(
                    (sc) => sc.criterionId === currentCriterionByIndex.id
                  );

                  const renderSubWeights =
                    subCriteria.length >= 2 && project.cities.length > 0;

                  if (subCriteria.length === 0) {
                    return (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p>Nenhum subcritério adicionado ainda.</p>
                        <p className="text-sm mt-2">
                          Adicione um subcritério acima para começar.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-8">
                      {renderSubWeights && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                            Peso dos Subcritérios (AHP)
                          </h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead className="bg-slate-100 dark:bg-slate-950/50">
                                <tr>
                                  <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-100 dark:bg-blue-900/20 sticky left-0 z-10">
                                    Subcritérios
                                  </th>
                                  {subCriteria.map((sub) => (
                                    <th
                                      key={sub.id}
                                      className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-100 dark:bg-blue-900/20 min-w-[120px]"
                                    >
                                      {sub.name}
                                    </th>
                                  ))}
                                  <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 bg-pink-100 dark:bg-pink-900/20 min-w-[120px]">
                                    Prioridades
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {subCriteria.map((subA, idxA) => {
                                  const subWeightPriorities =
                                    calculationResults?.subWeightPriorities?.[
                                      currentCriterionByIndex.id
                                    ]?.priorities || {};
                                  const priority =
                                    subWeightPriorities[subA.id] || 0;

                                  const allP = Object.values(
                                    subWeightPriorities
                                  ) as number[];
                                  const maxP =
                                    allP.length > 0 ? Math.max(...allP) : 0;
                                  const isMax =
                                    priority === maxP && priority > 0;

                                  return (
                                    <tr
                                      key={subA.id}
                                      className={`border-b border-slate-200 dark:border-slate-800 ${
                                        idxA % 2 === 0
                                          ? "bg-white dark:bg-slate-900"
                                          : "bg-slate-50/50 dark:bg-slate-900/50"
                                      }`}
                                    >
                                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 sticky left-0 bg-inherit z-10">
                                        {subA.name}
                                      </td>
                                      {subCriteria.map((subB, idxB) => {
                                        if (subA.id === subB.id) {
                                          return (
                                            <td
                                              key={subB.id}
                                              className="px-4 py-3 text-center bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800 font-bold"
                                            >
                                              1
                                            </td>
                                          );
                                        }

                                        const isLower = idxA > idxB;
                                        if (!currentCriterionByIndex)
                                          return null;

                                        const criterionId = (
                                          currentCriterionByIndex as any
                                        )?.id;
                                        if (!criterionId) return null;

                                        const saved = getSubWeightValue(
                                          criterionId,
                                          subA.id,
                                          subB.id
                                        );
                                        const display =
                                          saved !== null ? saved : null;
                                        const inputKey = `${criterionId}-${subA.id}-${subB.id}-subw`;
                                        const localInput =
                                          inputValues[inputKey];
                                        const inputDisplay =
                                          localInput !== undefined
                                            ? localInput
                                            : display !== null && display > 0
                                            ? display.toFixed(2)
                                            : "";

                                        if (isLower) {
                                          return (
                                            <td
                                              key={subB.id}
                                              className="px-4 py-3 border-r border-slate-200 dark:border-slate-800"
                                            >
                                              <input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="1"
                                                className="w-full p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-center text-sm"
                                                value={inputDisplay}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === "") {
                                                    setInputValues((prev) => ({
                                                      ...prev,
                                                      [inputKey]: "",
                                                    }));
                                                    return;
                                                  }
                                                  const regex =
                                                    /^(0?\.?\d{0,2}|[1-9]\d*\.?\d{0,2})$/;
                                                  if (regex.test(val)) {
                                                    setInputValues((prev) => ({
                                                      ...prev,
                                                      [inputKey]: val,
                                                    }));
                                                  }
                                                }}
                                                onBlur={(e) => {
                                                  const v =
                                                    e.target.value.trim();
                                                  setInputValues((prev) => {
                                                    const nv = { ...prev };
                                                    delete nv[inputKey];
                                                    return nv;
                                                  });
                                                  if (
                                                    v === "" ||
                                                    v === "." ||
                                                    v === "-"
                                                  ) {
                                                    if (
                                                      currentCriterionByIndex
                                                    ) {
                                                      const criterionId = (
                                                        currentCriterionByIndex as any
                                                      )?.id;
                                                      if (criterionId) {
                                                        setSubWeightValue(
                                                          criterionId,
                                                          subA.id,
                                                          subB.id,
                                                          0
                                                        );
                                                      }
                                                    }
                                                    return;
                                                  }
                                                  const num = parseFloat(v);
                                                  if (
                                                    !isNaN(num) &&
                                                    num >= 0.01 &&
                                                    num <= 9
                                                  ) {
                                                    const rounded =
                                                      Math.round(num * 100) /
                                                      100;
                                                    if (
                                                      currentCriterionByIndex
                                                    ) {
                                                      const criterionId = (
                                                        currentCriterionByIndex as any
                                                      )?.id;
                                                      if (criterionId) {
                                                        setSubWeightValue(
                                                          criterionId,
                                                          subA.id,
                                                          subB.id,
                                                          rounded
                                                        );
                                                      }
                                                    }
                                                  } else {
                                                    if (
                                                      currentCriterionByIndex
                                                    ) {
                                                      const criterionId = (
                                                        currentCriterionByIndex as any
                                                      )?.id;
                                                      if (criterionId) {
                                                        setSubWeightValue(
                                                          criterionId,
                                                          subA.id,
                                                          subB.id,
                                                          0
                                                        );
                                                      }
                                                    }
                                                  }
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    e.currentTarget.blur();
                                                  }
                                                }}
                                                onFocus={() => {
                                                  if (
                                                    display !== null &&
                                                    display > 0
                                                  ) {
                                                    setInputValues((prev) => ({
                                                      ...prev,
                                                      [inputKey]:
                                                        display.toFixed(2),
                                                    }));
                                                  }
                                                }}
                                              />
                                            </td>
                                          );
                                        }

                                        return (
                                          <td
                                            key={subB.id}
                                            className="px-4 py-3 border-r border-slate-200 dark:border-slate-800"
                                          >
                                            <input
                                              type="text"
                                              readOnly
                                              className="w-full p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-400 text-center text-sm font-mono cursor-not-allowed"
                                              value={
                                                display !== null && display > 0
                                                  ? display.toFixed(2)
                                                  : "-"
                                              }
                                            />
                                          </td>
                                        );
                                      })}
                                      <td
                                        className={`px-4 py-3 text-center font-bold ${
                                          isMax
                                            ? "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30"
                                            : "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20"
                                        }`}
                                      >
                                        {priority > 0
                                          ? priority.toFixed(3)
                                          : "-"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {subCriteria.map((subCriterion) => {
                        const title =
                          getSubCriterionTitle(subCriterion.id) ||
                          subCriterion.name;
                        const subPrioritiesData =
                          calculationResults?.subCriterionPriorities?.[
                            subCriterion.id
                          ];
                        const subPriorities =
                          subPrioritiesData?.priorities || {};
                        const subConsistency =
                          calculationResults?.subCriterionConsistency?.[
                            subCriterion.id
                          ];
                        const weightedMatrix =
                          subConsistency?.weightedMatrix || [];
                        const weightedSums = subConsistency?.weightedSums || [];

                        return (
                          <div
                            key={subCriterion.id}
                            className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <input
                                type="text"
                                value={title}
                                onChange={(e) =>
                                  setSubCriterionTitle(
                                    subCriterion.id,
                                    e.target.value
                                  )
                                }
                                className="text-lg font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:outline-none px-2 py-1 -ml-2"
                                placeholder="Título da matriz AHP"
                              />
                              <button
                                onClick={() =>
                                  removeSubCriterion(subCriterion.id)
                                }
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                Remover
                              </button>
                            </div>

                            <div className="overflow-x-auto mb-6">
                              <table className="w-full text-sm border-collapse">
                                <thead className="bg-slate-100 dark:bg-slate-950/50">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 bg-blue-100 dark:bg-blue-900/20 sticky left-0 z-10">
                                      {title}
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
                                    const priority =
                                      subPriorities[cityA.id] || 0;
                                    const allPriorities = Object.values(
                                      subPriorities
                                    ) as number[];
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
                                          const savedAhpValue =
                                            getSubCriterionAhpValue(
                                              subCriterion.id,
                                              cityA.id,
                                              cityB.id
                                            );
                                          const displayValue =
                                            savedAhpValue !== null
                                              ? savedAhpValue
                                              : null;

                                          const inputKey = `${subCriterion.id}-${cityA.id}-${cityB.id}`;
                                          const localInputValue =
                                            inputValues[inputKey];
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
                                                    const inputValue =
                                                      e.target.value;
                                                    if (inputValue === "") {
                                                      setInputValues(
                                                        (prev) => ({
                                                          ...prev,
                                                          [inputKey]: "",
                                                        })
                                                      );
                                                      return;
                                                    }
                                                    const regex =
                                                      /^(0?\.?\d{0,2}|[1-9]\d*\.?\d{0,2})$/;
                                                    if (
                                                      regex.test(inputValue)
                                                    ) {
                                                      setInputValues(
                                                        (prev) => ({
                                                          ...prev,
                                                          [inputKey]:
                                                            inputValue,
                                                        })
                                                      );
                                                    }
                                                  }}
                                                  onBlur={(e) => {
                                                    const inputValue =
                                                      e.target.value.trim();
                                                    setInputValues((prev) => {
                                                      const newValues = {
                                                        ...prev,
                                                      };
                                                      delete newValues[
                                                        inputKey
                                                      ];
                                                      return newValues;
                                                    });
                                                    if (
                                                      inputValue === "" ||
                                                      inputValue === "." ||
                                                      inputValue === "-"
                                                    ) {
                                                      setSubCriterionAhpValue(
                                                        subCriterion.id,
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
                                                        Math.round(
                                                          numValue * 100
                                                        ) / 100;
                                                      setSubCriterionAhpValue(
                                                        subCriterion.id,
                                                        cityA.id,
                                                        cityB.id,
                                                        rounded
                                                      );
                                                    } else {
                                                      setSubCriterionAhpValue(
                                                        subCriterion.id,
                                                        cityA.id,
                                                        cityB.id,
                                                        0
                                                      );
                                                    }
                                                  }}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                      e.currentTarget.blur();
                                                    }
                                                  }}
                                                  onFocus={(e) => {
                                                    if (
                                                      displayValue !== null &&
                                                      displayValue > 0
                                                    ) {
                                                      setInputValues(
                                                        (prev) => ({
                                                          ...prev,
                                                          [inputKey]:
                                                            displayValue.toFixed(
                                                              2
                                                            ),
                                                        })
                                                      );
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
                                          {priority > 0
                                            ? priority.toFixed(3)
                                            : "-"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                Cálculo da Consistência
                              </h3>
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
                                    {project.cities.map((city, idx) => {
                                      const row = weightedMatrix?.[idx] || [];
                                      const priority =
                                        subPriorities[city.id] || 0;
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
                                          {row.map(
                                            (value: number, colIdx: number) => (
                                              <td
                                                key={colIdx}
                                                className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800"
                                              >
                                                {value > 0
                                                  ? value.toFixed(3)
                                                  : "-"}
                                              </td>
                                            )
                                          )}
                                          <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                                            {sumDividedByPriority > 0
                                              ? sumDividedByPriority.toFixed(3)
                                              : "-"}
                                          </td>
                                        </tr>
                                      );
                                    })}
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
                                      {(() => {
                                        const consistency =
                                          calculationResults
                                            ?.subCriterionConsistency?.[
                                            subCriterion.id
                                          ];
                                        return consistency &&
                                          consistency.lambda > 0
                                          ? consistency.lambda.toFixed(4)
                                          : "-";
                                      })()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                                      CI
                                    </div>
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                      {(() => {
                                        const consistency =
                                          calculationResults
                                            ?.subCriterionConsistency?.[
                                            subCriterion.id
                                          ];
                                        return consistency && consistency.CI > 0
                                          ? consistency.CI.toFixed(4)
                                          : "-";
                                      })()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                                      RI
                                    </div>
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                      {(() => {
                                        const consistency =
                                          calculationResults
                                            ?.subCriterionConsistency?.[
                                            subCriterion.id
                                          ];
                                        return consistency && consistency.RI > 0
                                          ? consistency.RI.toFixed(2)
                                          : "-";
                                      })()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                                      CR
                                    </div>
                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                      {(() => {
                                        const consistency =
                                          calculationResults
                                            ?.subCriterionConsistency?.[
                                            subCriterion.id
                                          ];
                                        return consistency && consistency.CR > 0
                                          ? consistency.CR.toFixed(4)
                                          : "-";
                                      })()}
                                    </div>
                                  </div>
                                </div>
                                {(() => {
                                  const consistency =
                                    calculationResults
                                      ?.subCriterionConsistency?.[
                                      subCriterion.id
                                    ];
                                  if (!consistency || !consistency.CR)
                                    return null;

                                  if (consistency.CR > 0.1) {
                                    return (
                                      <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                                        <p className="text-sm font-bold text-red-800 dark:text-red-200">
                                          ⚠️ Atenção: CR &gt; 0.1. A matriz pode
                                          ser inconsistente.
                                        </p>
                                      </div>
                                    );
                                  }

                                  if (
                                    consistency.CR > 0 &&
                                    consistency.CR <= 0.1
                                  ) {
                                    return (
                                      <div className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-lg">
                                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                                          ✓ CR &lt; 0.1. Matriz consistente!
                                        </p>
                                      </div>
                                    );
                                  }

                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : project.cities.length === 0 ? (
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
                        if (!currentCriterionByIndex) {
                          return null;
                        }

                        const criterionId = (currentCriterionByIndex as any)
                          ?.id;
                        if (!criterionId) {
                          return null;
                        }

                        const currentSubCriteria = (
                          project.subCriteria || []
                        ).filter((sc) => sc.criterionId === criterionId);
                        const portSubCriterion = currentSubCriteria.find(
                          (sc) =>
                            sc.name
                              .toLowerCase()
                              .includes(selectedPort.name.toLowerCase()) ||
                            sc.name
                              .toLowerCase()
                              .includes(selectedPort.id.toLowerCase())
                        );
                        const priorities = portSubCriterion
                          ? calculationResults?.subCriterionPriorities?.[
                              portSubCriterion.id
                            ]?.priorities || {}
                          : {};
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
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.currentTarget.blur();
                                      }
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
                        onClick={addWarehouse}
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
                            <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300 bg-orange-100 dark:bg-orange-900/20">
                              Ações
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
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() =>
                                      removeWarehouse(city.id, warehouse.id)
                                    }
                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 mx-auto"
                                    title="Remover galpão"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3.5 w-3.5"
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
                                    Remover
                                  </button>
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
                            <td className="px-4 py-3"></td>
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
                            const pricePriorities =
                              calculationResults?.subCriterionPriorities?.[
                                currentPage.id
                              ]?.priorities ||
                              calculationResults?.cityCriterionScores?.[
                                cityA.id
                              ] ||
                              {};
                            const priority = pricePriorities[cityA.id] || 0;

                            const allPriorities = Object.values(
                              pricePriorities
                            ) as number[];
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

                                            const regex =
                                              /^(0?\.?\d{0,2}|[1-9]\d*\.?\d{0,2})$/;
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
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.currentTarget.blur();
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
                            const priceCriterion = project.criteria.find(
                              (c) =>
                                c.name.toLowerCase().includes("preço") ||
                                c.name.toLowerCase().includes("preco") ||
                                c.name.toLowerCase().includes("custo")
                            );

                            if (!priceCriterion) {
                              return project.cities.map((city) => (
                                <tr key={city.id}>
                                  <td>{city.name}</td>
                                  {project.cities.map((_, idx) => (
                                    <td key={idx}>-</td>
                                  ))}
                                  <td>-</td>
                                </tr>
                              ));
                            }

                            const priceSubCriteria = (
                              project.subCriteria || []
                            ).filter(
                              (sc) => sc.criterionId === priceCriterion.id
                            );

                            let subCriterionId = priceSubCriteria[0]?.id;
                            if (!subCriterionId && currentCriterionByIndex) {
                              const currentSubs = (
                                project.subCriteria || []
                              ).filter(
                                (sc) =>
                                  sc.criterionId ===
                                  (currentCriterionByIndex as any).id
                              );
                              subCriterionId = currentSubs[0]?.id;
                            }

                            const consistency = subCriterionId
                              ? calculationResults?.subCriterionConsistency?.[
                                  subCriterionId
                                ]
                              : null;
                            const weightedMatrix =
                              consistency?.weightedMatrix || [];
                            const priorities = subCriterionId
                              ? calculationResults?.subCriterionPriorities?.[
                                  subCriterionId
                                ]?.priorities || {}
                              : {};

                            return project.cities.map((city, idx) => {
                              const row = weightedMatrix[idx] || [];
                              const priority = priorities[city.id] || 0;

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
                                  {row.map((value: number, colIdx: number) => (
                                    <td
                                      key={colIdx}
                                      className="px-4 py-3 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800"
                                    >
                                      {value > 0 ? value.toFixed(3) : "-"}
                                    </td>
                                  ))}
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
                            {(() => {
                              if (!currentCriterionByIndex) return "-";

                              const criterionId = (
                                currentCriterionByIndex as any
                              )?.id;
                              if (!criterionId) return "-";

                              const currentSubCriteria = (
                                project.subCriteria || []
                              ).filter((sc) => sc.criterionId === criterionId);
                              const subCriterionId = currentSubCriteria[0]?.id;

                              const consistency = subCriterionId
                                ? calculationResults?.subCriterionConsistency?.[
                                    subCriterionId
                                  ]
                                : null;
                              return consistency && consistency.lambda > 0
                                ? consistency.lambda.toFixed(4)
                                : "-";
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                            CI
                          </div>
                          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            {(() => {
                              const priceCriterion = project.criteria.find(
                                (c) =>
                                  c.name.toLowerCase().includes("preço") ||
                                  c.name.toLowerCase().includes("preco") ||
                                  c.name.toLowerCase().includes("custo")
                              );
                              const priceSubCriteria = priceCriterion
                                ? (project.subCriteria || []).filter(
                                    (sc) => sc.criterionId === priceCriterion.id
                                  )
                                : [];
                              let subCriterionId = priceSubCriteria[0]?.id;
                              if (!subCriterionId && currentCriterionByIndex) {
                                const criterionId = (
                                  currentCriterionByIndex as any
                                )?.id;
                                if (criterionId) {
                                  const currentSubs = (
                                    project.subCriteria || []
                                  ).filter(
                                    (sc) => sc.criterionId === criterionId
                                  );
                                  subCriterionId = currentSubs[0]?.id;
                                }
                              }
                              const consistency = subCriterionId
                                ? calculationResults?.subCriterionConsistency?.[
                                    subCriterionId
                                  ]
                                : null;
                              return consistency && consistency.CI > 0
                                ? consistency.CI.toFixed(4)
                                : "-";
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                            RI (para {project.cities.length}x
                            {project.cities.length})
                          </div>
                          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            {(() => {
                              const priceCriterion = project.criteria.find(
                                (c) =>
                                  c.name.toLowerCase().includes("preço") ||
                                  c.name.toLowerCase().includes("preco") ||
                                  c.name.toLowerCase().includes("custo")
                              );
                              const priceSubCriteria = priceCriterion
                                ? (project.subCriteria || []).filter(
                                    (sc) => sc.criterionId === priceCriterion.id
                                  )
                                : [];
                              let subCriterionId = priceSubCriteria[0]?.id;
                              if (!subCriterionId && currentCriterionByIndex) {
                                const criterionId = (
                                  currentCriterionByIndex as any
                                )?.id;
                                if (criterionId) {
                                  const currentSubs = (
                                    project.subCriteria || []
                                  ).filter(
                                    (sc) => sc.criterionId === criterionId
                                  );
                                  subCriterionId = currentSubs[0]?.id;
                                }
                              }
                              const consistency = subCriterionId
                                ? calculationResults?.subCriterionConsistency?.[
                                    subCriterionId
                                  ]
                                : null;
                              return consistency && consistency.RI > 0
                                ? consistency.RI.toFixed(4)
                                : "-";
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
                            CR
                          </div>
                          <div
                            className={`text-lg font-bold $                            {(() => {
                              if (!currentCriterionByIndex) return "text-red-600 dark:text-red-400";
                              
                              const currentSubCriteria = (project.subCriteria || []).filter(
                                (sc) => sc.criterionId === currentCriterionByIndex.id
                              );
                              const subCriterionId = currentSubCriteria[0]?.id;
                              
                              const consistency = subCriterionId
                                ? calculationResults?.subCriterionConsistency?.[
                                    subCriterionId
                                  ]
                                : null;
                              return consistency && consistency.CR < 0.1
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400";
                            })()}`}
                          >
                            {(() => {
                              if (!currentCriterionByIndex) {
                                return <>"-"</>;
                              }

                              const criterionId = (
                                currentCriterionByIndex as any
                              )?.id;
                              if (!criterionId) {
                                return <>"-"</>;
                              }

                              const currentSubCriteria = (
                                project.subCriteria || []
                              ).filter((sc) => sc.criterionId === criterionId);
                              const subCriterionId = currentSubCriteria[0]?.id;

                              const consistency = subCriterionId
                                ? calculationResults?.subCriterionConsistency?.[
                                    subCriterionId
                                  ]
                                : null;
                              const cr = consistency?.CR || 0;
                              return (
                                <>
                                  {cr > 0 ? cr.toFixed(4) : "-"}
                                  {cr > 0 && cr < 0.1 && (
                                    <span className="ml-2 text-xs">
                                      ✓ CORRETO
                                    </span>
                                  )}
                                </>
                              );
                            })()}
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
              Página {pageIndex + 1} de {totalPages} -{" "}
              {currentCriterionByIndex
                ? currentCriterionByIndex.name
                : currentPage.name}
            </div>
            <div className="flex gap-3">
              {!isLastPage && project.criteria.length > 0 ? (
                <button
                  onClick={handleNext}
                  className="bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-base px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-0.5"
                >
                  Próxima Página →
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={
                    createProject.isPending ||
                    updateProject.isPending ||
                    project.criteria.length === 0
                  }
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

export default function DataEntryPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <DataEntryPageContent />
    </Suspense>
  );
}

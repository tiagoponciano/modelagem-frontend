"use client";

import { useState, useMemo } from "react";
import { useDecisionStore } from "../../store/useDecisionStore";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../../components/ThemeToggle";

// Escala de Saaty simplificada para UI
// Valores negativos significam que o da Esquerda ganha
// Valores positivos significam que o da Direita ganha
// 0 significa igual
const SAATY_VALUES = [9, 7, 5, 3, 1, 3, 5, 7, 9];
const SLIDER_MIN = -4; // Corresponde ao primeiro 9
const SLIDER_MAX = 4; // Corresponde ao último 9

export default function MatrixPage() {
  const router = useRouter();
  const { project, setCriteriaJudgment } = useDecisionStore();
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(0); // 0 = Meio (Igual)

  // Gera todos os pares possíveis (Combinação simples)
  const pairs = useMemo(() => {
    const p: [string, string][] = [];
    for (let i = 0; i < project.criteria.length; i++) {
      for (let j = i + 1; j < project.criteria.length; j++) {
        p.push([project.criteria[i].id, project.criteria[j].id]);
      }
    }
    return p;
  }, [project.criteria]);

  // Se não tiver pares (usuário acessou direto sem critérios), volta
  if (pairs.length === 0) {
    if (typeof window !== "undefined") router.push("/setup");
    return null;
  }

  // Identifica o par atual
  const [idA, idB] = pairs[currentPairIndex];
  const critA = project.criteria.find((c) => c.id === idA);
  const critB = project.criteria.find((c) => c.id === idB);

  // Calcula o valor real de Saaty baseado no slider
  // Slider: -4 -3 -2 -1  0  1  2  3  4
  // Saaty:   9  7  5  3  1  3  5  7  9
  const getSaatyValue = (val: number) => {
    if (val === 0) return 1;
    // Mapeamento simples: 1->3, 2->5, 3->7, 4->9
    const saaty = Math.abs(val) * 2 + 1;
    return val < 0 ? saaty : 1 / saaty; // Se for negativo, A ganha (valor > 1). Se positivo, B ganha (valor < 1, fração)
  };

  const getLabel = (val: number) => {
    if (val === 0) return "Igual importância";
    const intensity = Math.abs(val);
    const text =
      intensity === 1
        ? "Moderadamente"
        : intensity === 2
        ? "Fortemente"
        : intensity === 3
        ? "Muito Fortemente"
        : "Extremamente";
    const winner = val < 0 ? critA?.name : critB?.name;
    return `${text} mais importante para: ${winner}`;
  };

  const handleNext = () => {
    // 1. Salva o julgamento na store
    const value = getSaatyValue(sliderValue);
    setCriteriaJudgment(idA, idB, value);

    // 2. Avança ou Finaliza
    if (currentPairIndex < pairs.length - 1) {
      setSliderValue(0); // Reseta slider
      setCurrentPairIndex((prev) => prev + 1);
    } else {
      alert("Comparações finalizadas! Vamos ver o resultado (Futuro)");
      // router.push('/results');
    }
  };

  // Calcula progresso
  const progress = (currentPairIndex / pairs.length) * 100;

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorativo (Rose/Pink para essa etapa) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-rose-200/20 dark:bg-rose-900/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              &larr;
            </span>
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-600 dark:bg-rose-400"></span>
            <span className="text-xs font-bold tracking-widest text-rose-600 dark:text-rose-400 uppercase">
              Passo 3 de 3
            </span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mb-6 w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-rose-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* CARD PRINCIPAL DE COMPARAÇÃO */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-white/20 dark:border-slate-800 transition-all duration-300 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-10">
            Qual critério é mais importante?
          </h2>

          {/* Área de Duelo */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            {/* Critério A (Esquerda) */}
            <div
              className={`flex-1 w-full p-6 rounded-2xl border-2 transition-all duration-300 ${
                sliderValue < 0
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 scale-105 shadow-lg"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 grayscale opacity-70"
              }`}
            >
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 block break-words">
                {critA?.name}
              </span>
            </div>

            <div className="text-slate-300 font-black text-xl">VS</div>

            {/* Critério B (Direita) */}
            <div
              className={`flex-1 w-full p-6 rounded-2xl border-2 transition-all duration-300 ${
                sliderValue > 0
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 scale-105 shadow-lg"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 grayscale opacity-70"
              }`}
            >
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100 block break-words">
                {critB?.name}
              </span>
            </div>
          </div>

          {/* Slider de Decisão */}
          <div className="mb-8 max-w-lg mx-auto">
            <input
              type="range"
              min={SLIDER_MIN}
              max={SLIDER_MAX}
              step="1"
              value={sliderValue}
              onChange={(e) => setSliderValue(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-600 hover:accent-rose-500"
            />

            {/* Legenda Dinâmica */}
            <div className="mt-4 h-8">
              <span
                className={`text-sm font-semibold transition-all ${
                  sliderValue === 0
                    ? "text-slate-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {getLabel(sliderValue)}
              </span>
            </div>
          </div>

          {/* Escala Visual (Bolinhas) */}
          <div className="flex justify-between px-1 mb-10 max-w-lg mx-auto text-xs text-slate-400">
            <span>A muito +</span>
            <span>A +</span>
            <span>Igual</span>
            <span>B +</span>
            <span>B muito +</span>
          </div>

          {/* Botão Confirmar */}
          <button
            onClick={handleNext}
            className="w-full sm:w-auto min-w-[200px] bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-500 text-white text-lg px-8 py-4 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
          >
            {currentPairIndex < pairs.length - 1
              ? "Próxima Comparação"
              : "Finalizar Análise"}
          </button>

          <div className="mt-4 text-xs text-slate-400 uppercase tracking-widest">
            Comparação {currentPairIndex + 1} de {pairs.length}
          </div>
        </div>
      </div>
    </div>
  );
}

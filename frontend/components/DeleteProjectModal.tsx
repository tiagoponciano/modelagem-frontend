"use client";

import { useState } from "react";

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (username: string, password: string) => Promise<void>;
  projectTitle: string;
}

const EXPECTED_USER = process.env.NEXT_PUBLIC_USER || "tpa";
const EXPECTED_PASSWORD = process.env.NEXT_PUBLIC_PASSWORD || "admin";

export function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  projectTitle,
}: DeleteProjectModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username !== EXPECTED_USER || password !== EXPECTED_PASSWORD) {
      setError(
        "Usuário ou senha incorretos. Por favor, verifique suas credenciais."
      );
      return;
    }

    setIsLoading(true);

    try {
      await onConfirm(username, password);
      setUsername("");
      setPassword("");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao excluir projeto. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUsername("");
    setPassword("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Confirmar Exclusão
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            Você está prestes a excluir o projeto:
          </p>
          <p className="font-bold text-slate-900 dark:text-white text-lg">
            {projectTitle}
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-4">
            Esta ação não pode ser desfeita. Por favor, confirme suas
            credenciais para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
              placeholder="Digite seu usuário"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
              placeholder="Digite sua senha"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Excluindo..." : "Excluir Projeto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

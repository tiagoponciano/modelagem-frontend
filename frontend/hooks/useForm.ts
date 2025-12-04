import { useState, useCallback } from "react";

export function useForm<T extends Record<string, any>>(
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  }, [errors]);

  const setError = useCallback(<K extends keyof T>(key: K, error: string) => {
    setErrors((prev) => ({ ...prev, [key]: error }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const handleChange = useCallback(
    <K extends keyof T>(key: K) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value as T[K];
        setValue(key, value);
      },
    [setValue]
  );

  return {
    values,
    errors,
    setValue,
    setError,
    handleChange,
    reset,
  };
}


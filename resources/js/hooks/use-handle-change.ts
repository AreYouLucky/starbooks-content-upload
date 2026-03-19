import { useState, useCallback } from "react";
type Primitive = string | number | boolean | File | null | undefined;

export type FormValue =
  | Primitive
  | Primitive[]
  | Record<string, unknown> 
  | Record<string, unknown>[];


export type FormValues = Record<string, FormValue>;
type FormErrors<T> = Partial<Record<keyof T, string>>;

export function useHandleChange<T extends FormValues>(initialValues: T) {
  const [item, setItem] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const target = e.target as HTMLInputElement;
      const { name, type, files } = target;

      let value: Primitive;

      if (type === "checkbox") value = target.checked;
      else if (type === "file") value = files?.[0] ?? null;
      else value = target.value;

      setItem((prev) => ({
        ...prev,
        [name]: value, 
      }));

      setErrors((prev) => ({
        ...prev,
        [name as keyof T]: undefined,
      }));
    },
    []
  );
  const handleArrayChange = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setItem((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  return { item, errors, setItem, setErrors, handleChange, handleArrayChange };
}

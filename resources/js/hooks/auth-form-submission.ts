import { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface UseFormSubmitProps {
  url: string;
}

export function useFormSubmit({ url }: UseFormSubmitProps) {
  const [processing, setProcessing] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent, data: Record<string, string | number | boolean>, setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>) => {
      e.preventDefault();
      setProcessing(true);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => formData.append(key, String(value)));
      axios.post(url, formData)
        .then((res) => {
          toast.success(res.data.status, { theme: "dark", position: "bottom-right" });
          window.location.href = "/dashboard"
        })
        .catch((err) => {
          setErrors(err.response.data.errors);
          toast.error(err.response.data.status ?? "Request failed", {
            theme: "dark",
            position: "bottom-right",
          });
        })
        .finally(() => {
          setProcessing(false);
        });
    },
    [url]
  );

  return { handleSubmit, processing };
}

import { memo, useRef, useState, ChangeEvent } from "react";
import { FaFileExcel } from "react-icons/fa";

type FileUploadProps = {
  className?: string;
  text?: string;
  name: string;
  id: string;
  url?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

const FileUpload = ({
  className = "",
  text = "Upload Excel or CSV file",
  name = "",
  id = "",
  url = "",
  onChange,
}: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);

    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
  };

  return (
    <div
      className={`flex w-full items-center justify-center border border-dashed shadow-sm border-slate-300 bg-transparent rounded-lg p-8 overflow-hidden ${className}`}
    >
      <label
        htmlFor={id}
        className="flex w-full cursor-pointer flex-col items-center justify-center"
      >
        {fileName || url ? (
          <div className="flex flex-col items-center justify-center gap-2 w-full">
            <FaFileExcel size={50} />
            <p className="text-xs font-semibold text-center">
              {fileName || url}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <FaFileExcel size={50} />
            <p className="mb-2 text-sm mt-2">{text}</p>
          </div>
        )}

        <input
          id={id}
          type="file"
          ref={fileInputRef}
          accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          name={name}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default memo(FileUpload);
import React, { useState, DragEvent } from "react";

interface FileDropzoneProps {
  onFilesAdded?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export default function FileDropzone({
  onFilesAdded,
  accept,
  multiple = true,
  className,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
    onFilesAdded?.(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    setFiles((prev) => [...prev, ...selectedFiles]);
    onFilesAdded?.(selectedFiles);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-md p-8 text-center transition-colors duration-200 cursor-pointer
        ${isDragging ? "bg-red-100 border-red-500" : "bg-red-50 border-red-300"}
        ${className ?? ""}`}
    >
      <input
        type="file"
        id="fileInput"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />
      <label htmlFor="fileInput" className="cursor-pointer">
        <div className="flex flex-col items-center justify-center gap-2 text-red-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <p className="text-sm">
            <span className="font-semibold">Drag and Drop</span> file here or{" "}
            <span className="underline font-medium">browse</span>
          </p>
        </div>
      </label>

      {files.length > 0 && (
        <ul className="mt-4 text-sm text-left text-gray-700 space-y-1">
          {files.map((file, index) => (
            <li key={index} className="truncate">
              📄 {file.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

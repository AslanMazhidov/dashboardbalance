"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

interface SheetResult {
  sheetName: string;
  imported: number;
  skipped: number;
  errors: string[];
}

interface ImportResult {
  sheets: SheetResult[];
  totalImported: number;
  totalSkipped: number;
  totalErrors: number;
  sheetNames: string[];
}

type UploadState = "idle" | "selected" | "uploading" | "success" | "error";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function ImportPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(f: File) {
    if (!f.name.endsWith(".xlsx") && !f.name.endsWith(".xls")) {
      toast.error("Поддерживаются только файлы Excel (.xlsx, .xls)");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("Файл слишком большой (макс. 10 МБ)");
      return;
    }
    setFile(f);
    setState("selected");
    setResult(null);
    setErrorMessage("");
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) selectFile(droppedFile);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
    e.target.value = "";
  };

  async function handleUpload() {
    if (!file) return;

    setState("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Ошибка ${res.status}`);
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setState("success");
      toast.success(`Импортировано ${data.totalImported} записей`);
    } catch (err) {
      setErrorMessage((err as Error).message);
      setState("error");
      toast.error((err as Error).message);
    }
  }

  function handleReset() {
    setFile(null);
    setState("idle");
    setResult(null);
    setErrorMessage("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Импорт данных"
        description="Загрузка отчётов из Excel"
      />

      {/* Drop zone */}
      {(state === "idle" || state === "selected") && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <Upload
            className={cn(
              "mb-4 size-12",
              isDragOver ? "text-primary" : "text-muted-foreground"
            )}
          />
          <p className="text-base font-medium">
            Перетащите файл Excel сюда
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            или нажмите для выбора файла
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Поддерживаемые форматы: .xlsx, .xls (до 10 МБ)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Selected file + upload button */}
      {state === "selected" && file && (
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <FileSpreadsheet className="size-10 shrink-0 text-green-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              className="shrink-0"
            >
              <X className="size-4" />
            </Button>
          </CardContent>
          <div className="border-t px-4 py-3">
            <Button onClick={handleUpload} className="w-full">
              Импортировать
            </Button>
          </div>
        </Card>
      )}

      {/* Uploading state */}
      {state === "uploading" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="mb-4 size-12 animate-spin text-primary" />
            <p className="text-base font-medium">Импорт данных...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Обработка файла {file?.name}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Success result */}
      {state === "success" && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="size-5" />
              Импорт завершён
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Импортировано:</span>{" "}
                <span className="font-semibold">{result.totalImported}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Пропущено:</span>{" "}
                <span className="font-semibold">{result.totalSkipped}</span>
              </div>
              {result.totalErrors > 0 && (
                <div>
                  <span className="text-muted-foreground">Ошибок:</span>{" "}
                  <span className="font-semibold text-red-600">
                    {result.totalErrors}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {result.sheets.map((sheet) => (
                <div
                  key={sheet.sheetName}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="size-4 text-muted-foreground" />
                    <span className="font-medium">{sheet.sheetName}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {sheet.imported} записей
                  </span>
                </div>
              ))}
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full">
              Загрузить ещё
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {state === "error" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="size-5" />
              Ошибка импорта
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button onClick={handleReset} variant="outline" className="w-full">
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

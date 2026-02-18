"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Trash2,
  Clock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface ImportBatchItem {
  id: string;
  fileName: string;
  recordCount: number;
  createdAt: string;
  user: { name: string };
  _count: { reports: number };
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

  // Import history
  const [batches, setBatches] = useState<ImportBatchItem[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  async function fetchBatches() {
    setBatchesLoading(true);
    try {
      const res = await fetch("/api/import/batches");
      if (res.ok) {
        setBatches(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setBatchesLoading(false);
    }
  }

  useEffect(() => {
    fetchBatches();
  }, []);

  async function handleDeleteBatch(id: string) {
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/import/batches/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Удалено ${data.deletedReports} записей`);
        setDeleteId(null);
        fetchBatches();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Ошибка при удалении");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setDeleteSubmitting(false);
    }
  }

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
      fetchBatches();
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

      {/* Import history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            История импортов
          </CardTitle>
        </CardHeader>
        <CardContent>
          {batchesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет импортов</p>
          ) : (
            <div className="space-y-2">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{batch.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(batch.createdAt), "d MMM yyyy, HH:mm", { locale: ru })}
                        {" \u00b7 "}
                        {batch._count.reports} записей
                        {" \u00b7 "}
                        {batch.user.name}
                      </p>
                    </div>
                  </div>
                  <Dialog
                    open={deleteId === batch.id}
                    onOpenChange={(open) => {
                      if (!open) setDeleteId(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(batch.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Удалить импорт?</DialogTitle>
                        <DialogDescription>
                          Будут удалены все {batch._count.reports} записей,
                          загруженных из файла &laquo;{batch.fileName}&raquo;.
                          Это действие необратимо.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>
                          Отмена
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={deleteSubmitting}
                          onClick={() => handleDeleteBatch(batch.id)}
                        >
                          {deleteSubmitting && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          )}
                          Удалить
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

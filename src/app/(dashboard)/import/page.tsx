"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Импорт данных"
        description="Загрузка отчётов из Excel"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Upload className="mb-4 size-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Загрузка Excel-файлов</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Функция импорта через интерфейс будет доступна в следующей версии.
            <br />
            Сейчас данные загружаются через скрипт{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              npx tsx prisma/import-excel.mjs
            </code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

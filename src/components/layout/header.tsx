"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { useState } from "react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Дашборд",
  "/import": "Импорт данных",
  "/locations": "Кофейни",
};

function getPageTitle(pathname: string): string {
  // Check for exact match first
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check for prefix match (for nested routes)
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path + "/")) {
      return title;
    }
  }

  return "Дашборд";
}

export function Header() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
      {/* Mobile menu toggle */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="size-5" />
            <span className="sr-only">Открыть меню</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Навигация</SheetTitle>
          <Sidebar onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <div className="flex flex-1 items-center">
        <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
          {title}
        </h1>
      </div>
    </header>
  );
}

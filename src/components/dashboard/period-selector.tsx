"use client";

import { PERIODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
      {PERIODS.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? "default" : "ghost"}
          size="sm"
          className={cn(
            "h-7 px-3 text-xs",
            value !== period.value && "text-muted-foreground"
          )}
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}

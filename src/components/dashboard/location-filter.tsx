"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Location {
  id: string;
  name: string;
}

interface LocationFilterProps {
  value: string;
  onChange: (value: string) => void;
  locations: Location[];
}

export function LocationFilter({ value, onChange, locations }: LocationFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Выберите кофейню" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Все кофейни</SelectItem>
        {locations.map((location) => (
          <SelectItem key={location.id} value={location.id}>
            {location.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

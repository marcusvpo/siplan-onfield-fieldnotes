// src/components/ui/multi-select.tsx
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Check } from "lucide-react";

export type MultiSelectOption = { label: string; value: string };

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = "Selecionar...", emptyMessage = "Nenhuma opção" }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.filter(o => value.includes(o.value)),
    [options, value]
  );

  const toggleValue = (val: string) => {
    if (value.includes(val)) onChange(value.filter(v => v !== val));
    else onChange([...value, val]);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selected.length > 0 ? `${selected.length} selecionado(s)` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Buscar..." />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem key={opt.value} onSelect={() => toggleValue(opt.value)}>
                    <div className="mr-2 flex h-4 w-4 items-center justify-center">
                      {value.includes(opt.value) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="h-4 w-4 border rounded-sm" />
                      )}
                    </div>
                    <span>{opt.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((opt) => (
            <Badge key={opt.value} variant="secondary" className="cursor-pointer" onClick={() => toggleValue(opt.value)}>
              {opt.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

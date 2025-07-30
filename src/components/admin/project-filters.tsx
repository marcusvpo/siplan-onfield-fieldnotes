import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { useUsers } from "@/hooks/use-users";

export interface ProjectFilters {
  status?: string;
  sistema?: string;
  estado?: string;
  usuario_id?: string;
  data_inicio?: string;
  data_fim?: string;
  atrasados?: boolean;
}

interface ProjectFiltersProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
}

const statusOptions = [
  { value: "aguardando", label: "Aguardando" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
];

const sistemasOptions = [
  "Orion PRO",
  "WebRI", 
  "Orion TN",
  "Sistema Cartório",
  "Outro"
];

const estadosOptions = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export const ProjectFiltersSheet = ({ filters, onFiltersChange }: ProjectFiltersProps) => {
  const [open, setOpen] = useState(false);
  const { getActiveImplantadores } = useUsers();
  const implantadores = getActiveImplantadores();

  const updateFilter = (key: keyof ProjectFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const clearFilter = (key: keyof ProjectFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.keys(filters).length;
  };

  const getFilterLabel = (key: keyof ProjectFilters, value: any) => {
    switch (key) {
      case 'status':
        return statusOptions.find(s => s.value === value)?.label || value;
      case 'sistema':
        return value;
      case 'estado':
        return value;
      case 'usuario_id':
        const user = implantadores.find(u => u.id === value);
        return user ? user.nome : value;
      case 'data_inicio':
        return `Início: ${new Date(value).toLocaleDateString('pt-BR')}`;
      case 'data_fim':
        return `Fim: ${new Date(value).toLocaleDateString('pt-BR')}`;
      case 'atrasados':
        return 'Atrasados';
      default:
        return value;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          Filtros
          {getActiveFiltersCount() > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {getActiveFiltersCount()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtros de Projetos</SheetTitle>
          <SheetDescription>
            Use os filtros abaixo para refinar a busca de projetos
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Active Filters */}
          {getActiveFiltersCount() > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Filtros Ativos</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="h-6 px-2 text-xs"
                >
                  Limpar Todos
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="gap-1">
                    {getFilterLabel(key as keyof ProjectFilters, value)}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => clearFilter(key as keyof ProjectFilters)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={filters.status || ""} 
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sistema Filter */}
          <div className="space-y-2">
            <Label>Sistema</Label>
            <Select 
              value={filters.sistema || ""} 
              onValueChange={(value) => updateFilter('sistema', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os sistemas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os sistemas</SelectItem>
                {sistemasOptions.map((sistema) => (
                  <SelectItem key={sistema} value={sistema}>
                    {sistema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado Filter */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select 
              value={filters.estado || ""} 
              onValueChange={(value) => updateFilter('estado', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os estados</SelectItem>
                {estadosOptions.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Implantador Filter */}
          <div className="space-y-2">
            <Label>Implantador</Label>
            <Select 
              value={filters.usuario_id || ""} 
              onValueChange={(value) => updateFilter('usuario_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os implantadores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os implantadores</SelectItem>
                {implantadores.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nome} ({user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filters */}
          <div className="space-y-4">
            <Label>Período de Agendamento</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Data Início</Label>
                <Input
                  type="date"
                  value={filters.data_inicio || ""}
                  onChange={(e) => updateFilter('data_inicio', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data Fim</Label>
                <Input
                  type="date"
                  value={filters.data_fim || ""}
                  onChange={(e) => updateFilter('data_fim', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <Label>Filtros Rápidos</Label>
            <div className="space-y-2">
              <Button
                variant={filters.atrasados ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('atrasados', !filters.atrasados)}
                className="w-full justify-start"
              >
                Apenas Projetos Atrasados
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
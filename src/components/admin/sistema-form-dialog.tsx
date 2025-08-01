import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SistemaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { nome: string; ativo: boolean }) => Promise<boolean>;
  sistema?: {
    id: string;
    nome: string;
    ativo: boolean;
  };
  title: string;
}

export const SistemaFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  sistema,
  title
}: SistemaFormDialogProps) => {
  const [nome, setNome] = useState(sistema?.nome || "");
  const [ativo, setAtivo] = useState(sistema?.ativo ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      return;
    }

    setLoading(true);
    const success = await onSubmit({ nome: nome.trim(), ativo });
    
    if (success) {
      setNome("");
      setAtivo(true);
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNome(sistema?.nome || "");
      setAtivo(sistema?.ativo ?? true);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Sistema *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: e-Cart, Sistema CNJ..."
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={setAtivo}
            />
            <Label htmlFor="ativo">Sistema ativo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
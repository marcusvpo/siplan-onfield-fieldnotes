import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface StatusFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { nome: string; cor: string; ordem: number; ativo: boolean }) => Promise<boolean>;
  status?: {
    id: string;
    nome: string;
    cor: string;
    ordem: number;
    ativo: boolean;
  };
  title: string;
}

export const StatusFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  status,
  title
}: StatusFormDialogProps) => {
  const [nome, setNome] = useState(status?.nome || "");
  const [cor, setCor] = useState(status?.cor || "#64748b");
  const [ordem, setOrdem] = useState(status?.ordem || 1);
  const [ativo, setAtivo] = useState(status?.ativo ?? true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      return;
    }

    setLoading(true);
    const success = await onSubmit({ 
      nome: nome.trim(), 
      cor, 
      ordem: Number(ordem), 
      ativo 
    });
    
    if (success) {
      setNome("");
      setCor("#64748b");
      setOrdem(1);
      setAtivo(true);
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNome(status?.nome || "");
      setCor(status?.cor || "#64748b");
      setOrdem(status?.ordem || 1);
      setAtivo(status?.ativo ?? true);
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
            <Label htmlFor="nome">Nome do Status *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Aguardando, Em Andamento..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cor">Cor</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="cor"
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="#64748b"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordem">Ordem</Label>
            <Input
              id="ordem"
              type="number"
              min="1"
              value={ordem}
              onChange={(e) => setOrdem(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={setAtivo}
            />
            <Label htmlFor="ativo">Status ativo</Label>
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
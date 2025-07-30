import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useUsers } from "@/hooks/use-users";
import { Project } from "@/hooks/use-projects";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  project?: Project | null;
  title: string;
}

interface FormData {
  chamado: string;
  nome_cartorio: string;
  estado: string;
  sistema: string;
  email_contato: string;
  data_agendada: string;
  status: string;
  usuario_id?: string;
  observacao_admin?: string;
}

const sistemas = [
  "Orion PRO",
  "WebRI",
  "Orion TN",
  "Sistema Cartório",
  "Outro"
];

const statusOptions = [
  { value: "aguardando", label: "Aguardando" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "finalizado", label: "Finalizado" },
  { value: "cancelado", label: "Cancelado" },
];

export const ProjectFormDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  project, 
  title 
}: ProjectFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { getActiveImplantadores } = useUsers();
  const implantadores = getActiveImplantadores();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: project ? {
      chamado: project.chamado,
      nome_cartorio: project.nome_cartorio,
      estado: project.estado,
      sistema: project.sistema,
      email_contato: project.email_contato,
      data_agendada: project.data_agendada,
      status: project.status,
      usuario_id: project.usuario_id || "",
      observacao_admin: project.observacao_admin || ""
    } : {
      status: "aguardando"
    }
  });

  const handleFormSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
    } finally {
      setLoading(false);
    }
  };

  const watchedStatus = watch("status");
  const watchedSistema = watch("sistema");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {project ? "Edite as informações do projeto" : "Preencha os dados para criar um novo projeto de implantação"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chamado">Chamado *</Label>
              <Input
                id="chamado"
                placeholder="CH-2025-001"
                {...register("chamado", { required: "Chamado é obrigatório" })}
              />
              {errors.chamado && (
                <span className="text-sm text-destructive">{errors.chamado.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado *</Label>
              <Input
                id="estado"
                placeholder="SP"
                maxLength={2}
                {...register("estado", { required: "Estado é obrigatório" })}
              />
              {errors.estado && (
                <span className="text-sm text-destructive">{errors.estado.message}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_cartorio">Nome do Cartório *</Label>
            <Input
              id="nome_cartorio"
              placeholder="1º Cartório de Notas - São Paulo"
              {...register("nome_cartorio", { required: "Nome do cartório é obrigatório" })}
            />
            {errors.nome_cartorio && (
              <span className="text-sm text-destructive">{errors.nome_cartorio.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_contato">Email de Contato *</Label>
            <Input
              id="email_contato"
              type="email"
              placeholder="contato@cartorio.com.br"
              {...register("email_contato", { 
                required: "Email é obrigatório",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email inválido"
                }
              })}
            />
            {errors.email_contato && (
              <span className="text-sm text-destructive">{errors.email_contato.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sistema">Sistema *</Label>
              <Select value={watchedSistema} onValueChange={(value) => setValue("sistema", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o sistema" />
                </SelectTrigger>
                <SelectContent>
                  {sistemas.map((sistema) => (
                    <SelectItem key={sistema} value={sistema}>
                      {sistema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sistema && (
                <span className="text-sm text-destructive">{errors.sistema.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_agendada">Data Agendada *</Label>
              <Input
                id="data_agendada"
                type="date"
                {...register("data_agendada", { required: "Data agendada é obrigatória" })}
              />
              {errors.data_agendada && (
                <span className="text-sm text-destructive">{errors.data_agendada.message}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={watchedStatus} onValueChange={(value) => setValue("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuario_id">Implantador</Label>
              <Select 
                value={watch("usuario_id") || "none"} 
                onValueChange={(value) => setValue("usuario_id", value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um implantador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum implantador</SelectItem>
                  {implantadores.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nome} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao_admin">Observações do Administrador</Label>
            <Textarea
              id="observacao_admin"
              placeholder="Observações internas sobre o projeto..."
              rows={3}
              {...register("observacao_admin")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="wine" disabled={loading}>
              {loading ? "Salvando..." : project ? "Atualizar" : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
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
import { useSistemas } from "@/hooks/use-sistemas";
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
  telefone_contato?: string;
  data_inicio_implantacao: string;
  data_fim_implantacao: string;
  status: string;
  usuario_id?: string;
  observacao_admin?: string;
}

// Removido - sistema será campo de texto livre

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
  const { sistemas, loading: loadingSistemas } = useSistemas();
  const sistemasAtivos = sistemas.filter(s => s.ativo);

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
      telefone_contato: project.telefone_contato || "",
      data_inicio_implantacao: project.data_inicio_implantacao || "",
      data_fim_implantacao: project.data_fim_implantacao || "",
      status: project.status,
      usuario_id: project.usuario_id || "",
      observacao_admin: project.observacao_admin || ""
    } : {
      status: "aguardando"
    }
  });

  const handleFormSubmit = async (data: FormData) => {
    // Validar datas
    const dataInicio = new Date(data.data_inicio_implantacao);
    const dataFim = new Date(data.data_fim_implantacao);
    
    if (dataFim < dataInicio) {
      alert("A data final não pode ser menor que a data inicial.");
      return;
    }
    
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
                type="number"
                placeholder="645374"
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
            <Label htmlFor="sistema">Sistema *</Label>
            <Select
              value={watch("sistema") || ""}
              onValueChange={(value) => setValue("sistema", value, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingSistemas ? "Carregando sistemas..." : "Selecione um sistema"} />
              </SelectTrigger>
              <SelectContent>
                {sistemasAtivos.length === 0 ? (
                  <SelectItem value="" disabled>Nenhum sistema ativo cadastrado</SelectItem>
                ) : (
                  sistemasAtivos.map((s) => (
                    <SelectItem key={s.id} value={s.nome}>
                      {s.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.sistema && (
              <span className="text-sm text-destructive">{errors.sistema.message}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="telefone_contato">Telefone de Contato</Label>
              <Input
                id="telefone_contato"
                type="tel"
                placeholder="(11) 99999-9999"
                {...register("telefone_contato")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio_implantacao">Início da Implantação *</Label>
              <Input
                id="data_inicio_implantacao"
                type="date"
                {...register("data_inicio_implantacao", { required: "Data de início é obrigatória" })}
              />
              {errors.data_inicio_implantacao && (
                <span className="text-sm text-destructive">{errors.data_inicio_implantacao.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim_implantacao">Final da Implantação *</Label>
              <Input
                id="data_fim_implantacao"
                type="date"
                {...register("data_fim_implantacao", { required: "Data final é obrigatória" })}
              />
              {errors.data_fim_implantacao && (
                <span className="text-sm text-destructive">{errors.data_fim_implantacao.message}</span>
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
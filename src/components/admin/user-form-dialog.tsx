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

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
}

interface FormData {
  nome: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export const UserFormDialog = ({ 
  open, 
  onOpenChange, 
  onSubmit
}: UserFormDialogProps) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormData>();

  const handleFormSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        nome: data.nome,
        email: data.email,
        username: data.username,
        password: data.password
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const password = watch("password");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Implantador</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo usuário implantador
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              placeholder="João Silva"
              {...register("nome", { required: "Nome é obrigatório" })}
            />
            {errors.nome && (
              <span className="text-sm text-destructive">{errors.nome.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="joao@exemplo.com"
              {...register("email", { 
                required: "Email é obrigatório",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email inválido"
                }
              })}
            />
            {errors.email && (
              <span className="text-sm text-destructive">{errors.email.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nome de Usuário *</Label>
            <Input
              id="username"
              placeholder="joao.silva"
              {...register("username", { 
                required: "Nome de usuário é obrigatório",
                minLength: {
                  value: 3,
                  message: "Nome de usuário deve ter pelo menos 3 caracteres"
                },
                pattern: {
                  value: /^[a-zA-Z0-9._-]+$/,
                  message: "Nome de usuário pode conter apenas letras, números, pontos, underscore e hífen"
                }
              })}
            />
            {errors.username && (
              <span className="text-sm text-destructive">{errors.username.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              {...register("password", { 
                required: "Senha é obrigatória",
                minLength: {
                  value: 6,
                  message: "Senha deve ter pelo menos 6 caracteres"
                }
              })}
            />
            {errors.password && (
              <span className="text-sm text-destructive">{errors.password.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Digite a senha novamente"
              {...register("confirmPassword", { 
                required: "Confirmação de senha é obrigatória",
                validate: value => value === password || "As senhas não coincidem"
              })}
            />
            {errors.confirmPassword && (
              <span className="text-sm text-destructive">{errors.confirmPassword.message}</span>
            )}
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
              {loading ? "Criando..." : "Criar Implantador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
import { type Project } from "@/hooks/use-projects";

export const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'aguardando':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'em_andamento':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'finalizado':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelado':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusLabel = (status: Project['status']) => {
  switch (status) {
    case 'aguardando':
      return 'Aguardando';
    case 'em_andamento':
      return 'Em Andamento';
    case 'finalizado':
      return 'Finalizado';
    case 'cancelado':
      return 'Cancelado';
    default:
      return status;
  }
};

export const isProjectLate = (project: Project) => {
  if (project.status === 'finalizado') return false;
  const dataFim = new Date(project.data_fim_implantacao);
  const now = new Date();
  return dataFim < now;
};
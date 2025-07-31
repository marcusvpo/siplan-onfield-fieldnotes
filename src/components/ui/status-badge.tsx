import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel } from "@/utils/status-colors";
import { type Project } from "@/hooks/use-projects";

interface StatusBadgeProps {
  status: Project['status'];
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const colorClasses = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <Badge 
      variant="outline" 
      className={`${colorClasses} ${className || ''}`}
    >
      {label}
    </Badge>
  );
};
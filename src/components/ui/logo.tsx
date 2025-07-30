import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, variant = "full", size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: variant === "full" ? "h-6" : "h-6 w-6",
    md: variant === "full" ? "h-8" : "h-8 w-8", 
    lg: variant === "full" ? "h-12" : "h-12 w-12"
  };

  if (variant === "icon") {
    return (
      <div className={cn(
        "bg-gradient-to-br from-wine-red to-wine-red-hover rounded-lg flex items-center justify-center text-white font-bold",
        sizeClasses[size],
        className
      )}>
        <span className="text-sm">S</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "bg-gradient-to-br from-wine-red to-wine-red-hover rounded-lg flex items-center justify-center text-white font-bold",
        sizeClasses[size]
      )}>
        <span className="text-sm">S</span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-dark-gray text-sm leading-none">Siplan</span>
        <span className="text-xs text-medium-gray leading-none">On-Field</span>
      </div>
    </div>
  );
};
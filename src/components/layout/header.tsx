import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface HeaderProps {
  userType: "admin" | "implantador";
  userName?: string;
  onLogout?: () => void;
}

export const Header = ({ userType, userName, onLogout }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo size="md" />
          
          <div className="flex items-center gap-4">
            {userName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-medium-gray" />
                <span className="text-dark-gray font-medium">{userName}</span>
                <span className="text-xs text-medium-gray px-2 py-1 bg-light-gray rounded-full">
                  {userType === "admin" ? "Administrador" : "Implantador"}
                </span>
              </div>
            )}
            
            {onLogout && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full admin-gradient">
        <AdminSidebar />
        
        <main className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-admin-border admin-bg-secondary px-4 shadow-admin">
            <SidebarTrigger className="mr-4 admin-text" />
            <h1 className="text-lg font-semibold admin-text">Siplan On-Field</h1>
          </header>
          
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
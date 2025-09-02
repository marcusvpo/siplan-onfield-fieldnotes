import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Projetos", url: "/admin/projetos", icon: FolderOpen },
  { title: "Usuários", url: "/admin/users", icon: Users },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar className={`${collapsed ? "w-14" : "w-64"} admin-gradient-card border-admin-border shadow-admin`} collapsible="icon">
      <SidebarHeader className="border-b border-admin-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="h-8 w-8 rounded bg-wine-red flex items-center justify-center shadow-admin-card animate-float">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in-up">
              <span className="font-semibold text-sm admin-text">Siplan</span>
              <span className="text-xs admin-text-muted">On-Field</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className="admin-text-muted">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"}
                      className={({ isActive: navIsActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-spring hover-admin animate-fade-in-up ${
                          navIsActive || isActive(item.url)
                            ? "bg-wine-red text-white shadow-admin-card" 
                            : "admin-text-muted hover:bg-admin-bg-secondary"
                        }`
                      }
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-admin-border">
        <div className="p-2">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm admin-text-muted hover:bg-admin-bg-secondary hover:admin-text transition-spring shadow-admin-card ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
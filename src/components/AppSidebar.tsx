
import { Home, FileText, Users, Car, Receipt, Wrench, BarChart3, FileSpreadsheet, Settings, CreditCard, Wallet } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";

/* Menu principal moderne avec couleurs professionnelles */
const menuItems = [{
  title: "Accueil",
  url: "/",
  icon: Home
}, {
  title: "Contrats",
  url: "/contracts",
  icon: FileText
}, {
  title: "Clients",
  url: "/customers",
  icon: Users
}, {
  title: "Véhicules",
  url: "/vehicles",
  icon: Car
}, {
  title: "Recette",
  url: "/recette",
  icon: Receipt
}, {
  title: "Dépenses",
  url: "/expenses", 
  icon: Receipt
}, {
  title: "Chèques",
  url: "/cheques",
  icon: CreditCard
}, {
  title: "Trésorerie",
  url: "/tresorerie",
  icon: Wallet
}, {
  title: "Réparations",
  url: "/repairs",
  icon: Wrench
}, {
  title: "Rapports",
  url: "/reports",
  icon: BarChart3
}, {
  title: "Factures",
  url: "/factures",
  icon: FileSpreadsheet
}];

export function AppSidebar() {
  const location = useLocation();
  
  return (
    <Sidebar 
      className="border-none bg-sidebar text-sidebar-foreground min-h-screen shadow-xl w-64 font-tajawal"
      collapsible="offcanvas"
    >
      <SidebarHeader className="border-none p-8 px-0 my-[8px]">
        <div className="flex flex-col items-center gap-3 py-0 px-0 mx-0 my-[7px]">
          <img 
            src="/lovable-uploads/01bf5070-a787-4e88-a192-5511e2f609ce.png" 
            alt="BONATOURS Logo" 
            className="h-16 w-auto object-contain" 
            style={{ maxHeight: 70 }} 
          />
          <div className="text-center">
            <span className="text-sm font-semibold tracking-wide text-sidebar-foreground block">
              Location de Voitures
            </span>
            <span className="text-xs text-sidebar-foreground/80 mt-1 block">
              Système de gestion intégré
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-2 pt-2">
        <SidebarGroup className="rounded-3xl mx-0 px-[6px] py-[2px] my-[10px]">
          <SidebarGroupLabel className="text-sidebar-foreground/70 mb-4 text-base font-semibold">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {menuItems.map(item => (
                <SidebarMenuItem key={item.title} className="my-[10px]">
                  <SidebarMenuButton 
                    asChild 
                    className={`w-full justify-start gap-4 px-6 py-4 rounded-xl font-medium transition-all duration-200 group text-base min-h-[56px]
                      ${location.pathname === item.url 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground ring-2 ring-sidebar-ring ring-offset-2 shadow-lg" 
                        : "hover:bg-sidebar-accent/30 text-sidebar-foreground hover:shadow-md"
                      }
                    `}
                  >
                    <Link to={item.url} className="flex items-center gap-4 mx-[2px] my-[2px] w-full">
                      <item.icon className="h-6 w-6 flex-shrink-0" />
                      <span className="text-base font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border p-4 my-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              className={`w-full justify-start gap-4 px-6 py-4 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/30 text-base min-h-[56px]
                ${location.pathname === '/settings' 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground ring-2 ring-sidebar-ring ring-offset-2 shadow-lg' 
                  : ''
                }
              `}
            >
              <Link to="/settings" className="flex items-center gap-4 mx-[2px] my-[2px] w-full">
                <Settings className="h-6 w-6 flex-shrink-0" />
                <span className="font-medium">Paramètres</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

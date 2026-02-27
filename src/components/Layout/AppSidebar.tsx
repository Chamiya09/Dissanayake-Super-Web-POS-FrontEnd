import { LayoutDashboard, ShoppingCart } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard",    url: "/dashboard", icon: LayoutDashboard },
  { title: "POS Checkout", url: "/",          icon: ShoppingCart    },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar-background">
      {/* Brand */}
      <SidebarHeader className="border-b border-border px-4 py-[14px] group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-[14px]">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white font-extrabold text-sm">
            S
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
            SuperMart
          </span>
        </div>
      </SidebarHeader>

      {/* Nav items */}
      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon className="h-[17px] w-[17px] shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

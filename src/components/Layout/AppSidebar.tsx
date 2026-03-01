import { LayoutDashboard, ShoppingCart, Building2, Package, ReceiptText, Users, LayoutGrid } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";

/* Roles that can see each nav item. Omitting a title = visible to all. */
const NAV_ROLES: Record<string, string[]> = {
  "My Dashboard": ["Staff"],
  "Dashboard":    ["Owner", "Manager"],
  "Products":     ["Owner", "Manager"],
  "Sales":        ["Owner", "Manager"],
  "Suppliers":    ["Owner", "Manager"],
  "Users":        ["Owner", "Manager"],
};

const navItems = [
  { title: "My Dashboard", url: "/staff-dashboard", icon: LayoutGrid       },
  { title: "Dashboard",    url: "/dashboard",       icon: LayoutDashboard  },
  { title: "POS Checkout", url: "/",               icon: ShoppingCart     },
  { title: "Products",     url: "/products",        icon: Package          },
  { title: "Sales",        url: "/sales",           icon: ReceiptText      },
  { title: "Suppliers",    url: "/suppliers",       icon: Building2        },
  { title: "Users",        url: "/users",           icon: Users            },
];

export function AppSidebar() {
  const { user } = useAuth();
  const role = user?.role ?? "Staff";

  const visibleItems = navItems.filter(
    (item) => !NAV_ROLES[item.title] || NAV_ROLES[item.title].includes(role)
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar-background">
      {/* Brand */}
      <SidebarHeader className="border-b border-border px-5 py-5 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-4">
        <div className="flex items-center justify-start gap-3 group-data-[collapsible=icon]:justify-center">
          {/* Expanded: rounded logo + store name */}
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
            <img
              src="/Logo.jpg"
              alt="Supermarket Logo"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-xl object-cover shadow-sm"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold text-sidebar-foreground tracking-widest uppercase">
                Dissanayaka
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">
                Super
              </span>
            </div>
          </div>
          {/* Collapsed (icon mode): square rounded logo only */}
          <div className="hidden h-10 w-10 shrink-0 overflow-hidden rounded-xl group-data-[collapsible=icon]:block">
            <img
              src="/Logo.jpg"
              alt="Supermarket Logo"
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </SidebarHeader>

      {/* Nav items */}
      <SidebarContent className="flex flex-col px-3 pt-8 pb-6 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pt-6">
        {/* Primary navigation — large equal gap between every item */}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-col gap-y-3">
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 rounded-lg px-3 py-4 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:py-4 mx-0.5"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0 group-data-[collapsible=icon]:h-[22px] group-data-[collapsible=icon]:w-[22px]" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom section — pinned to the very bottom */}
        <div className="mt-auto pt-4 border-t border-border group-data-[collapsible=icon]:pt-3">
          {/* Placeholder for future Settings / Logout items */}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

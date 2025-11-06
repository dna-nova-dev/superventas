import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ShoppingCart,
  Tag,
  Users,
  Package,
  Settings,
  CreditCard,
  FileText,
  Menu,
  ChevronLeft,
  Home,
  Wallet,
  Building,
  User,
  LogOut,
  X,
  Sun,
  Moon,
  SidebarClose,
  Truck,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getImageSrc } from "@/utils/imageUtils";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { motion, type Variants } from "framer-motion";
type UserRole = "Administrador" | "Encargado" | "Cajero" | "Owner";
import logo from "/logo.svg";

type NavItem = {
  title: string;
  path: string;
  icon: React.ElementType;
  color?: string;
  roles?: ("Administrador" | "Encargado" | "Cajero" | "Owner")[];
};
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    path: "/",
    icon: Home,
    color: "text-blue-500",
    roles: ["Administrador", "Encargado", "Cajero"],
  },
  {
    title: "Gastos",
    path: "/gastos",
    icon: Wallet,
    color: "text-red-500",
    roles: ["Administrador", "Encargado", "Cajero"],
  },
  {
    title: "Cajas",
    path: "/cajas",
    icon: CreditCard,
    color: "text-orange-500",
    roles: ["Administrador", "Encargado", "Cajero", "Owner"],
  },
  {
    title: "Usuarios",
    path: "/usuarios",
    icon: Users,
    color: "text-green-500",
    roles: ["Administrador", "Encargado", "Owner"],
  },
  {
    title: "Clientes",
    path: "/clientes",
    icon: Users,
    color: "text-purple-500",
    roles: ["Administrador", "Encargado", "Cajero"],
  },
  {
    title: "Proveedores",
    path: "/proveedores",
    icon: Users,
    color: "text-purple-500",
    roles: ["Administrador", "Encargado", "Cajero"],
  },
  {
    title: "Categorías",
    path: "/categorias",
    icon: Tag,
    color: "text-red-500",
    roles: ["Administrador", "Encargado"],
  },
  {
    title: "Productos",
    path: "/productos",
    icon: Package,
    color: "text-teal-500",
    roles: ["Administrador", "Encargado"],
  },
  {
    title: "Ventas",
    path: "/ventas",
    icon: ShoppingCart,
    color: "text-indigo-500",
    roles: ["Administrador", "Encargado", "Cajero"],
  },
  {
    title: "Ventas Pendientes",
    path: "/ventas-pendientes",
    icon: Clock,
    color: "text-amber-500",
    roles: ["Administrador", "Encargado", "Cajero"],
  },
  {
    title: "Compras",
    path: "/compras",
    icon: Truck,
    color: "text-orange-500",
    roles: ["Administrador", "Encargado", "Cajero", "Owner"],
  },
  {
    title: "Empresas",
    path: "/empresas",
    icon: Building,
    color: "text-indigo-500",
    roles: ["Owner"],
  },
  {
    title: "Reportes",
    path: "/reportes",
    icon: FileText,
    color: "text-amber-500",
    roles: ["Administrador"],
  },
  {
    title: "Configuraciones",
    path: "/configuraciones",
    icon: Settings,
    color: "text-gray-500",
    roles: ["Administrador"],
  },
];

const ventaButton: NavItem = {
  title: "Vender",
  path: "/vender",
  icon: ShoppingCart,
  color: "text-green-500",
  roles: ["Administrador", "Encargado", "Cajero"],
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      ease: "easeOut" as const,
    },
  },
};

interface SidebarProps {
  onCloseSidebar?: () => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({
  onCloseSidebar,
  collapsed,
  setCollapsed,
}: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userRole, logout } = useAuth();
  const { canAccessPage } = useRolePermissions();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    });
  };
  const handleNavigateToProfile = () => {
    navigate("/perfil");
    if (onCloseSidebar) {
      onCloseSidebar();
    }
  };
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole as UserRole) && canAccessPage(item.title);
  });
  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "bg-background",
        "dark:border-border"
      )}
    >
      <div className="space-y-4 py-4 flex flex-col h-full">
        <div className="px-3 flex flex-col items-center">
          <div className="flex items-center justify-between w-full gap-14">
            <div className="flex items-center gap-2">
              {theme === "dark" ? (
                <img src={logo} alt="Logo" className="h-12 w-12 invert" />
              ) : (
                <img src={logo} alt="Logo" className="h-12 w-12" />
              )}
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-xl">SuperVentas</span>
                  {!isMobile && (
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs flex items-center gap-1 w-fit">
                      Beta <span className="opacity-60">v1.0</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Botón de cierre para móvil */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onCloseSidebar}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <motion.nav
          className={cn("flex-1 py-4 overflow-y-auto bg-background")}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <div className="px-2">
            {userRole !== "Owner" && (
              <motion.div variants={itemVariants}>
                <Link
                  to={ventaButton.path}
                  className={cn(
                    "flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    "border-2 border-green-500/20 text-green-500",
                    "hover:bg-green-500/10 hover:border-green-500/30",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 group",
                    collapsed ? "justify-center" : "justify-start"
                  )}
                  onClick={onCloseSidebar}
                >
                  <span
                    className={cn(
                      "shrink-0 transition-transform",
                      collapsed ? "mr-0" : "mr-3"
                    )}
                  >
                    <ventaButton.icon size={20} />
                  </span>
                  {!collapsed && (
                    <span className="truncate font-medium">Vender</span>
                  )}
                  {collapsed && (
                    <span className="absolute left-full ml-6 px-2 py-1 text-xs rounded-md bg-popover border shadow-sm whitespace-nowrap opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                      Vender
                    </span>
                  )}
                </Link>
              </motion.div>
            )}
          </div>

          <div className="mt-4 mb-4 px-2">
            <div className="h-[1px] bg-border opacity-50" />
          </div>

          <ul className="space-y-1 px-2">
            {filteredNavItems
              .filter((item) => item.title !== "Vender")
              .map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.li key={item.path} variants={itemVariants}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        "hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80"
                      )}
                      onClick={onCloseSidebar}
                    >
                      <span
                        className={cn(
                          "shrink-0 mr-3 transition-transform",
                          collapsed ? "mr-0" : "mr-3",
                          isActive ? item.color : "text-muted-foreground"
                        )}
                      >
                        <item.icon size={20} />
                      </span>
                      {!collapsed && (
                        <span className="truncate">{item.title}</span>
                      )}
                      {collapsed && (
                        <span className="absolute left-full ml-6 px-2 py-1 text-xs rounded-md bg-popover border shadow-sm whitespace-nowrap opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </motion.li>
                );
              })}
          </ul>
        </motion.nav>

        <div
          className={cn(
            "px-4 py-5 border-t mt-auto",
            "bg-background",
            "dark:border-border"
          )}
        >
          {isMobile && (
            <div className="flex flex-col items-center justify-center space-y-2 text-xs">
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                Beta <span className="opacity-60">v1.0</span>
              </span>
              <span className="text-muted-foreground text-[10px]">
                © {new Date().getFullYear()} SuperVentas
              </span>
            </div>
          )}

          {!isMobile &&
            (!collapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full">
                  <div className="flex items-center space-x-3 w-full">
                    {/* Updated avatar logic: Use initials from 'nombre' */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                      <span>{currentUser?.nombre?.charAt(0) || "A"}</span>
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      {/* Updated name display */}
                      <p className="text-sm font-medium truncate">{`${
                        currentUser?.nombre || ""
                      } ${currentUser?.apellido || ""}`}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="inline-block px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm">
                          {/* userRole comes directly from context, should be correct */}
                          {userRole || "Invitado"}
                        </span>
                      </p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="p-2">
                    {/* Updated name and email display */}
                    <p className="text-sm font-medium">{`${
                      currentUser?.nombre || ""
                    } ${currentUser?.apellido || ""}`}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentUser?.email || ""}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={toggleTheme}
                    className="cursor-pointer flex items-center"
                  >
                    {theme === "dark" ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    <span>
                      {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleNavigateToProfile}
                    className="cursor-pointer flex items-center"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Ver Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer flex items-center text-red-500 focus:text-red-500"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" className="w-8 h-8 p-0">
                        {/* Updated avatar logic: Use initials from 'nombre' */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                          <span>{currentUser?.nombre?.charAt(0) || "A"}</span>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {/* Updated name display */}
                      <p className="font-medium">{`${
                        currentUser?.nombre || ""
                      } ${currentUser?.apellido || ""}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {userRole}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-muted-foreground">
                    v1.0
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

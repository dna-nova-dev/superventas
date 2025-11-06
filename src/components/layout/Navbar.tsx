import React from 'react';
import { Menu, Sun, Moon, User, LogOut, SidebarClose } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getImageSrc } from '@/utils/imageUtils';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  collapsed?: boolean;
  toggleSidebar?: () => void;
}

export const Navbar = ({
  onMenuClick,
  showMenuButton = false,
  collapsed,
  toggleSidebar
}: NavbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente."
    });
  };

  const handleNavigateToProfile = () => {
    navigate('/perfil');
  };

  // Reloj en tiempo real mostrando la hora y fecha del sistema
  const Clock: React.FC = () => {
    const [now, setNow] = React.useState(new Date());

    React.useEffect(() => {
      const interval = setInterval(() => {
        setNow(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    const dateString = now.toLocaleDateString('es-GT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
      <span className="ml-1 flex flex-col items-start font-mono text-xs text-muted-foreground select-none min-w-[150px] leading-tight">
        <span>{dateString}</span>
        <span>{timeString}</span>
      </span>
    );
  };

  return (
    <div className="h-14 border-b bg-card text-card-foreground flex items-center px-4 justify-between shadow-sm">
      <div className="flex items-center">
        {showMenuButton ? (
          <button 
            onClick={onMenuClick} 
            className="mr-4 p-2 rounded-md hover:bg-muted/80 transition-colors" 
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
        ) : (
          !isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 p-1.5"
              onClick={toggleSidebar}
            >
              <SidebarClose className={cn("h-6 w-6 transition-transform", collapsed && "rotate-180")} />
            </Button>
          )
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Clock />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="mr-2"
              aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === 'light' ? "Activar modo oscuro" : "Activar modo claro"}
          </TooltipContent>
        </Tooltip>
        {isMobile && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                    {currentUser?.foto ? (
                      <img 
                        src={getImageSrc(currentUser.foto, 'usuario', currentUser.nombre)} 
                        alt={currentUser.nombre} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span>{currentUser?.nombre?.charAt(0) || 'A'}</span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="p-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {`${currentUser?.nombre} ${currentUser?.apellido}`}
                    </p>
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full">
                      {userRole}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {currentUser?.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNavigateToProfile} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Ver Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};

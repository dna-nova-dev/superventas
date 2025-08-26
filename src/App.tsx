import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Cajas from "./pages/Cajas";
import Compras from "./pages/Compras";
import Usuarios from "./pages/Usuarios";
import Clientes from "./pages/Clientes";
import Categorias from "./pages/Categorias";
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";
import Vender from "./pages/Vender";
import Reportes from "./pages/Reportes";
import Configuraciones from "./pages/Configuraciones";
import Gastos from "./pages/Gastos";
import Empresas from "./pages/Empresas";
import Perfil from "./pages/Perfil";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useEffect } from "react";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import Comprar from "./pages/Comprar";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Creamos un componente separado para la redirección
const AppRoutes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getInitialPage, userRole } = useRolePermissions();

  useEffect(() => {
    if (location.pathname === "/" && userRole === "Cajero") {
      navigate(getInitialPage());
    }
  }, [location.pathname, userRole]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gastos"
        element={
          <ProtectedRoute>
            <Gastos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cajas"
        element={
          <ProtectedRoute>
            <Cajas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <Usuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categorias"
        element={
          <ProtectedRoute>
            <Categorias />
          </ProtectedRoute>
        }
      />
      <Route
        path="/productos"
        element={
          <ProtectedRoute>
            <Productos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ventas"
        element={
          <ProtectedRoute>
            <Ventas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compras"
        element={
          <ProtectedRoute>
            <Compras />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vender"
        element={
          <ProtectedRoute>
            <Vender />
          </ProtectedRoute>
        }
      />
      <Route
        path="/comprar"
        element={
          <ProtectedRoute>
            <Comprar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute>
            <Reportes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuraciones"
        element={
          <ProtectedRoute>
            <Configuraciones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas"
        element={
          <ProtectedRoute>
            <Empresas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/index"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

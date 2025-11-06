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
import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useRolePermissions } from "@/hooks/useRolePermissions";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Cajas = lazy(() => import("./pages/Cajas"));
const Compras = lazy(() => import("./pages/Compras"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Categorias = lazy(() => import("./pages/Categorias"));
const Productos = lazy(() => import("./pages/Productos"));
const Ventas = lazy(() => import("./pages/Ventas"));
const Vender = lazy(() => import("./pages/Vender"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Configuraciones = lazy(() => import("./pages/Configuraciones"));
const Gastos = lazy(() => import("./pages/Gastos"));
const Empresas = lazy(() => import("./pages/Empresas"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Comprar = lazy(() => import("./pages/Comprar"));
const Proveedores = lazy(() => import("./pages/Proveedores"));
const VentasPendientes = lazy(() => import("./pages/VentasPendientes"));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

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
  }, [getInitialPage, location.pathname, navigate, userRole]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
        path="/proveedores"
        element={
          <ProtectedRoute>
            <Proveedores />
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
        path="/ventas-pendientes"
        element={
          <ProtectedRoute>
            <VentasPendientes />
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

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Suspense fallback={<LoadingFallback />}>
                <AppRoutes />
              </Suspense>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;

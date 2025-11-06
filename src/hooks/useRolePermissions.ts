import { useAuth } from './useAuth';

export type ViewMode = 'cards' | 'table' | 'list';

export const useRolePermissions = () => {
  const { userRole } = useAuth();

  const getViewMode = (): ViewMode => {
    switch (userRole) {
      case 'Administrador':
        return 'list';
      case 'Encargado':
      case 'Cajero':
      case 'Owner':
      default:
        return 'cards';
    }
  };

  const canEdit = (page?: string): boolean => {
    if (userRole === 'Administrador' || userRole === 'Encargado') {
      return true;
    }
    if (userRole === 'Cajero' && page === 'clientes') {
      return true;
    }
    if (userRole === 'Owner') {
      return true;
    }
    return false;
  };

  const canDelete = (page?: string): boolean => {
    if (userRole === 'Administrador') {
      return true;
    }
    if (userRole === 'Encargado') {
      if (page === 'configuraciones') return false;
      return true;
    }
    if (userRole === 'Cajero') {
      return false; 
    }
    if (userRole === 'Owner') {
      return true;
    }
    return false;
  };

  const canManageCajas = (): boolean => {
    return userRole === 'Administrador' || userRole === 'Encargado' || userRole === 'Owner';
  };

  const canAccessPage = (page: string): boolean => {
    if (userRole === 'Administrador') {
      return true;
    }
    
    if (userRole === 'Encargado') {
      return page !== 'configuraciones';
    }
    
    if (userRole === 'Cajero') {
      return ['vender', 'gastos', 'cajas', 'ventas', 'clientes'].includes(page.toLowerCase());
    }

    if (userRole === 'Owner') {
      return ['empresas', 'usuarios', 'cajas'].includes(page.toLowerCase());
    }
    
    return false;
  };

  const getInitialPage = (): string => {
    switch (userRole) {
      case 'Cajero':
        return '/vender';
      default:
        return '/';
    }
  };

  return {
    getViewMode,
    canEdit,
    canDelete,
    canManageCajas,
    canAccessPage,
    getInitialPage,
    userRole
  };
};

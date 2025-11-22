import { useState, useEffect, type ReactNode } from "react"
import type { UserResponse } from "@/services/usuarioService"
import type { Empresa } from "@/types"
import { AuthContext } from "./auth/AuthContext"
import { getEmpresaById } from "@/services/empresaService"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(() => {
    const savedUser = localStorage.getItem("user")
    return savedUser ? (JSON.parse(savedUser) as UserResponse) : null
  })

  const [empresa, setEmpresa] = useState<Empresa | null>(() => {
    const savedEmpresa = localStorage.getItem("empresa")
    return savedEmpresa ? (JSON.parse(savedEmpresa) as Empresa) : null
  })

  const [empresaId, setEmpresaId] = useState<number | null>(() => {
    const savedEmpresaId = localStorage.getItem("empresaId")
    return savedEmpresaId ? Number.parseInt(savedEmpresaId, 10) : null
  })

  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentEmpresa, setCurrentEmpresa] = useState<Empresa | null>(null) 

  // Efecto para manejar cambios en el usuario
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      setCurrentUser(user);
      setUserRole(user.cargo);
      
      // Si el usuario tiene una empresa asignada, la establecemos
      if (user.empresaId && !empresaId) {
        console.log('Estableciendo empresaId desde el usuario:', user.empresaId);
        setEmpresaId(user.empresaId);
      }
    } else {
      localStorage.removeItem("user");
      setCurrentUser(null);
      setUserRole(null);
    }
  }, [user, empresaId]); // Incluimos empresaId en las dependencias

  // Efecto para cargar la empresa cuando cambia el usuario o el ID de empresa
  useEffect(() => {
    let isMounted = true;
    
    const logState = () => {
      if (!isMounted) return;
      console.log('useEffect - usuario o empresaId cambiaron:', { 
        userId: user?.id, 
        empresaId,
        currentEmpresaId: currentEmpresa?.id 
      });
    };
    
    logState();

    // Si no hay usuario o no hay empresaId, limpiamos
    if (!user || !empresaId) {
      console.log('No hay usuario o empresaId, limpiando...');
      if (currentEmpresa) {
        setCurrentEmpresa(null);
      }
      return () => {
        isMounted = false;
      };
    }

    // Si ya tenemos la empresa correcta, no hacemos nada
    if (currentEmpresa?.id === empresaId) {
      console.log('La empresa actual ya está cargada:', currentEmpresa);
      return () => {
        isMounted = false;
      };
    }

    // Función para cargar la empresa
    const cargarEmpresa = async () => {
      console.log('Intentando cargar empresa con ID:', empresaId);
      
      if (!empresaId) {
        console.log('No hay empresaId, no se puede cargar la empresa');
        setCurrentEmpresa(null);
        return;
      }

      try {
        // 1. Try loading from localStorage first
        const savedEmpresa = localStorage.getItem(`empresa_${empresaId}`);
        if (savedEmpresa) {
          try {
            const parsedEmpresa = JSON.parse(savedEmpresa) as Empresa;
            if (parsedEmpresa && parsedEmpresa.id === empresaId) {
              console.log('Empresa cargada desde localStorage:', parsedEmpresa);
              console.log('Estableciendo currentEmpresa desde localStorage...');
              
              // Usar setTimeout para asegurar que la actualización del estado se complete
              setTimeout(() => {
                setCurrentEmpresa(prevEmpresa => {
                  console.log('Estado anterior de currentEmpresa:', prevEmpresa);
                  console.log('Nuevo estado de currentEmpresa:', parsedEmpresa);
                  return parsedEmpresa;
                });
              }, 0);
              
              return;
            }
          } catch (error) {
            console.error('Error al analizar la empresa del localStorage:', error);
            // Clear invalid data from localStorage
            localStorage.removeItem(`empresa_${empresaId}`);
          }
        }

        // 2. Try loading from API
        console.log('Buscando empresa en la API...');
        try {
          const empresaData = await getEmpresaById(empresaId);
          if (empresaData) {
            console.log('Empresa cargada desde la API:', empresaData);
            // Save to localStorage for future use
            localStorage.setItem(`empresa_${empresaId}`, JSON.stringify(empresaData));
            console.log('Estableciendo currentEmpresa desde API...');
            setCurrentEmpresa(prevEmpresa => {
              console.log('Estado anterior de currentEmpresa:', prevEmpresa);
              return empresaData;
            });
            return;
          }
        } catch (apiError) {
          console.error('Error al cargar la empresa desde la API:', apiError);
          // Continue to create temp company
        }

        // 3. Create a temporary company as fallback
        console.log('Creando empresa temporal...');
        const empresaTemporal: Empresa = {
          id: empresaId,
          nombre: `Empresa ${empresaId}`,
          nit: '',
          telefono: '',
          email: '',
          direccion: '',
          owner: user?.id || 0, // Use optional chaining with fallback
          foto: ''
        };
        
        // Save the temporary company to localStorage
        localStorage.setItem(`empresa_${empresaId}`, JSON.stringify(empresaTemporal));
        console.log('Estableciendo currentEmpresa con empresa temporal...');
        setCurrentEmpresa(prevEmpresa => {
          console.log('Estado anterior de currentEmpresa:', prevEmpresa);
          return empresaTemporal;
        });
        
      } catch (error) {
        console.error('Error inesperado al cargar la empresa:', error);
        // Create an emergency company as last resort
        const empresaEmergencia: Empresa = {
          id: empresaId,
          nombre: 'Empresa Temporal',
          nit: '',
          telefono: '',
          email: '',
          direccion: '',
          owner: user?.id || 0,
          foto: ''
        };
        // Save emergency company to localStorage
        localStorage.setItem(`empresa_${empresaId}`, JSON.stringify(empresaEmergencia));
        console.log('Estableciendo currentEmpresa con empresa de emergencia...');
        setCurrentEmpresa(prevEmpresa => {
          console.log('Estado anterior de currentEmpresa:', prevEmpresa);
          return empresaEmergencia;
        });
      }
    };

    // Usar setTimeout para asegurar que el efecto se ejecute después de que el estado se haya actualizado
    const timer = setTimeout(() => {
      if (isMounted) {
        cargarEmpresa();
      }
    }, 0);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [user, empresaId]); // Eliminamos currentEmpresa de las dependencias

  useEffect(() => {
    if (userRole === "Owner") {
      localStorage.removeItem("empresa")
      setCurrentEmpresa(null)
      setEmpresaId(null)
      return 
    }
    if (empresa) {
      localStorage.setItem("empresa", JSON.stringify(empresa))
      setEmpresaId(empresa.id)
      setCurrentEmpresa(empresa)
    } else {
      localStorage.removeItem("empresa")
      setCurrentEmpresa(null) 
    }
  }, [empresa, userRole]) 

  useEffect(() => {
    if (userRole === "Owner") {
      setEmpresa(null)
      setCurrentEmpresa(null)
      setEmpresaId(null)
      localStorage.removeItem("empresa")
      localStorage.removeItem("empresaId")
    }
  }, [userRole])

  const logout = () => {
    setUser(null)
    setCurrentUser(null)
    setUserRole(null)
    setEmpresa(null)
    setEmpresaId(null)
    setCurrentEmpresa(null)
    localStorage.removeItem("user")
    localStorage.removeItem("empresa")
    localStorage.removeItem("empresaId")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        currentUser,
        userRole,
        empresa,
        setEmpresa,
        empresaId,
        setEmpresaId,
        currentEmpresa,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// No es necesario exportar AuthContextType aquí, ya que se exporta desde types.ts

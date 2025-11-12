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
    console.log('useEffect - usuario o empresaId cambiaron:', { 
      userId: user?.id, 
      empresaId,
      currentEmpresa: currentEmpresa?.id 
    });

    // Si no hay usuario o no hay empresaId, limpiamos
    if (!user || !empresaId) {
      console.log('No hay usuario o empresaId, limpiando...');
      if (currentEmpresa) setCurrentEmpresa(null);
      return;
    }

    // Si ya tenemos la empresa correcta, no hacemos nada
    if (currentEmpresa?.id === empresaId) {
      console.log('La empresa actual ya está cargada:', currentEmpresa);
      return;
    }

    // Función para cargar la empresa
    const cargarEmpresa = async () => {
      console.log('Intentando cargar empresa con ID:', empresaId);
      
      try {
        // Primero intentamos cargar la empresa desde el localStorage
        const savedEmpresa = localStorage.getItem(`empresa_${empresaId}`);
        if (savedEmpresa) {
          try {
            const parsedEmpresa = JSON.parse(savedEmpresa) as Empresa;
            if (parsedEmpresa && parsedEmpresa.id === empresaId) {
              console.log('Empresa cargada desde localStorage:', parsedEmpresa);
              setCurrentEmpresa(parsedEmpresa);
              return;
            }
          } catch (error) {
            console.error('Error al analizar la empresa del localStorage:', error);
          }
        }

        // Si no está en el localStorage, intentamos cargarla de la API
        console.log('Buscando empresa en la API...');
        try {
          const empresaData = await getEmpresaById(empresaId);
          if (empresaData) {
            console.log('Empresa cargada desde la API:', empresaData);
            // Guardamos en localStorage para futuras cargas
            localStorage.setItem(`empresa_${empresaId}`, JSON.stringify(empresaData));
            setCurrentEmpresa(empresaData);
            return;
          }
        } catch (error) {
          console.error('Error al cargar la empresa desde la API:', error);
          // Continuamos con la creación de una empresa temporal
        }

        // Si no se pudo cargar, creamos una empresa temporal
        console.log('Creando empresa temporal...');
        const empresaTemporal: Empresa = {
          id: empresaId,
          nombre: `Empresa ${empresaId}`,
          nit: '',
          telefono: '',
          email: '',
          direccion: '',
          owner: user.id, // Usamos el ID del usuario actual como propietario
          foto: ''
        };
        
        setCurrentEmpresa(empresaTemporal);
        
      } catch (error) {
        console.error('Error al cargar la empresa:', error);
        // En caso de error, creamos una empresa temporal de emergencia
        const empresaEmergencia: Empresa = {
          id: empresaId,
          nombre: 'Empresa Temporal',
          nit: '',
          telefono: '',
          email: '',
          direccion: '',
          owner: user.id,
          foto: ''
        };
        setCurrentEmpresa(empresaEmergencia);
      }
    };

    cargarEmpresa();
  }, [user, empresaId, currentEmpresa]); // Incluimos currentEmpresa en las dependencias

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

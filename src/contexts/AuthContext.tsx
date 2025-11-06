import { useState, useEffect, type ReactNode } from "react"
import type { UserResponse } from "@/services/usuarioService"
import type { Empresa } from "@/types"
import { AuthContext } from "./auth/AuthContext"

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

  useEffect(() => {
    if (empresaId !== null) {
      localStorage.setItem("empresaId", empresaId.toString())
    } else {
      localStorage.removeItem("empresaId")
    }
  }, [empresaId])

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

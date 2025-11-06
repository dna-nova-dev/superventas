import type { UserResponse } from "@/services/usuarioService"
import type { Empresa } from "@/types"

export interface AuthContextType {
  user: UserResponse | null
  setUser: (user: UserResponse | null) => void
  logout: () => void
  currentUser: UserResponse | null
  userRole: string | null
  empresa: Empresa | null
  setEmpresa: (empresa: Empresa | null) => void
  empresaId: number | null
  setEmpresaId: (id: number | null) => void
  currentEmpresa: Empresa | null
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Building } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { SettingsCard } from "./SettingsCard"
import type { Empresa } from "@/types"
import { getEmpresaById, updateEmpresa } from "@/services/empresaService"
import { Button } from "@/components/ui/button"

interface ConfiguracionEmpresaProps {
  empresaId: number | null
}

export const ConfiguracionEmpresa = ({ empresaId }: ConfiguracionEmpresaProps) => {
  const { toast } = useToast()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    foto: "",
  })

  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!empresaId) return

      try {
        setLoading(true)
        const data = await getEmpresaById(empresaId)
        setEmpresa(data)
        setFormData({
          nombre: data.nombre || "",
          telefono: data.telefono || "",
          email: data.email || "",
          direccion: data.direccion || "",
          foto: data.foto || "",
        })
      } catch (error) {
        console.error("Error al cargar datos de la empresa:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de la empresa",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresa()
  }, [empresaId, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveEmpresa = async () => {
    if (!empresaId || !empresa) return

    try {
      setLoading(true)
      await updateEmpresa(empresaId, formData)
      toast({
        title: "Configuración guardada",
        description: "Los datos de la empresa han sido actualizados",
      })
    } catch (error) {
      console.error("Error al actualizar la empresa:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !empresa) {
    return <div className="p-4 text-center">Cargando datos de la empresa...</div>
  }

  return (
    <SettingsCard title="Datos de la Empresa" icon={Building} description="Información general de la empresa">
      <div className="space-y-4">
        <div>
          <label htmlFor="nombre" className="text-sm font-medium mb-1 block">
            Nombre de la Empresa
          </label>
          <Input
            id="nombre"
            name="nombre"
            type="text"
            value={formData.nombre}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="telefono" className="text-sm font-medium mb-1 block">
            Teléfono
          </label>
          <Input
            id="telefono"
            name="telefono"
            type="text"
            value={formData.telefono}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium mb-1 block">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="direccion" className="text-sm font-medium mb-1 block">
            Dirección
          </label>
          <Input
            id="direccion"
            name="direccion"
            type="text"
            value={formData.direccion}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Logo</label>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
              {formData.foto ? (
                <img src={formData.foto || "/placeholder.svg"} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <button className="text-sm text-blue-500 hover:underline">Cambiar logo</button>
          </div>
        </div>
        <div className="pt-3 border-t flex justify-end">
          <Button onClick={handleSaveEmpresa} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </SettingsCard>
  )
}


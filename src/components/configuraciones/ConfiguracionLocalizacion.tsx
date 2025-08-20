"use client"

import { useState } from "react"
import { Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SettingsCard } from "./SettingsCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export const ConfiguracionLocalizacion = () => {
  const { toast } = useToast()
  const [idioma, setIdioma] = useState("es")

  const handleChangeIdioma = (value: string) => {
    setIdioma(value)
    toast({
      title: "Idioma cambiado",
      description: `El idioma del sistema ha sido cambiado a ${value === "es" ? "Español" : "English"}`,
    })
  }

  return (
    <SettingsCard title="Localización" icon={Globe} description="Configuración regional del sistema">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Idioma</label>
          <Select value={idioma} onValueChange={handleChangeIdioma}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Formato de Fecha</label>
          <Select defaultValue="DD/MM/YYYY">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar formato de fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Moneda</label>
          <Select defaultValue="GTQ">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GTQ">GTQ - Quetzal Guatemalteco</SelectItem>
              <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="pt-3 border-t flex justify-end">
          <Button>Guardar Cambios</Button>
        </div>
      </div>
    </SettingsCard>
  )
}


import { Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SettingsCard } from "./SettingsCard"
import { Button } from "@/components/ui/button"

export const ConfiguracionBaseDatos = () => {
  const { toast } = useToast()

  const handleBackupDatabase = () => {
    toast({
      title: "Respaldo creado",
      description: "Se ha creado un respaldo de la base de datos",
    })
  }

  return (
    <SettingsCard title="Base de Datos" icon={Database} description="Gestión de la base de datos">
      <div className="space-y-4">
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm">Último respaldo:</span>
            <span className="text-sm font-medium">Hoy, 15:30</span>
          </div>
        </div>
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm">Tamaño de la BD:</span>
            <span className="text-sm font-medium">12.5 MB</span>
          </div>
        </div>
        <div className="pt-3 border-t flex flex-col md:flex-row md:justify-between gap-2">
          <Button variant="outline">Restaurar BD</Button>
          <Button onClick={handleBackupDatabase}>Crear Respaldo</Button>
        </div>
      </div>
    </SettingsCard>
  )
}


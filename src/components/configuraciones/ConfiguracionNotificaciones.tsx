import { useState } from "react"
import { Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SettingsCard } from "./SettingsCard"
import { Switch } from "@/components/ui/switch"

export const ConfiguracionNotificaciones = () => {
  const { toast } = useToast()
  const [notificaciones, setNotificaciones] = useState(true)

  const handleToggleNotificaciones = () => {
    setNotificaciones(!notificaciones)
    toast({
      title: notificaciones ? "Notificaciones desactivadas" : "Notificaciones activadas",
      description: "La configuración de notificaciones ha sido actualizada",
    })
  }

  return (
    <SettingsCard title="Notificaciones" icon={Bell} description="Configuración de alertas y notificaciones">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm">Activar Notificaciones</label>
          <Switch checked={notificaciones} onCheckedChange={handleToggleNotificaciones} />
        </div>
        <div className="border-t pt-4">
          <label className="text-sm font-medium mb-2 block">Notificar sobre</label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input type="checkbox" defaultChecked id="notif1" className="mr-2" />
              <label htmlFor="notif1" className="text-sm">
                Ventas nuevas
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" defaultChecked id="notif2" className="mr-2" />
              <label htmlFor="notif2" className="text-sm">
                Stock bajo
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" defaultChecked id="notif3" className="mr-2" />
              <label htmlFor="notif3" className="text-sm">
                Nuevos clientes
              </label>
            </div>
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}


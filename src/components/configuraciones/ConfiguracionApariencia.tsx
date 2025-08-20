
import { useState } from "react"
import { Palette, Moon, Sun } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SettingsCard } from "./SettingsCard"

export const ConfiguracionApariencia = () => {
  const { toast } = useToast()
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    toast({
      title: isDarkMode ? "Modo claro activado" : "Modo oscuro activado",
      description: "La apariencia del sistema ha sido actualizada",
    })
  }

  return (
    <SettingsCard title="Apariencia" icon={Palette} description="Personalización visual del sistema">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm">Modo Oscuro</label>
          <button
            onClick={handleToggleDarkMode}
            className={`p-1.5 rounded-full ${isDarkMode ? "bg-gray-800" : "bg-blue-500"}`}
          >
            {isDarkMode ? <Moon className="h-5 w-5 text-white" /> : <Sun className="h-5 w-5 text-white" />}
          </button>
        </div>
        <div className="border-t pt-4">
          <label className="text-sm font-medium mb-2 block">Tamaño de Fuente</label>
          <div className="flex items-center space-x-2">
            <span className="text-sm">A</span>
            <input type="range" min="1" max="3" defaultValue="2" className="flex-1" />
            <span className="text-lg">A</span>
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}


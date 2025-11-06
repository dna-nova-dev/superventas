import { useState } from "react"
import { Layout } from "@/components/layout/Layout"
import { Settings, Building, Bell, Database, Globe, Palette } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { useAuth } from "@/hooks/useAuth"
import { ConfiguracionEmpresa } from "@/components/configuraciones/ConfiguracionEmpresa"
import { ConfiguracionBaseDatos } from "@/components/configuraciones/ConfiguracionBaseDatos"
import { ConfiguracionApariencia } from "@/components/configuraciones/ConfiguracionApariencia"
import { ConfiguracionNotificaciones } from "@/components/configuraciones/ConfiguracionNotificaciones"
import { ConfiguracionLocalizacion } from "@/components/configuraciones/ConfiguracionLocalizacion"

type ConfigType = "empresa" | "database" | "apariencia" | "notificaciones" | "localizacion"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
}

const Configuraciones = () => {
  const { empresaId } = useAuth()
  const isMobile = useIsMobile()
  const [activeConfig, setActiveConfig] = useState<ConfigType>("empresa")

  const configOptions = [
    { id: "empresa", label: "Empresa", icon: Building },
    { id: "database", label: "Base de Datos", icon: Database },
    { id: "apariencia", label: "Apariencia", icon: Palette },
    { id: "notificaciones", label: "Notificaciones", icon: Bell },
    { id: "localizacion", label: "Localización", icon: Globe },
  ]

  const renderActiveConfig = () => {
    switch (activeConfig) {
      case "empresa":
        return <ConfiguracionEmpresa empresaId={empresaId} />
      case "database":
        return <ConfiguracionBaseDatos />
      case "apariencia":
        return <ConfiguracionApariencia />
      case "notificaciones":
        return <ConfiguracionNotificaciones />
      case "localizacion":
        return <ConfiguracionLocalizacion />
      default:
        return null
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-gray-500" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configuraciones</h1>
              <p className="text-muted-foreground">Configure los parámetros del sistema.</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="empresa" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            {configOptions.map((option) => (
              <TabsTrigger
                key={option.id}
                value={option.id}
                onClick={() => setActiveConfig(option.id as ConfigType)}
                className="data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border-primary data-[state=active]:border-b-2 rounded-none border-b-2 border-transparent px-4 py-3"
              >
                <option.icon className="h-4 w-4 mr-2" />
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {configOptions.map((option) => (
            <TabsContent key={option.id} value={option.id} className="p-0 mt-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="bg-transparent rounded-xl border shadow-sm"
              >
                {activeConfig === option.id && renderActiveConfig()}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  )
}

export default Configuraciones



interface SettingsCardProps {
  title: string
  icon: React.ElementType
  description: string
  onClick?: () => void
  children?: React.ReactNode
}

export const SettingsCard = ({ title, icon: Icon, description, onClick, children }: SettingsCardProps) => (
  <div className="bg-transparent rounded-xl border shadow-sm p-4 md:p-6 transition-all card-hover" onClick={onClick}>
    <div className="flex items-center space-x-4 mb-4">
      <div className="p-3 rounded-full bg-gray-100">
        <Icon className="h-5 w-5 text-gray-500" />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>

    {children}
  </div>
)


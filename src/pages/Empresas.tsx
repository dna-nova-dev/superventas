"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { Layout } from "@/components/layout/Layout"
import { DataTable, DataTableActions } from "@/components/ui/DataTable"
import { useToast } from "@/hooks/use-toast"
import { Building, Plus, Search, PenSquare, XSquare } from "lucide-react"
import type { Empresa, CreateEmpresa } from "@/types"
import { useRolePermissions } from "@/hooks/useRolePermissions"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getImageSrc } from "@/utils/imageUtils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getAllEmpresas, deleteEmpresa, createEmpresa, updateEmpresa } from "@/services/empresaService"
import { useIsMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMediaQuery } from "@/hooks/use-media-query"
import { usuarioService } from "@/services/usuarioService"
import type { Usuario } from "@/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const tableVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
}

// Componente de formulario con manejo de estado local para evitar re-renderizados
const EmpresaForm = ({
  initialData,
  onSubmit,
  isEditing,
  onCancel,
  administradores,
}: {
  initialData: CreateEmpresa
  onSubmit: (data: CreateEmpresa) => Promise<void>
  isEditing: boolean
  onCancel: () => void
  administradores: Usuario[]
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [localFormData, setLocalFormData] = useState<CreateEmpresa>(initialData)

  // Actualizar datos locales cuando cambian los datos iniciales
  useEffect(() => {
    setLocalFormData(initialData)
  }, [initialData])

  // Funciones de manejo de cambios memoizadas para evitar recreaciones
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setLocalFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }, [])

  const handleOwnerChange = useCallback((value: string) => {
    setLocalFormData((prev) => ({
      ...prev,
      owner: Number.parseInt(value, 10),
    }))
  }, [])

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(localFormData)
    },
    [localFormData, onSubmit],
  )

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Empresa</Label>
            <Input id="nombre" value={localFormData.nombre} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nit">NIT</Label>
            <Input id="nit" value={localFormData.nit} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={localFormData.email} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" value={localFormData.telefono} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" value={localFormData.direccion} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="foto">URL Foto (opcional)</Label>
            <Input id="foto" type="url" value={localFormData.foto} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner">Dueño (Administrador)</Label>
        <Select
          value={localFormData.owner ? localFormData.owner.toString() : ""}
          onValueChange={handleOwnerChange}
          disabled={administradores.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={administradores.length === 0 ? "Cargando administradores..." : "Seleccione un administrador"}
            />
          </SelectTrigger>
          <SelectContent>
            {administradores.length === 0 ? (
              <SelectItem value="loading" disabled>
                Cargando administradores...
              </SelectItem>
            ) : (
              administradores.map((admin) => (
                <SelectItem key={admin.usuario_id} value={admin.usuario_id.toString()}>
                  {admin.usuario_nombre} {admin.usuario_apellido}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {isDesktop && (
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">{isEditing ? "Actualizar Empresa" : "Guardar Empresa"}</Button>
        </div>
      )}
    </form>
  )
}

const Empresas = () => {
  const { toast } = useToast()
  const { getViewMode, canEdit, canDelete } = useRolePermissions()
  const [formData, setFormData] = useState<CreateEmpresa>({
    nombre: "",
    nit: "",
    telefono: "",
    owner: 0,
    email: "",
    direccion: "",
    foto: "",
  })
  const viewMode = getViewMode()
  const [searchQuery, setSearchQuery] = useState("")
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(null)
  const isMobile = useIsMobile()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null)
  const [administradores, setAdministradores] = useState<Usuario[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)

  const { user } = useAuth()

  const fetchEmpresas = async () => {
    try {
      const response = await getAllEmpresas()
      // Si el usuario es administrador, mostrar todas las empresas
      // Si no, filtrar solo las empresas del usuario
      const filteredEmpresas = user?.cargo === 'Administrador' 
        ? response 
        : response.filter(empresa => empresa.owner === user?.id)
      
      setEmpresas(filteredEmpresas)
    } catch (error) {
      console.error("Error al cargar empresas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las empresas",
        variant: "destructive",
      })
    }
  }

  const fetchAdministradores = async () => {
    if (loadingAdmins) return // Evitar múltiples solicitudes simultáneas

    setLoadingAdmins(true)
    try {
      const usuarios = await usuarioService.getAllUsuarios()
      // Filter to only include users with the "Administrador" role
      const admins = usuarios.filter((user) => user.usuario_cargo === "Administrador")
      setAdministradores(admins)
    } catch (error) {
      console.error("Error al cargar administradores:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los administradores",
        variant: "destructive",
      })
    } finally {
      setLoadingAdmins(false)
    }
  }

  // Cargar datos solo una vez al montar el componente
  useEffect(() => {
    fetchEmpresas()
    fetchAdministradores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      nombre: "",
      nit: "",
      telefono: "",
      owner: 0,
      email: "",
      direccion: "",
      foto: "",
    })
    setIsEditing(false)
    setSelectedEmpresaId(null)
  }, [])

  const handleRowClick = useCallback(
    (empresa: Empresa) => {
      toast({
        title: empresa.nombre,
        description: `Email: ${empresa.email}, Teléfono: ${empresa.telefono}`,
      })
    },
    [toast],
  )

  const handleEdit = useCallback((empresa: Empresa) => {
    setFormData({
      nombre: empresa.nombre,
      nit: empresa.nit,
      telefono: empresa.telefono,
      owner: empresa.owner,
      email: empresa.email,
      direccion: empresa.direccion,
      foto: empresa.foto || "",
    })
    setIsEditing(true)
    setSelectedEmpresaId(empresa.id)
    setShowModal(true)
  }, [])

  const handleDelete = useCallback((empresa: Empresa) => {
    setEmpresaToDelete(empresa)
    setShowDeleteDialog(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!empresaToDelete) return

    try {
      await deleteEmpresa(empresaToDelete.id)
      toast({
        title: "Empresa eliminada",
        description: "La empresa ha sido eliminada exitosamente",
      })
      await fetchEmpresas()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la empresa",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setEmpresaToDelete(null)
    }
  }, [empresaToDelete, toast])

  const columns = [
    {
      header: "ID",
      accessor: (empresa: Empresa) => empresa.id.toString(),
      className: "w-[60px]",
    },
    {
      header: "Empresa",
      accessor: (empresa: Empresa) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
            {empresa.foto ? (
              <img
                src={getImageSrc(empresa.foto, "empresa", empresa.nombre) || "/placeholder.svg"}
                alt={empresa.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <div className="font-medium">{empresa.nombre}</div>
            <div className="text-xs text-muted-foreground">{empresa.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Teléfono",
      accessor: (empresa: Empresa) => empresa.telefono,
    },
    {
      header: "Dirección",
      accessor: (empresa: Empresa) => empresa.direccion,
    },
  ]

  const handleAddEmpresa = useCallback(() => {
    resetForm()
    setShowModal(true)
  }, [resetForm])

  const handleSubmitForm = useCallback(
    async (data: CreateEmpresa) => {
      try {
        if (isEditing && selectedEmpresaId) {
          await updateEmpresa(selectedEmpresaId, data)
          toast({
            title: "Empresa actualizada",
            description: "La empresa se ha actualizado exitosamente",
          })
        } else {
          await createEmpresa(data)
          toast({
            title: "Empresa creada",
            description: "La empresa se ha registrado exitosamente",
          })
        }

        setShowModal(false)
        resetForm()
        await fetchEmpresas()
      } catch (error) {
        toast({
          title: "Error",
          description: isEditing ? "No se pudo actualizar la empresa" : "No se pudo crear la empresa",
          variant: "destructive",
        })
      }
    },
    [isEditing, selectedEmpresaId, toast, resetForm],
  )

  const filteredEmpresas = searchQuery
    ? empresas.filter(
        (empresa) =>
          empresa.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          empresa.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : empresas

  const DeleteConfirmationDialog = () => {
    if (!isMobile) {
      return (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la empresa y todos sus datos asociados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }

    return (
      <Drawer open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>¿Está seguro?</DrawerTitle>
            <DrawerDescription>Esta acción no se puede deshacer</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              Se eliminará permanentemente la empresa y todos sus datos asociados.
            </p>
          </div>
          <DrawerFooter>
            <Button variant="destructive" onClick={handleConfirmDelete} className="w-full">
              Eliminar empresa
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  const ModalContent = () => (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar Empresa" : "Nueva Empresa"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Modifique los datos de la empresa" : "Complete los datos para registrar una nueva empresa"}
        </DialogDescription>
      </DialogHeader>
      <EmpresaForm
        initialData={formData}
        onSubmit={handleSubmitForm}
        isEditing={isEditing}
        onCancel={() => setShowModal(false)}
        administradores={administradores}
      />
      {isMobile && (
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button onClick={() => handleSubmitForm(formData)}>{isEditing ? "Actualizar" : "Guardar"}</Button>
        </div>
      )}
    </>
  )

  return (
    <Layout>
      <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="show">
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Building className="mr-3 h-8 w-8 text-indigo-500" />
            Empresas
          </h1>
          <p className="text-muted-foreground">Administre las empresas registradas en el sistema.</p>
        </motion.div>

        {/* Cards view */}
        {viewMode === "cards" && (
          <>
            {/* Search and Add button */}
            <motion.div variants={itemVariants} className="flex justify-between items-center mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-full sm:w-[300px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {canEdit() && (
                <button
                  onClick={handleAddEmpresa}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Empresa
                </button>
              )}
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" variants={containerVariants}>
              {filteredEmpresas.map((empresa) => (
                <motion.div
                  key={empresa.id}
                  variants={itemVariants}
                  className="overflow-hidden transition-all card-hover"
                >
                  <Card className="overflow-hidden transition-all card-hover">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>{empresa.nombre}</CardTitle>
                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
                          {empresa.foto ? (
                            <img
                              src={getImageSrc(empresa.foto, "empresa", empresa.nombre) || "/placeholder.svg"}
                              alt={empresa.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="grid grid-cols-[100px_1fr] text-sm">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{empresa.email}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] text-sm">
                          <span className="text-muted-foreground">Teléfono:</span>
                          <span>{empresa.telefono}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr] text-sm">
                          <span className="text-muted-foreground">Dirección:</span>
                          <span>{empresa.direccion}</span>
                        </div>
                      </div>

                      {canEdit() && (
                        <div className="mt-4 pt-4 border-t flex justify-between">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleEdit(empresa)}
                                  className="p-2 rounded-md hover:bg-blue-50 text-blue-500 border border-blue-200"
                                >
                                  <PenSquare className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar empresa</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {canDelete() && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleDelete(empresa)}
                                    className="p-2 rounded-md hover:bg-red-50 text-red-500 border border-red-200"
                                  >
                                    <XSquare className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar empresa</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Add new empresa card for Encargado role */}
              {canEdit() && (
                <motion.div
                  key="add-new-empresa"
                  variants={itemVariants}
                  onClick={handleAddEmpresa}
                  className="flex flex-col items-center justify-center p-6 cursor-pointer border-dashed hover:border-primary/60 hover:bg-primary/5 transition-colors"
                >
                  <Card className="flex flex-col items-center justify-center p-6 cursor-pointer border-dashed hover:border-primary/60 hover:bg-primary/5 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg mb-2">Nueva Empresa</CardTitle>
                    <p className="text-sm text-muted-foreground text-center">
                      Haga clic para registrar una nueva empresa en el sistema
                    </p>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </>
        )}

        {viewMode === "list" && (
          <motion.div variants={tableVariants} initial="hidden" animate="show">
            <DataTable
              data={filteredEmpresas}
              columns={columns}
              title="Listado de Empresas"
              description="Empresas registradas en el sistema"
              onRowClick={handleRowClick}
              searchKeys={["nombre", "email"]}
              searchPlaceholder="Buscar empresa..."
              actions={canEdit() ? <DataTableActions onAdd={handleAddEmpresa} addLabel="Nueva Empresa" /> : null}
              onEdit={canEdit() ? handleEdit : undefined}
              onDelete={canDelete() ? handleDelete : undefined}
              className="transition-all hover:scale-[1.01]"
            />
          </motion.div>
        )}
      </motion.div>

      {isMobile ? (
        <Drawer open={showModal} onOpenChange={setShowModal}>
          <DrawerContent>
            <ModalContent />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[600px]">
            <ModalContent />
          </DialogContent>
        </Dialog>
      )}

      <DeleteConfirmationDialog />
    </Layout>
  )
}

export default Empresas


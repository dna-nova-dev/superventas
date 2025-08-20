import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Categoria } from "@/types";
import { useEffect, useState } from "react";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { nombre: string; ubicacion: string }) => void;
  categoria?: Categoria;
  mode: 'create' | 'edit';
}

export function CategoryDialog({ open, onOpenChange, onSubmit, categoria, mode }: CategoryDialogProps) {
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");

  useEffect(() => {
    if (categoria && mode === 'edit') {
      setNombre(categoria.nombre);
      setUbicacion(categoria.ubicacion);
    } else {
      setNombre("");
      setUbicacion("");
    }
  }, [categoria, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ nombre, ubicacion });
    if (mode === 'create') {
      setNombre("");
      setUbicacion("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' ? 'Ingrese los detalles de la nueva categoría' : 'Modifique los detalles de la categoría'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="nombre">Nombre</label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la categoría"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="ubicacion">Ubicación</label>
              <Input
                id="ubicacion"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ubicación de la categoría"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{mode === 'create' ? 'Crear categoría' : 'Guardar cambios'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

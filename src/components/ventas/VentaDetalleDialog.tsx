import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { formatCurrency } from "@/data/mockData";
import { Venta } from "@/types";
import { useEffect, useState } from "react";
import { getVentaDetalles, getVentaDetalleById, createVentaDetalle, updateVentaDetalle, deleteVentaDetalle, getDetallesByVentaId, getVentaDetalleByCodigo} from '@/services/ventaDetalleService';

interface VentaDetalleDialogProps {
  venta: Venta | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VentaDetalleDialog({ venta, isOpen, onClose }: VentaDetalleDialogProps) {
  const [detalles, setDetalles] = useState<any[]>([]);

  useEffect(() => {
    const loadDetalles = async () => {
      if (venta) {
        const data = await getDetallesByVentaId(venta.id);
        setDetalles(data);
      }
    };
    
    loadDetalles();
  }, [venta]);

  if (!venta) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Venta #{venta.codigo}</DialogTitle>
        </DialogHeader>
        
        <div className="text-sm space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span>{new Date(venta.fecha).toLocaleDateString('es-GT')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hora:</span>
              <span>{venta.hora}</span>
            </div>
          </div>

          <ScrollArea className="h-[200px] rounded-md border p-4">
            <div className="space-y-4">
              <div className="text-xs font-medium grid grid-cols-4 gap-2">
                <div>Cant.</div>
                <div className="col-span-2">Producto</div>
                <div className="text-right">Total</div>
              </div>
              
              {detalles.map((detalle, index) => (
                <div key={index} className="text-sm grid grid-cols-4 gap-2">
                  <div>{detalle.venta_detalle_cantidad}</div>
                  <div className="col-span-2">{detalle.venta_detalle_descripcion}</div>
                  <div className="text-right">
                    {formatCurrency(detalle.venta_detalle_cantidad * parseFloat(detalle.venta_detalle_precio_venta))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="pt-4 space-y-2">
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatCurrency(venta.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pagado:</span>
              <span>{formatCurrency(venta.pagado)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cambio:</span>
              <span>{formatCurrency(venta.cambio)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

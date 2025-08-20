export interface GastoFormValues {
  razon: string;
  monto: string;
  fondo: 'Efectivo' | 'Transferencia' | 'Tarjeta';
  id: string;
}

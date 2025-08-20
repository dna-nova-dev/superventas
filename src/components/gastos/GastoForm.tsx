import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { GastoFormValues } from '@/types/gastos';
// Removed DialogFooter, DialogClose imports

interface GastoFormProps {
  form: UseFormReturn<Partial<GastoFormValues>>;
  onSubmit: (values: GastoFormValues) => Promise<void>;
  cajas: any[];
  isEditing: boolean; // Add isEditing prop
  // Optional: Add an onCancel prop if needed, otherwise DialogClose can handle it
  // onCancel?: () => void; 
}

export function GastoForm({ form, onSubmit, cajas, isEditing }: GastoFormProps) {
  // Removed isEditing calculation here, it's now passed as a prop

  return (
    <Form {...form}>
      {/* Use a div to wrap form fields and footer */}
      {/* Add id="gasto-form" */}
      <form id="gasto-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form Fields remain the same */}
        <FormField
          control={form.control}
          name="razon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razón del gasto</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Compra de insumos" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fondo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de pago</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caja</FormLabel>
              {/* Ensure defaultValue uses the field's value, converted to string */}
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString() ?? ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige una caja" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cajas
                    .filter(caja => caja?.id != null)
                    .map((caja) => (
                      <SelectItem
                        key={caja.id}
                        value={caja.id.toString()}
                      >
                        {caja.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Removed DialogFooter */}
      </form>
    </Form>
  );
}

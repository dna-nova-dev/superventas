import { ApiService } from './api.service';
import type { VentaPendiente, CreateVentaPendiente, Venta } from '@/types';

const apiService = new ApiService();
const VENTA_ENDPOINT = 'ventas';

/**
 * Obtiene todas las ventas con estado 'pendiente'
 * @param empresaId ID de la empresa (opcional)
 */
export const getVentasPendientes = async (empresaId?: number): Promise<VentaPendiente[]> => {
  try {
    const params = new URLSearchParams({
      estado: 'pendiente',
      ...(empresaId && { empresaId: empresaId.toString() })
    });

    const response = await apiService.get<VentaPendiente[]>(`${VENTA_ENDPOINT}/all-relations?${params.toString()}`);

    if (!Array.isArray(response)) {
      console.error('❌ La respuesta de la API no es un array:', response);
      return [];
    }

    console.log('📦 Total de ventas recibidas de la API:', response.length);

    // Filtramos las ventas pendientes
    console.log('🔍 Estado de todas las ventas recibidas:');
    response.forEach(venta => {
      console.log(`  ID: ${venta.id}, Estado: '${venta.estado}', Fecha: ${venta.fecha}, Total: ${venta.total}`);
    });

    // Filtramos las ventas pendientes
    const ventasPendientes = response.filter(venta => {
      const estado = String(venta.estado || '').trim().toLowerCase();
      const esPendiente = estado === 'pendiente';

      if (!esPendiente) {
        console.log(`ℹ️  Filtrada venta ID ${venta.id} - Estado: '${venta.estado || 'undefined'}'`);
        return false;
      }
      return true;
    });

    console.log(`✅ ${ventasPendientes.length} ventas pendientes encontradas`);

    return ventasPendientes;
  } catch (error: unknown) {
    console.error("Error fetching ventas pendientes:", error);
    throw error;
  }
};

/**
 * Obtiene una venta pendiente por su ID
 */
export const getVentaPendienteById = async (id: number): Promise<VentaPendiente> => {
  const venta = await apiService.get<VentaPendiente>(`${VENTA_ENDPOINT}/getById/${id}`);
  if (venta.estado !== 'pendiente') {
    throw new Error('La venta no está en estado pendiente');
  }
  return venta;
};

/**
 * Obtiene una venta pendiente por su código
 */
export const getVentaPendienteByCodigo = async (codigo: string): Promise<VentaPendiente> => {
  try {
    const response = await apiService.get<VentaPendiente[]>(`${VENTA_ENDPOINT}/by-codigo/${codigo}`);
    const venta = response[0]; // Asumiendo que el endpoint devuelve un array
    if (venta?.estado !== 'pendiente') {
      throw new Error('No se encontró una venta pendiente con ese código');
    }
    return venta;
  } catch (error: unknown) {
    console.error(`Error fetching venta pendiente with codigo ${codigo}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva venta pendiente
 * @param ventaPendiente Datos de la venta pendiente a crear
 */
export const createVentaPendiente = async (ventaPendiente: CreateVentaPendiente): Promise<VentaPendiente> => {
  try {
    return await apiService.post<VentaPendiente>(
      `${VENTA_ENDPOINT}/create`,
      { ...ventaPendiente, estado: 'pendiente' }
    );
  } catch (error) {
    console.error("Error al crear venta pendiente:", error);
    throw new Error("No se pudo guardar la venta como pendiente. Por favor, intente nuevamente.");
  }
};

/**
 * Actualiza una venta pendiente existente
 */
export const updateVentaPendiente = async (id: number, ventaPendiente: Partial<VentaPendiente>): Promise<VentaPendiente> => {
  try {
    // Verificamos que la venta exista y esté en estado pendiente
    const venta = await getVentaPendienteById(id);
    if (venta.estado !== 'pendiente') {
      throw new Error('Solo se pueden actualizar ventas en estado pendiente');
    }

    // Preparamos los datos para la actualización
    const updateData: Record<string, any> = {
      ...ventaPendiente,
      estado: 'pendiente'
    };

    // Obtener los detalles existentes de la venta
    const ventaCompleta = await apiService.get<VentaPendiente>(`${VENTA_ENDPOINT}/getById/${id}?relations=detalles`);
    const detallesExistentes = ventaCompleta.detalles || [];

    // Si hay detalles nuevos, los mezclamos con los existentes
    if (ventaPendiente.detalles) {
      // Crear un mapa para agrupar los detalles por producto
      const detallesAgrupados = new Map<number, any>();

      // Primero agregamos todos los detalles existentes al mapa, convirtiendo los valores numéricos
      detallesExistentes.forEach(detalle => {
        detallesAgrupados.set(detalle.productoId, { 
          ...detalle,
          cantidad: Number(detalle.cantidad) || 0,
          total: parseFloat(String(detalle.total || '0'))
        });
      });

      // Luego procesamos los nuevos detalles
      ventaPendiente.detalles.forEach(detalle => {
        const productoId = detalle.productoId;
        const existente = detallesAgrupados.get(productoId);

        if (existente) {
          // Si el producto ya existe, sumamos la cantidad y actualizamos el total
          const nuevaCantidad = existente.cantidad + Number(detalle.cantidad || 0);
          const nuevoTotal = existente.total + parseFloat(String(detalle.total || '0'));

          // Actualizar el detalle existente con los nuevos valores
          existente.cantidad = nuevaCantidad;
          existente.total = nuevoTotal;
          existente.precioVenta = detalle.precioVenta; // Mantener el precio de venta actualizado
        } else {
          // Si el producto no existe, lo agregamos al mapa con los valores convertidos
          detallesAgrupados.set(productoId, { 
            ...detalle,
            cantidad: Number(detalle.cantidad) || 0,
            total: parseFloat(String(detalle.total || '0'))
          });
        }
      });

      // Convertir el mapa de vuelta a un array con el formato correcto
      updateData.detalles = Array.from(detallesAgrupados.values()).map(detalle => ({
        id: detalle.id, // Mantener el ID si existe para actualización
        cantidad: detalle.cantidad,
        precioVenta: detalle.precioVenta,
        precioCompra: detalle.precioCompra || '0.00',
        total: detalle.total.toFixed(2), // Asegurar 2 decimales
        descripcion: detalle.descripcion,
        productoId: detalle.productoId,
        empresaId: detalle.empresaId,
        ventaId: id, // Asegurar que el ventaId esté establecido
        venta_codigo: venta.codigo, // Asegurar que el venta_codigo esté presente
        ventaCodigo: venta.codigo // Incluir también en camelCase para compatibilidad
      }));
    }

    // Si hay productos, asegurémonos de que tengan el formato correcto
    if (ventaPendiente.productos) {
      updateData.productos = ventaPendiente.productos.map(producto => ({
        id: producto.id,
        productoId: producto.productoId,
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        precioVenta: producto.precioVenta,
        total: producto.total,
        descripcion: producto.descripcion,
        precioCompra: producto.precioCompra || '0.00',
        empresaId: producto.empresaId,
        ventaId: id
      }));
    }

    // Eliminar campos que no deberían enviarse
    const fieldsToRemove = [
      'createdAt', 'updatedAt', 'deletedAt',
      'usuario', 'caja', 'cliente', 'productosData'
    ];

    fieldsToRemove.forEach(field => delete updateData[field]);

    // Validar que el código de venta esté presente
    if (!venta.codigo) {
      console.warn('Advertencia: No se encontró el código de venta. Generando uno nuevo...');
      venta.codigo = `V-${Date.now()}`;
    }

    // Asegurarse de que los arrays se envíen correctamente
    const requestData = {
      ...updateData,
      // Mantener el código original de la venta
      codigo: venta.codigo,
      // Forzar la conversión a array si es necesario
      detalles: Array.isArray(updateData.detalles) ? updateData.detalles : [],
      productos: Array.isArray(updateData.productos) ? updateData.productos : []
    } as Partial<VentaPendiente>;

    // Asegurarse de que el venta_codigo esté presente en todos los detalles
    if (requestData.detalles && requestData.detalles.length > 0) {
      requestData.detalles = requestData.detalles.map(detalle => ({
        ...detalle,
        venta_codigo: detalle.venta_codigo || venta.codigo
      }));
    }

    // Asegurarse de que el estado sea 'pendiente'
    requestData.estado = 'pendiente';

    console.log('Actualizando venta pendiente con datos: ', JSON.stringify(requestData, null, 2));

    try {
      // Usar el endpoint específico para actualizar una venta
      const response = await apiService.patch<VentaPendiente>(`${VENTA_ENDPOINT}/update/${id}`, requestData);
      console.log('Venta pendiente actualizada con éxito:', response);
      return response;
    } catch (error) {
      console.error('Error en la petición PATCH:', error);
      throw error;
    }

  } catch (error) {
    console.error(`Error al actualizar venta pendiente ${id}:`, error);

    // Proporcionar más detalles del error
    let errorMessage = 'No se pudo actualizar la venta pendiente. Por favor, intente nuevamente.';

    if (error instanceof Error) {
      if ('status' in error && error.status === 500) {
        errorMessage = 'Error interno del servidor al actualizar la venta pendiente. Por favor, verifica los datos e inténtalo de nuevo.';
      } else if ('data' in error && error.data) {
        // Si hay datos adicionales en el error, mostrarlos
        errorMessage += ` Detalles: ${JSON.stringify(error.data)}`;
      } else if (error.message) {
        errorMessage += ` ${error.message}`;
      }
    }

    throw new Error(errorMessage);
  }
};

/**
 * Cambia el estado de una venta de 'pendiente' a 'completada'
 * @param id ID de la venta a actualizar
 */
export const deleteVentaPendiente = async (id: number): Promise<void> => {
  try {
    // Usamos el endpoint de actualización de venta
    await apiService.patch(`ventas/update/${id}`, {
      estado: 'completada',
      // Asegurarse de incluir los campos necesarios para la actualización
      // según lo que espere tu backend
      actualizado: new Date().toISOString()
    });

    console.log(`✅ Venta ${id} marcada como completada correctamente`);
  } catch (error: unknown) {
    console.error(`Error al actualizar el estado de la venta ${id}:`, error);
    throw new Error('No se pudo actualizar el estado de la venta. Por favor, intente nuevamente.');
  }
};

/**
 * Completa una venta pendiente (la convierte en venta normal)
 */
export const completarVentaPendiente = async (id: number, pagoInfo: {
  pagado: string;
  cambio: string;
  cajaId: number;
  usuarioId: number;
  empresaId: number;
}): Promise<Venta> => {
  try {
    // Primero obtenemos la venta con sus detalles para verificar que existe y está pendiente
    const venta = await apiService.get<Venta>(`${VENTA_ENDPOINT}/getById/${id}?relations=detalles`);

    if (venta.estado !== 'pendiente') {
      throw new Error('La venta no está en estado pendiente');
    }

    // Si hay detalles, los agrupamos por producto y sumamos las cantidades
    if (venta.detalles && Array.isArray(venta.detalles)) {
      const detallesAgrupados = new Map<number, typeof venta.detalles[0]>();

      venta.detalles.forEach(detalle => {
        const productoId = detalle.productoId;
        const existente = detallesAgrupados.get(productoId);

        if (existente) {
          // Si el producto ya existe, actualizamos la cantidad y el total
          existente.cantidad += detalle.cantidad;
          existente.total = (parseFloat(String(existente.total)) + parseFloat(String(detalle.total))).toString();
        } else {
          // Si el producto no existe, lo agregamos al mapa
          detallesAgrupados.set(productoId, { ...detalle });
        }
      });

      // Convertimos el mapa de vuelta a un array
      venta.detalles = Array.from(detallesAgrupados.values());
    }

    // Actualizamos la venta a estado 'completada' con la información de pago
    return await apiService.patch<Venta>(
      `${VENTA_ENDPOINT}/update/${id}`,
      {
        estado: 'completada',
        pagado: pagoInfo.pagado,
        cambio: pagoInfo.cambio,
        cajaId: pagoInfo.cajaId,
        fechaFinalizacion: new Date().toISOString(),
        // Incluimos los detalles actualizados en la solicitud
        detalles: venta.detalles
      }
    );
  } catch (error) {
    console.error(`Error al completar venta pendiente ${id}:`, error);
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(errorMessage || "No se pudo completar la venta pendiente. Por favor, verifique los datos e intente nuevamente.");
  }
};

/**
 * Convierte una venta normal en una venta pendiente o actualiza una venta existente
 * @param ventaId ID de la venta a convertir o actualizar
 * @param empresaId ID de la empresa (opcional, para compatibilidad)
 */
export const convertirAVentaPendiente = async (ventaId: number, empresaId?: number): Promise<VentaPendiente> => {
  try {
    // Si el ID es de una venta normal, usamos el endpoint de conversión
    if (ventaId > 1000) { // Asumiendo que los IDs de ventas normales son mayores a 1000
      return await apiService.patch<VentaPendiente>(
        `${VENTA_ENDPOINT}/convert-to-pending/${ventaId}`,
        { empresaId }
      );
    }
    
    // Para ventas existentes, obtenemos y actualizamos el estado
    const venta = await apiService.get<VentaPendiente>(`${VENTA_ENDPOINT}/${ventaId}`);
    
    return await apiService.patch<VentaPendiente>(
      `${VENTA_ENDPOINT}/${ventaId}`,
      {
        ...venta,
        estado: 'pendiente',
        ...(empresaId && { empresaId })
      }
    );
  } catch (error) {
    console.error(`Error al convertir venta ${ventaId} a pendiente:`, error);
    throw new Error("No se pudo convertir la venta a pendiente. Por favor, intente nuevamente.");
  }
};

/**
 * Actualiza una venta pendiente y la marca como completada en una sola operación
 * @param id ID de la venta pendiente a actualizar y finalizar
 * @param ventaData Datos actualizados de la venta
 * @param pagoInfo Información del pago para finalizar la venta
 */
export const actualizarYFinalizarVenta = async (
  id: number,
  ventaData: any,
  pagoInfo: {
    pagado: string;
    cambio: string;
    cajaId: number;
    usuarioId: number;
    empresaId: number;
  }
): Promise<Venta> => {
  try {
    console.log('🔄 Actualizando venta pendiente antes de finalizar...');
    
    // 1. Primero actualizamos la venta pendiente con los nuevos datos
    const ventaActualizada = await updateVentaPendiente(id, ventaData);
    console.log('✅ Venta pendiente actualizada correctamente');
    
    // 2. Luego finalizamos la venta usando los datos actualizados
    console.log('🚀 Finalizando la venta...');
    
    // Aseguramos que los detalles estén incluidos en la actualización
    const updateData = {
      ...ventaActualizada,
      estado: 'completada',
      pagado: pagoInfo.pagado,
      cambio: pagoInfo.cambio,
      cajaId: pagoInfo.cajaId,
      usuarioId: pagoInfo.usuarioId,
      empresaId: pagoInfo.empresaId,
      fechaFinalizacion: new Date().toISOString(),
      // Incluimos explícitamente los detalles de la venta
      detalles: ventaData.detalles || []
    };
    
    const ventaFinalizada = await apiService.patch<Venta>(
      `${VENTA_ENDPOINT}/update/${id}`,
      updateData
    );
    
    console.log('🎉 Venta finalizada exitosamente');
    return ventaFinalizada;
    
  } catch (error) {
    console.error('❌ Error al actualizar y finalizar la venta:', error);
    throw error;
  }
};

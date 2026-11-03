import type { LineaCotizacion, MaterialOrden, OrdenServicio, Producto } from "@/types/admin";

/**
 * Materiales que el mecánico registró en la orden como necesarios.
 * Solo se importan los solicitados (Requerido / Pendiente), no los ya utilizados.
 */
export function materialesSolicitados(orden: OrdenServicio | undefined): MaterialOrden[] {
  if (!orden) return [];
  return (orden.materiales ?? []).filter(
    (material) => material.estado === "Requerido" || material.estado === "Pendiente",
  );
}

/**
 * Construye las líneas de la cotización a partir de los materiales solicitados en la orden.
 * Agrupa por código de inventario para no duplicar el mismo repuesto y toma el precio
 * del inventario compartido (precio por menor).
 */
export function lineasDesdeOrden(
  orden: OrdenServicio | undefined,
  productos: Producto[],
): LineaCotizacion[] {
  const agrupados = new Map<string, LineaCotizacion>();

  materialesSolicitados(orden).forEach((material) => {
    const producto = productos.find((item) => item.codigo === material.codigo);
    const existente = agrupados.get(material.codigo);

    if (existente) {
      agrupados.set(material.codigo, {
        ...existente,
        cantidad: existente.cantidad + material.cantidad,
      });
      return;
    }

    agrupados.set(material.codigo, {
      id: `IMP-${material.codigo}`,
      codigo: material.codigo,
      descripcion: producto?.nombre || material.nombre,
      cantidad: material.cantidad,
      precioUnitario: producto ? producto.precioMenor : 0,
    });
  });

  return Array.from(agrupados.values());
}

export function motocicletaDeOrden(orden: OrdenServicio | undefined) {
  if (!orden) return "";
  return `${orden.marca} ${orden.modelo} · ${orden.placa}`;
}
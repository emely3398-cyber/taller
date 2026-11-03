import { ahoraISO } from "@/lib/format";
import { obtenerProducto, registrarSalida } from "@/lib/inventarioStore";
import { agregarUtilizacionOrden, obtenerOrdenes, registrarRepuestoDespachado } from "@/lib/ordenesStore";
import { calcularSituacionMaterial, cantidadesPorCodigo, cotizacionesDeOrden } from "@/lib/repuestosFlujo";
import type { Cotizacion } from "@/types/admin";

export type ResultadoAccion = { ok: boolean; mensaje: string };

/**
 * Confirma el despacho de un repuesto de la orden. Valida en el momento de
 * guardar (no solo en la pantalla): cotización vinculada y aprobada, repuesto
 * incluido en esa autorización, cantidad dentro de lo autorizado pendiente y
 * existencias suficientes. El inventario se descuenta una sola vez.
 */
export function registrarDespachoRepuesto(
  ordenId: string,
  datos: { codigo: string; descripcion: string; cantidad: number },
  cotizaciones: Cotizacion[],
  responsable: string,
): ResultadoAccion {
  const orden = obtenerOrdenes().find((item) => item.id === ordenId);
  if (!orden) return { ok: false, mensaje: "La orden de servicio no está disponible." };

  const vinculadas = cotizacionesDeOrden(ordenId, cotizaciones).filter(
    (cotizacion) => cotizacion.estado !== "Rechazada",
  );
  if (vinculadas.length === 0) {
    return {
      ok: false,
      mensaje: "Esta orden no tiene una cotización de taller vinculada; no se puede despachar.",
    };
  }
  const aprobadas = vinculadas.filter((cotizacion) => cotizacion.estado === "Aprobada");
  if (aprobadas.length === 0) {
    return {
      ok: false,
      mensaje: "La cotización de taller todavía no está aprobada por el cliente.",
    };
  }

  const cantidad = Number(datos.cantidad);
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { ok: false, mensaje: "Indique una cantidad mayor a cero." };
  }

  const cantidades = cantidadesPorCodigo(orden, datos.codigo, cotizaciones);
  if (cantidades.autorizada <= 0) {
    return {
      ok: false,
      mensaje: "Este repuesto no está incluido en la cotización aprobada del cliente.",
    };
  }
  const pendiente = cantidades.autorizada - cantidades.despachada;
  if (pendiente <= 0) {
    return {
      ok: false,
      mensaje: "Ya se despacharon todas las unidades autorizadas de este repuesto.",
    };
  }
  if (cantidad > pendiente) {
    return {
      ok: false,
      mensaje: `La cantidad solicitada supera las unidades autorizadas pendientes (${pendiente}).`,
    };
  }

  const producto = obtenerProducto(datos.codigo);
  if (!producto) {
    return { ok: false, mensaje: "El repuesto no está registrado en el inventario compartido." };
  }
  if (producto.existencia < cantidad) {
    return {
      ok: false,
      mensaje: `No hay existencias suficientes para realizar el despacho: solo ${producto.existencia} disponibles.`,
    };
  }

  const salida = registrarSalida({
    codigo: datos.codigo,
    cantidad,
    motivo: "Despacho a orden de servicio",
    referencia: ordenId,
  });
  if (!salida) {
    return { ok: false, mensaje: "No se pudo descontar la existencia del inventario." };
  }

  registrarRepuestoDespachado(ordenId, {
    codigo: datos.codigo,
    descripcion: datos.descripcion || producto.nombre,
    cantidad,
    responsable,
  });

  return {
    ok: true,
    mensaje: `Despachadas ${cantidad} unidades de ${producto.nombre}. Existencias descontadas una sola vez; el mecánico verá el despacho en la orden.`,
  };
}

/**
 * Registra la utilización (instalación real) de un repuesto. Solo se permite
 * sobre cantidades efectivamente despachadas y autorizadas, y nunca descuenta
 * inventario de nuevo.
 */
export function registrarUtilizacionRepuesto(
  ordenId: string,
  materialId: string,
  cantidad: number,
  mecanico: string,
  cotizaciones: Cotizacion[],
): ResultadoAccion {
  const orden = obtenerOrdenes().find((item) => item.id === ordenId);
  if (!orden) return { ok: false, mensaje: "La orden de servicio no está disponible." };
  const material = (orden.materiales ?? []).find((item) => item.id === materialId);
  if (!material) return { ok: false, mensaje: "El repuesto ya no está en la orden." };

  const situacion = calcularSituacionMaterial(orden, material, cotizaciones);
  if (!situacion.puedeUtilizar) {
    return { ok: false, mensaje: situacion.motivoBloqueo };
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { ok: false, mensaje: "Indique una cantidad mayor a cero." };
  }
  if (cantidad > situacion.maxUtilizable) {
    return {
      ok: false,
      mensaje: `Solo puede registrar hasta ${situacion.maxUtilizable} unidad(es): despachadas ${situacion.despachada}, ya utilizadas ${situacion.utilizada}.`,
    };
  }

  agregarUtilizacionOrden(ordenId, {
    materialId: material.id,
    codigo: material.codigo,
    nombre: material.nombre,
    cantidad,
    mecanico,
  });

  return {
    ok: true,
    mensaje: `Registradas ${cantidad} unidad(es) de ${material.nombre} como utilizadas por ${mecanico} el ${ahoraISO().replace("T", " ")}. El inventario no se descuenta nuevamente.`,
  };
}
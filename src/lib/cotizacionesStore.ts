import { useSyncExternalStore } from "react";
import { cotizaciones as cotizacionesMock } from "@/mocks/cotizaciones";
import { formatMoney } from "@/lib/format";
import { crearPersistencia } from "@/lib/persistencia";
import type {
  AmpliacionCotizacion,
  Cotizacion,
  LineaCotizacion,
  ManoObraTipo,
  PendienteCotizacion,
  ReajusteCotizacion,
} from "@/types/admin";

let listaCotizaciones: Cotizacion[] = [...cotizacionesMock];
const listeners = new Set<() => void>();

let persistencia: { guardar: () => void } | null = null;

function notificar() {
  listeners.forEach((listener) => listener());
}

function emitir() {
  notificar();
  persistencia?.guardar();
}

function suscribir(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function obtenerCotizaciones() {
  return listaCotizaciones;
}

persistencia = crearPersistencia<Cotizacion[]>(
  "cotizaciones",
  () => listaCotizaciones,
  (guardadas) => {
    listaCotizaciones = guardadas;
    notificar();
  },
);

export function useCotizaciones() {
  return useSyncExternalStore(suscribir, obtenerCotizaciones, obtenerCotizaciones);
}

export function obtenerCotizacion(id: string) {
  return listaCotizaciones.find((cotizacion) => cotizacion.id === id);
}

export function siguienteNumeroCotizacion() {
  const numero = listaCotizaciones.reduce((max, cotizacion) => {
    const valor = Number(cotizacion.id.replace(/\D/g, ""));
    return valor > max ? valor : max;
  }, 0);
  return `COT-${String(numero + 1).padStart(4, "0")}`;
}

export function calcularTotales(cotizacion: {
  lineas: LineaCotizacion[];
  manoObraTipo: ManoObraTipo;
  manoObraValor: number;
  manoObraHoras: number;
}) {
  const materiales = cotizacion.lineas.reduce(
    (acc, linea) => acc + linea.cantidad * linea.precioUnitario,
    0,
  );
  const manoObra =
    cotizacion.manoObraTipo === "Fijo"
      ? cotizacion.manoObraValor
      : cotizacion.manoObraValor * cotizacion.manoObraHoras;
  return { materiales, manoObra, total: materiales + manoObra };
}

export type ResultadoCotizacion = { ok: true; mensaje: string } | { ok: false; mensaje: string };

/**
 * Registra en la cotización de taller vinculada un repuesto que se agregó a la
 * orden después de crear la cotización. No modifica importes ni inventario.
 */
export function registrarRepuestoPendiente(
  referenciaOrden: string,
  datos: {
    materialId?: string;
    codigo: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    registradoPor: string;
    observacion?: string;
  },
): "incorporar" | "autorizacion" | "sin-cotizacion" | "rechazada" {
  const vinculadas = listaCotizaciones.filter(
    (item) => item.tipo === "Taller" && item.referencia === referenciaOrden,
  );
  const cotizacion = vinculadas.find((item) => item.estado !== "Rechazada");

  if (!cotizacion) {
    return vinculadas.length > 0 ? "rechazada" : "sin-cotizacion";
  }

  const anteriores = cotizacion.pendientes ?? [];
  const pendiente: PendienteCotizacion = {
    id: `PEND-${cotizacion.id}-${anteriores.length + 1}`,
    materialId: datos.materialId,
    codigo: datos.codigo,
    descripcion: datos.descripcion,
    cantidad: datos.cantidad,
    precioUnitario: datos.precioUnitario,
    estado:
      cotizacion.estado === "Aprobada" ? "Pendiente de autorización" : "Pendiente de incorporar",
    fecha: hoyISO(),
    registradoPor: datos.registradoPor,
    observacion: datos.observacion,
  };

  listaCotizaciones = listaCotizaciones.map((item) =>
    item.id === cotizacion.id
      ? {
          ...item,
          pendientes: [...anteriores, pendiente],
          importeAprobado:
            item.estado === "Aprobada" && item.importeAprobado === undefined
              ? calcularTotales(item).total
              : item.importeAprobado,
        }
      : item,
  );
  emitir();

  return cotizacion.estado === "Aprobada" ? "autorizacion" : "incorporar";
}

/** Incorpora el repuesto pendiente a la cotización (estados Pendiente / Enviada al cliente). */
export function incorporarPendienteCotizacion(
  cotizacionId: string,
  pendienteId: string,
  datos: { cantidad: number; precioUnitario: number; responsable: string; motivo?: string },
): ResultadoCotizacion {
  const cotizacion = listaCotizaciones.find((item) => item.id === cotizacionId);
  if (!cotizacion) return { ok: false, mensaje: "La cotización no está disponible." };
  if (cotizacion.estado === "Rechazada") {
    return { ok: false, mensaje: "Una cotización rechazada no admite cambios." };
  }
  if (cotizacion.estado === "Aprobada") {
    return {
      ok: false,
      mensaje:
        "La cotización está aprobada: registre una ampliación y la autorización del cliente antes de modificar importes.",
    };
  }

  const pendiente = (cotizacion.pendientes ?? []).find((item) => item.id === pendienteId);
  if (!pendiente || pendiente.estado !== "Pendiente de incorporar") {
    return { ok: false, mensaje: "El repuesto ya no tiene una incorporación pendiente." };
  }
  if (datos.cantidad <= 0) return { ok: false, mensaje: "Indique una cantidad mayor a cero." };
  if (datos.precioUnitario < 0) return { ok: false, mensaje: "El precio no puede ser negativo." };

  const linea: LineaCotizacion = {
    id: `ADJ-${pendiente.id}`,
    codigo: pendiente.codigo,
    descripcion: pendiente.descripcion,
    cantidad: datos.cantidad,
    precioUnitario: datos.precioUnitario,
  };
  const reajuste: ReajusteCotizacion = {
    fecha: hoyISO(),
    elemento: `${pendiente.descripcion} · repuesto incorporado`,
    valorAnterior: "No incluido en la cotización",
    valorNuevo: `${datos.cantidad} × ${formatMoney(datos.precioUnitario)}`,
    motivo: datos.motivo?.trim() || "Incorporación de repuesto agregado después de crear la orden",
  };

  listaCotizaciones = listaCotizaciones.map((item) =>
    item.id === cotizacion.id
      ? {
          ...item,
          lineas: [...item.lineas, linea],
          reajustes: [reajuste, ...item.reajustes],
          pendientes: (item.pendientes ?? []).map((pendienteItem) =>
            pendienteItem.id === pendiente.id
              ? {
                  ...pendienteItem,
                  cantidad: datos.cantidad,
                  precioUnitario: datos.precioUnitario,
                  estado: "Incorporado",
                  fechaResolucion: hoyISO(),
                  resueltoPor: datos.responsable,
                }
              : pendienteItem,
          ),
          requiereNuevaConfirmacion:
            item.estado === "Enviada al cliente" ? true : item.requiereNuevaConfirmacion,
        }
      : item,
  );
  emitir();

  return {
    ok: true,
    mensaje:
      cotizacion.estado === "Enviada al cliente"
        ? "Repuesto incorporado. La cotización ya había sido enviada al cliente, por lo que requiere nueva comunicación y confirmación antes de tratarse como aprobada."
        : "Repuesto incorporado a la cotización existente. Subtotal y total actualizados; el historial de reajustes conserva el cambio.",
  };
}

/** Registra una ampliación pendiente de autorización en una cotización aprobada. */
export function registrarAmpliacionCotizacion(
  cotizacionId: string,
  pendienteId: string,
  datos: { cantidad: number; precioUnitario: number; responsable: string; motivo?: string },
): ResultadoCotizacion {
  const cotizacion = listaCotizaciones.find((item) => item.id === cotizacionId);
  if (!cotizacion) return { ok: false, mensaje: "La cotización no está disponible." };
  if (cotizacion.estado !== "Aprobada") {
    return { ok: false, mensaje: "Solo una cotización aprobada admite ampliaciones." };
  }
  const pendiente = (cotizacion.pendientes ?? []).find((item) => item.id === pendienteId);
  if (!pendiente) return { ok: false, mensaje: "El repuesto adicional ya no está disponible." };
  if (pendiente.ampliacionId) {
    return { ok: false, mensaje: "Esta ampliación ya fue registrada y espera autorización." };
  }
  if (datos.cantidad <= 0) return { ok: false, mensaje: "Indique una cantidad mayor a cero." };
  if (datos.precioUnitario < 0) return { ok: false, mensaje: "El precio no puede ser negativo." };

  const ampliacion: AmpliacionCotizacion = {
    id: `AMP-${pendiente.id}`,
    pendienteId: pendiente.id,
    fecha: hoyISO(),
    descripcion: pendiente.descripcion,
    cantidad: datos.cantidad,
    precioUnitario: datos.precioUnitario,
    importe: datos.cantidad * datos.precioUnitario,
    autorizada: false,
    registradoPor: datos.responsable,
    motivo: datos.motivo?.trim() || "Repuesto adicional solicitado por el mecánico",
  };

  listaCotizaciones = listaCotizaciones.map((item) =>
    item.id === cotizacion.id
      ? {
          ...item,
          ampliaciones: [...(item.ampliaciones ?? []), ampliacion],
          pendientes: (item.pendientes ?? []).map((pendienteItem) =>
            pendienteItem.id === pendiente.id
              ? { ...pendienteItem, ampliacionId: ampliacion.id }
              : pendienteItem,
          ),
        }
      : item,
  );
  emitir();

  return {
    ok: true,
    mensaje:
      "Ampliación registrada. El importe originalmente aprobado no cambia y el adicional queda pendiente de autorización del cliente.",
  };
}

/** Registra explícitamente la autorización del cliente sobre una ampliación. */
export function autorizarAmpliacionCotizacion(
  cotizacionId: string,
  ampliacionId: string,
  responsable: string,
): ResultadoCotizacion {
  const cotizacion = listaCotizaciones.find((item) => item.id === cotizacionId);
  if (!cotizacion) return { ok: false, mensaje: "La cotización no está disponible." };
  const ampliacion = (cotizacion.ampliaciones ?? []).find((item) => item.id === ampliacionId);
  if (!ampliacion) return { ok: false, mensaje: "La ampliación no está disponible." };
  if (ampliacion.autorizada) {
    return { ok: false, mensaje: "La ampliación ya está autorizada." };
  }

  const linea: LineaCotizacion = {
    id: `ADJ-${ampliacion.pendienteId}`,
    codigo: cotizacion.pendientes?.find((item) => item.id === ampliacion.pendienteId)?.codigo,
    descripcion: ampliacion.descripcion,
    cantidad: ampliacion.cantidad,
    precioUnitario: ampliacion.precioUnitario,
  };
  const reajuste: ReajusteCotizacion = {
    fecha: hoyISO(),
    elemento: `${ampliacion.descripcion} · ampliación autorizada`,
    valorAnterior: "Pendiente de autorización",
    valorNuevo: formatMoney(ampliacion.importe),
    motivo: `Autorización del cliente registrada por ${responsable}. Importe originalmente aprobado: ${formatMoney(cotizacion.importeAprobado ?? calcularTotales(cotizacion).total)}`,
  };

  listaCotizaciones = listaCotizaciones.map((item) =>
    item.id === cotizacion.id
      ? {
          ...item,
          lineas: [...item.lineas, linea],
          reajustes: [reajuste, ...item.reajustes],
          importeAprobado:
            item.importeAprobado === undefined ? calcularTotales(item).total : item.importeAprobado,
          ampliaciones: (item.ampliaciones ?? []).map((ampliacionItem) =>
            ampliacionItem.id === ampliacion.id
              ? { ...ampliacionItem, autorizada: true, fechaAutorizacion: hoyISO() }
              : ampliacionItem,
          ),
          pendientes: (item.pendientes ?? []).map((pendienteItem) =>
            pendienteItem.id === ampliacion.pendienteId
              ? {
                  ...pendienteItem,
                  estado: "Autorizado",
                  fechaResolucion: hoyISO(),
                  resueltoPor: responsable,
                }
              : pendienteItem,
          ),
        }
      : item,
  );
  emitir();

  return {
    ok: true,
    mensaje:
      "Autorización del cliente registrada. El adicional se suma a la cotización y se conserva el importe originalmente aprobado en el historial.",
  };
}

export function crearCotizacion(cotizacion: Cotizacion) {
  listaCotizaciones = [cotizacion, ...listaCotizaciones];
  emitir();
}

export function guardarCotizacion(cotizacion: Cotizacion) {
  listaCotizaciones = listaCotizaciones.map((item) =>
    item.id === cotizacion.id ? cotizacion : item,
  );
  emitir();
}

export function agregarReajuste(id: string, reajuste: ReajusteCotizacion) {
  listaCotizaciones = listaCotizaciones.map((item) =>
    item.id === id ? { ...item, reajustes: [reajuste, ...item.reajustes] } : item,
  );
  emitir();
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
import { ordenesServicio } from "@/mocks/ordenes";
import { ahoraISO } from "@/lib/format";
import { crearPersistencia } from "@/lib/persistencia";
import { esEstadoCerrado } from "@/lib/taller";
import type {
  EstadoMaterialOrden,
  EstadoOrden,
  FotoOrden,
  MaterialOrden,
  OrdenServicio,
  RegistroAtencion,
  RegistroSeguimiento,
  TipoAtencion,
  TipoServicio,
} from "@/types/admin";

let ordenes: OrdenServicio[] = [...ordenesServicio];

const listeners = new Set<() => void>();

let persistencia: { guardar: () => void } | null = null;

function notificar() {
  listeners.forEach((listener) => listener());
}

function emitir() {
  notificar();
  persistencia?.guardar();
}

export function suscribirOrdenes(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function obtenerOrdenes() {
  return ordenes;
}

persistencia = crearPersistencia<OrdenServicio[]>(
  "ordenes",
  () => ordenes,
  (guardadas) => {
    ordenes = guardadas;
    notificar();
  },
);

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function siguienteNumeroOrden() {
  const numero = ordenes.reduce((max, orden) => {
    const valor = Number(orden.id.replace(/\D/g, ""));
    return valor > max ? valor : max;
  }, 0);
  return `OS-${String(numero + 1).padStart(4, "0")}`;
}

export function agregarOrden(orden: OrdenServicio) {
  ordenes = [orden, ...ordenes];
  emitir();
}

type CambioOrden = {
  estadoNuevo: EstadoOrden;
  observacion: string;
  mecanico: string;
  fotos?: FotoOrden[];
  repuestoFaltante?: string;
  motivoCancelacion?: string;
};

export function registrarCambioOrden(id: string, cambio: CambioOrden) {
  ordenes = ordenes.map((orden) => {
    if (orden.id !== id) return orden;
    const registro: RegistroSeguimiento = {
      fecha: ahoraISO(),
      estadoAnterior: orden.estado,
      estadoNuevo: cambio.estadoNuevo,
      observacion: cambio.observacion,
      mecanico: cambio.mecanico,
      fotos: cambio.fotos ?? [],
    };
    return {
      ...orden,
      estado: cambio.estadoNuevo,
      mecanico: cambio.mecanico,
      repuestoFaltante:
        cambio.estadoNuevo === "En espera de repuesto"
          ? cambio.repuestoFaltante || orden.repuestoFaltante
          : cambio.estadoNuevo === orden.estado
            ? orden.repuestoFaltante
            : undefined,
      motivoCancelacion:
        cambio.estadoNuevo === "Servicio cancelado"
          ? cambio.motivoCancelacion || cambio.observacion
          : orden.motivoCancelacion,
      seguimiento: [...orden.seguimiento, registro],
    };
  });
  emitir();
}

export function guardarDiagnosticoOrden(
  id: string,
  datos: {
    diagnostico: string;
    tipoServicio?: TipoServicio;
    tipoAtencion?: TipoAtencion;
    trabajoARealizar: string;
    repuestosNecesarios: string;
  },
  responsable: string,
) {
  ordenes = ordenes.map((orden) => {
    if (orden.id !== id) return orden;
    const registro: RegistroSeguimiento = {
      fecha: ahoraISO(),
      estadoAnterior: orden.estado,
      estadoNuevo: orden.estado,
      observacion: `Diagnóstico técnico actualizado: ${datos.diagnostico}`,
      mecanico: responsable,
      fotos: [],
    };
    const cambioAtencion =
      Boolean(datos.tipoAtencion) && datos.tipoAtencion !== orden.tipoAtencion;
    const registros = [...orden.seguimiento, registro];

    if (cambioAtencion) {
      registros.push({
        fecha: ahoraISO(),
        estadoAnterior: orden.estado,
        estadoNuevo: orden.estado,
        observacion: `Tipo de atención actualizado: ${orden.tipoAtencion || "Sin especificar"} → ${datos.tipoAtencion}. La orden no cambia de estado.`,
        mecanico: responsable,
        fotos: [],
        cambioServicio: `Tipo de atención: ${orden.tipoAtencion || "Sin especificar"} → ${datos.tipoAtencion}`,
      });
    }

    return {
      ...orden,
      diagnostico: datos.diagnostico,
      tipoServicio: datos.tipoServicio ?? orden.tipoServicio,
      tipoAtencion: datos.tipoAtencion ?? orden.tipoAtencion,
      historialAtencion: cambioAtencion
        ? [
            ...(orden.historialAtencion ?? []),
            {
              fecha: ahoraISO(),
              valorAnterior: orden.tipoAtencion,
              valorNuevo: datos.tipoAtencion as TipoAtencion,
              responsable,
              motivo: "Actualizado durante el diagnóstico técnico",
            },
          ]
        : orden.historialAtencion,
      trabajoARealizar: datos.trabajoARealizar,
      repuestosNecesarios: datos.repuestosNecesarios,
      seguimiento: registros,
    };
  });
  emitir();
}

export function actualizarTipoAtencion(
  id: string,
  nuevo: TipoAtencion,
  responsable: string,
  motivo?: string,
) {
  ordenes = ordenes.map((orden) => {
    if (orden.id !== id) return orden;
    if (orden.tipoAtencion === nuevo) return orden;

    const cambio: RegistroAtencion = {
      fecha: ahoraISO(),
      valorAnterior: orden.tipoAtencion,
      valorNuevo: nuevo,
      responsable,
      motivo: motivo?.trim() || "Actualización del tipo de atención",
    };
    const registro: RegistroSeguimiento = {
      fecha: ahoraISO(),
      estadoAnterior: orden.estado,
      estadoNuevo: orden.estado,
      observacion: `Tipo de atención actualizado: ${orden.tipoAtencion || "Sin especificar"} → ${nuevo}. ${cambio.motivo}. La orden conserva su estado, diagnóstico y cotizaciones.`,
      mecanico: responsable,
      fotos: [],
      cambioServicio: `Tipo de atención: ${orden.tipoAtencion || "Sin especificar"} → ${nuevo}`,
    };

    return {
      ...orden,
      tipoAtencion: nuevo,
      historialAtencion: [...(orden.historialAtencion ?? []), cambio],
      seguimiento: [...orden.seguimiento, registro],
    };
  });
  emitir();
}

export function marcarOrdenCotizada(id: string, cotizacionId: string) {
  const orden = ordenes.find((item) => item.id === id);
  if (!orden) return;
  if (orden.estado === "Cotizada") return;
  if (esEstadoCerrado(orden)) return;
  const registro: RegistroSeguimiento = {
    fecha: ahoraISO(),
    estadoAnterior: orden.estado,
    estadoNuevo: "Cotizada",
    observacion: `Cotización ${cotizacionId} creada y vinculada a la orden. La orden pasa a Cotizada.`,
    mecanico: orden.mecanico,
    fotos: [],
  };
  ordenes = ordenes.map((item) =>
    item.id === id
      ? { ...item, estado: "Cotizada", seguimiento: [...item.seguimiento, registro] }
      : item,
  );
  emitir();
}

export function registrarAprobacionCotizacion(id: string, cotizacionId: string) {
  const orden = ordenes.find((item) => item.id === id);
  if (!orden || esEstadoCerrado(orden)) return;
  const registro: RegistroSeguimiento = {
    fecha: ahoraISO(),
    estadoAnterior: orden.estado,
    estadoNuevo: orden.estado,
    observacion: `Cotización ${cotizacionId} aprobada por el propietario. La reparación puede iniciarse.`,
    mecanico: orden.mecanico,
    fotos: [],
  };
  ordenes = ordenes.map((item) =>
    item.id === id ? { ...item, seguimiento: [...item.seguimiento, registro] } : item,
  );
  emitir();
}

export function cancelarOrdenPorRechazo(id: string, cotizacionId: string, motivo: string) {
  const orden = ordenes.find((item) => item.id === id);
  if (!orden || esEstadoCerrado(orden)) return;
  const registro: RegistroSeguimiento = {
    fecha: ahoraISO(),
    estadoAnterior: orden.estado,
    estadoNuevo: "Servicio cancelado",
    observacion: `Cotización ${cotizacionId} rechazada por el propietario. Motivo: ${motivo}. El inventario no se descuenta.`,
    mecanico: orden.mecanico,
    fotos: [],
  };
  ordenes = ordenes.map((item) =>
    item.id === id
      ? {
          ...item,
          estado: "Servicio cancelado",
          motivoCancelacion: `Rechazo de la cotización ${cotizacionId}: ${motivo}`,
          seguimiento: [...item.seguimiento, registro],
        }
      : item,
  );
  emitir();
}

export function agregarSeguimientoOrden(id: string, nota: string, mecanico: string) {
  ordenes = ordenes.map((orden) => {
    if (orden.id !== id) return orden;
    const registro: RegistroSeguimiento = {
      fecha: ahoraISO(),
      estadoAnterior: orden.estado,
      estadoNuevo: orden.estado,
      observacion: nota,
      mecanico,
      fotos: [],
    };
    return { ...orden, seguimiento: [...orden.seguimiento, registro] };
  });
  emitir();
}

export function registrarRepuestoDespachado(
  id: string,
  repuesto: {
    codigo: string;
    descripcion: string;
    cantidad: number;
    responsable?: string;
  },
) {
  ordenes = ordenes.map((orden) => {
    if (orden.id !== id) return orden;
    const existente = orden.repuestosDespachados.find((item) => item.codigo === repuesto.codigo);
    const repuestosDespachados = existente
      ? orden.repuestosDespachados.map((item) =>
          item.codigo === repuesto.codigo
            ? { ...item, cantidad: item.cantidad + repuesto.cantidad }
            : item,
        )
      : [
          ...orden.repuestosDespachados,
          {
            codigo: repuesto.codigo,
            descripcion: repuesto.descripcion,
            cantidad: repuesto.cantidad,
            fecha: hoyISO(),
            registradoPor: repuesto.responsable,
          },
        ];
    const registro: RegistroSeguimiento = {
      fecha: ahoraISO(),
      estadoAnterior: orden.estado,
      estadoNuevo: orden.estado,
      observacion: `Despacho de repuesto: ${repuesto.cantidad} × ${repuesto.descripcion} (${repuesto.codigo}). Existencias descontadas del inventario compartido.`,
      mecanico: repuesto.responsable || orden.mecanico,
      fotos: [],
    };
    return {
      ...orden,
      repuestosDespachados,
      seguimiento: [...orden.seguimiento, registro],
    };
  });
  emitir();
}

export function renombrarMecanico(anterior: string, nuevo: string) {
  if (!anterior || !nuevo || anterior === nuevo) return;
  ordenes = ordenes.map((orden) =>
    orden.mecanico === anterior ? { ...orden, mecanico: nuevo } : orden,
  );
  emitir();
}

export function registrarMaterialOrden(
  id: string,
  material: {
    codigo: string;
    nombre: string;
    cantidad: number;
    estado: EstadoMaterialOrden;
    registradoPor: string;
    observacion?: string;
  },
) {
  ordenes = ordenes.map((orden) => {
    if (orden.id !== id) return orden;
    const materiales = orden.materiales ?? [];
    const existente = materiales.find(
      (item) => item.codigo === material.codigo && item.estado === material.estado,
    );
    const actualizados: MaterialOrden[] = existente
      ? materiales.map((item) =>
          item.id === existente.id
            ? { ...item, cantidad: item.cantidad + material.cantidad }
            : item,
        )
      : [
          ...materiales,
          {
            id: `MAT-${orden.id}-${materiales.length + 1}`,
            codigo: material.codigo,
            nombre: material.nombre,
            cantidad: material.cantidad,
            estado: material.estado,
            fecha: ahoraISO(),
            registradoPor: material.registradoPor,
            observacion: material.observacion,
          },
        ];
    return { ...orden, materiales: actualizados };
  });
  emitir();
}

/**
 * Registra la instalación real de un repuesto despachado. El inventario no se
 * descuenta aquí: ya se descontó al confirmar el despacho.
 */
export function agregarUtilizacionOrden(
  ordenId: string,
  datos: { materialId: string; codigo: string; nombre: string; cantidad: number; mecanico: string },
) {
  ordenes = ordenes.map((orden) => {
    if (orden.id !== ordenId) return orden;
    const utilizaciones = orden.utilizaciones ?? [];
    const registro = {
      id: `UTL-${ordenId}-${utilizaciones.length + 1}`,
      materialId: datos.materialId,
      codigo: datos.codigo,
      nombre: datos.nombre,
      cantidad: datos.cantidad,
      fecha: ahoraISO(),
      mecanico: datos.mecanico,
    };
    const seguimiento: RegistroSeguimiento = {
      fecha: ahoraISO(),
      estadoAnterior: orden.estado,
      estadoNuevo: orden.estado,
      observacion: `Repuesto utilizado: ${datos.cantidad} × ${datos.nombre} (${datos.codigo}) instalado por ${datos.mecanico}. El inventario no se descuenta nuevamente.`,
      mecanico: datos.mecanico,
      fotos: [],
    };
    return {
      ...orden,
      utilizaciones: [...utilizaciones, registro],
      seguimiento: [...orden.seguimiento, seguimiento],
    };
  });
  emitir();
}

export function quitarMaterialOrden(ordenId: string, materialId: string) {
  ordenes = ordenes.map((orden) =>
    orden.id === ordenId
      ? { ...orden, materiales: (orden.materiales ?? []).filter((item) => item.id !== materialId) }
      : orden,
  );
  emitir();
}

export function actualizarDatosTecnicos(  id: string,
  datos: { diagnostico?: string; trabajoRealizado?: string; trabajoARealizar?: string },
) {
  ordenes = ordenes.map((orden) => (orden.id === id ? { ...orden, ...datos } : orden));
  emitir();
}
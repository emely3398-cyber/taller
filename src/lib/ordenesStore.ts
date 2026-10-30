import { ordenesServicio } from "@/mocks/ordenes";
import { ahoraISO } from "@/lib/format";
import { esEstadoCerrado } from "@/lib/taller";
import type {
  EstadoMaterialOrden,
  EstadoOrden,
  FotoOrden,
  MaterialOrden,
  OrdenServicio,
  RegistroSeguimiento,
  TipoServicio,
} from "@/types/admin";

let ordenes: OrdenServicio[] = [...ordenesServicio];

const listeners = new Set<() => void>();

function emitir() {
  listeners.forEach((listener) => listener());
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
    return {
      ...orden,
      diagnostico: datos.diagnostico,
      tipoServicio: datos.tipoServicio ?? orden.tipoServicio,
      trabajoARealizar: datos.trabajoARealizar,
      repuestosNecesarios: datos.repuestosNecesarios,
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
  repuesto: { codigo: string; descripcion: string; cantidad: number },
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
      : [...orden.repuestosDespachados, { ...repuesto, fecha: hoyISO() }];
    const registro: RegistroSeguimiento = {
      fecha: ahoraISO(),
      estadoAnterior: orden.estado,
      estadoNuevo: orden.estado,
      observacion: `Despacho de repuesto: ${repuesto.cantidad} × ${repuesto.descripcion} (${repuesto.codigo}). Existencias descontadas del inventario.`,
      mecanico: orden.mecanico,
      fotos: [],
    };
    const materiales = (orden.materiales ?? []).map((item) =>
      item.codigo === repuesto.codigo ? { ...item, estado: "Utilizado" as EstadoMaterialOrden } : item,
    );
    return {
      ...orden,
      materiales,
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

export function actualizarEstadoMaterialOrden(
  ordenId: string,
  materialId: string,
  estado: EstadoMaterialOrden,
  responsable: string,
) {
  ordenes = ordenes.map((orden) => {
    if (orden.id !== ordenId) return orden;
    const materiales = (orden.materiales ?? []).map((item) =>
      item.id === materialId
        ? { ...item, estado, fecha: ahoraISO(), registradoPor: responsable }
        : item,
    );
    return { ...orden, materiales };
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
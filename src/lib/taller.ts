import type { EstadoOrden, TipoAtencion, TipoServicio } from "@/types/admin";

export const ESTADOS_ORDEN: EstadoOrden[] = [
  "Recibida",
  "En diagnóstico",
  "Cotizada",
  "En reparación",
  "En espera de repuesto",
  "Reparación finalizada",
  "Entregada",
  "Servicio cancelado",
];

export const ESTADOS_CERRADOS: EstadoOrden[] = ["Entregada", "Servicio cancelado"];

export function esEstadoCerrado(estado: EstadoOrden) {
  return ESTADOS_CERRADOS.includes(estado);
}

export const TIPOS_SERVICIO: TipoServicio[] = [
  "Mantenimiento preventivo",
  "Reparación de motor",
  "Sistema de frenos",
  "Sistema eléctrico",
  "Transmisión y arrastre",
  "Suspensión y dirección",
  "Diagnóstico general",
  "Otro",
];

/** Motivo general de la visita: se registra en la recepción y se puede actualizar. */
export const TIPOS_ATENCION: TipoAtencion[] = ["Mantenimiento", "Revisión", "Reparación"];

export const SIN_ESPECIFICAR = "Sin especificar";

export const SIN_ASIGNAR = "Sin asignar";
import type { EstadoOrden, TipoServicio } from "@/types/admin";

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

export const SIN_ASIGNAR = "Sin asignar";
import { useSyncExternalStore } from "react";
import { cotizaciones as cotizacionesMock } from "@/mocks/cotizaciones";
import type { Cotizacion, LineaCotizacion, ManoObraTipo, ReajusteCotizacion } from "@/types/admin";

let listaCotizaciones: Cotizacion[] = [...cotizacionesMock];
const listeners = new Set<() => void>();

function emitir() {
  listeners.forEach((listener) => listener());
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
import { useSyncExternalStore } from "react";
import { mecanicos as mecanicosDemo } from "@/mocks/mecanicos";
import { crearPersistencia } from "@/lib/persistencia";
import type { Mecanico } from "@/types/admin";

let lista: Mecanico[] = [...mecanicosDemo];
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

export function obtenerMecanicos() {
  return lista;
}

persistencia = crearPersistencia<Mecanico[]>(
  "mecanicos",
  () => lista,
  (guardados) => {
    lista = guardados;
    notificar();
  },
);

export function useMecanicos() {
  return useSyncExternalStore(suscribir, obtenerMecanicos, obtenerMecanicos);
}

export function obtenerMecanico(codigo: string) {
  return lista.find((mecanico) => mecanico.codigo === codigo);
}

export function siguienteCodigoMecanico() {
  const numero = lista.reduce((max, mecanico) => {
    const valor = Number(mecanico.codigo.replace(/\D/g, ""));
    return valor > max ? valor : max;
  }, 0);
  return `MEC-${String(numero + 1).padStart(3, "0")}`;
}

export function guardarMecanico(mecanico: Mecanico) {
  const existe = lista.some((item) => item.codigo === mecanico.codigo);
  lista = existe
    ? lista.map((item) => (item.codigo === mecanico.codigo ? mecanico : item))
    : [...lista, mecanico];
  emitir();
}

export function cambiarEstadoMecanico(codigo: string) {
  lista = lista.map((mecanico) =>
    mecanico.codigo === codigo ? { ...mecanico, activo: !mecanico.activo } : mecanico,
  );
  emitir();
}
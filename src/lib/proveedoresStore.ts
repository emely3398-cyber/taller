import { useSyncExternalStore } from "react";
import { proveedores as proveedoresMock } from "@/mocks/proveedores";
import { crearPersistencia } from "@/lib/persistencia";
import type { Proveedor } from "@/types/admin";

let listaProveedores: Proveedor[] = [...proveedoresMock];
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

export function obtenerProveedores() {
  return listaProveedores;
}

persistencia = crearPersistencia<Proveedor[]>(
  "proveedores",
  () => listaProveedores,
  (guardados) => {
    listaProveedores = guardados;
    notificar();
  },
);

export function useProveedores() {
  return useSyncExternalStore(suscribir, obtenerProveedores, obtenerProveedores);
}

export function obtenerProveedor(id: string) {
  return listaProveedores.find((proveedor) => proveedor.id === id);
}

export function siguienteIdProveedor() {
  const numero = listaProveedores.reduce((max, proveedor) => {
    const valor = Number(proveedor.id.replace(/\D/g, ""));
    return valor > max ? valor : max;
  }, 0);
  return `PRV-${String(numero + 1).padStart(3, "0")}`;
}

export function guardarProveedor(proveedor: Proveedor) {
  const existe = listaProveedores.some((item) => item.id === proveedor.id);
  listaProveedores = existe
    ? listaProveedores.map((item) => (item.id === proveedor.id ? proveedor : item))
    : [proveedor, ...listaProveedores];
  emitir();
}
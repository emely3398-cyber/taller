import { useSyncExternalStore } from "react";
import { productos as productosExport } from "@/mocks/productos";
import { movimientosIniciales } from "@/mocks/movimientos";
import type { MovimientoInventario, Producto } from "@/types/admin";

let listaProductos: Producto[] = [...productosExport];
let listaMovimientos: MovimientoInventario[] = [...movimientosIniciales];
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

export function obtenerProductos() {
  return listaProductos;
}

export function obtenerMovimientos() {
  return listaMovimientos;
}

export function useProductos() {
  return useSyncExternalStore(suscribir, obtenerProductos, obtenerProductos);
}

export function useMovimientos() {
  return useSyncExternalStore(suscribir, obtenerMovimientos, obtenerMovimientos);
}

export function obtenerProducto(codigo: string) {
  return listaProductos.find((producto) => producto.codigo === codigo);
}

function siguienteMovimiento() {
  const numero = listaMovimientos.reduce((max, movimiento) => {
    const valor = Number(movimiento.id.replace(/\D/g, ""));
    return valor > max ? valor : max;
  }, 0);
  return `MOV-${String(numero + 1).padStart(4, "0")}`;
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function registrarEntrada(datos: {
  codigo: string;
  cantidad: number;
  proveedorId?: string;
  referencia?: string;
  fecha?: string;
}) {
  const producto = obtenerProducto(datos.codigo);
  if (!producto || datos.cantidad <= 0) return false;

  listaProductos = listaProductos.map((item) =>
    item.codigo === datos.codigo
      ? {
          ...item,
          existencia: item.existencia + datos.cantidad,
          proveedorId: datos.proveedorId || item.proveedorId,
        }
      : item,
  );
  listaMovimientos = [
    {
      id: siguienteMovimiento(),
      fecha: datos.fecha || hoyISO(),
      tipo: "Entrada",
      codigo: producto.codigo,
      nombre: producto.nombre,
      cantidad: datos.cantidad,
      motivo: "Compra de repuesto",
      proveedorId: datos.proveedorId || producto.proveedorId,
      referencia: datos.referencia,
    },
    ...listaMovimientos,
  ];
  emitir();
  return true;
}

export function registrarSalida(datos: {
  codigo: string;
  cantidad: number;
  motivo: "Venta en punto de venta" | "Despacho a orden de servicio";
  referencia: string;
  fecha?: string;
}) {
  const producto = obtenerProducto(datos.codigo);
  if (!producto || datos.cantidad <= 0 || producto.existencia < datos.cantidad) return false;

  listaProductos = listaProductos.map((item) =>
    item.codigo === datos.codigo
      ? { ...item, existencia: item.existencia - datos.cantidad }
      : item,
  );
  listaMovimientos = [
    {
      id: siguienteMovimiento(),
      fecha: datos.fecha || hoyISO(),
      tipo: "Salida",
      codigo: producto.codigo,
      nombre: producto.nombre,
      cantidad: datos.cantidad,
      motivo: datos.motivo,
      referencia: datos.referencia,
    },
    ...listaMovimientos,
  ];
  emitir();
  return true;
}

export function guardarProducto(producto: Producto) {
  const existe = listaProductos.some((item) => item.codigo === producto.codigo);
  listaProductos = existe
    ? listaProductos.map((item) => (item.codigo === producto.codigo ? producto : item))
    : [producto, ...listaProductos];
  emitir();
}

export function asignarProveedorAProductos(proveedorId: string, codigos: string[]) {
  listaProductos = listaProductos.map((item) =>
    codigos.includes(item.codigo)
      ? { ...item, proveedorId }
      : item.proveedorId === proveedorId
        ? { ...item, proveedorId: "" }
        : item,
  );
  emitir();
}

export function siguienteCodigoProducto() {
  const numero = listaProductos.reduce((max, producto) => {
    const valor = Number(producto.codigo.replace(/\D/g, ""));
    return valor > max ? valor : max;
  }, 0);
  return `REP-${String(numero + 1).padStart(4, "0")}`;
}
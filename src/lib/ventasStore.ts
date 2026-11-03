import { useSyncExternalStore } from "react";
import { ventasRecientes } from "@/mocks/ventas";
import { obtenerProducto, registrarSalida } from "@/lib/inventarioStore";
import { crearPersistencia } from "@/lib/persistencia";
import type { Venta, VentaLinea } from "@/types/admin";

let listaVentas: Venta[] = [...ventasRecientes];
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

export function obtenerVentas() {
  return listaVentas;
}

persistencia = crearPersistencia<Venta[]>(
  "ventas",
  () => listaVentas,
  (guardadas) => {
    listaVentas = guardadas;
    notificar();
  },
);

export function useVentas() {
  return useSyncExternalStore(suscribir, obtenerVentas, obtenerVentas);
}

function siguienteNumeroVenta() {
  const numero = listaVentas.reduce((max, venta) => {
    const valor = Number(venta.id.replace(/\D/g, ""));
    return valor > max ? valor : max;
  }, 0);
  return `V-${String(numero + 1).padStart(4, "0")}`;
}

function ahoraTexto() {
  const fecha = new Date();
  const dia = fecha.toISOString().slice(0, 10);
  const hora = `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`;
  return `${dia} ${hora}`;
}

export function registrarVenta(datos: {
  cliente: string;
  medioPago: Venta["medioPago"];
  lineas: VentaLinea[];
}) {
  if (datos.lineas.length === 0) return { ok: false as const, mensaje: "La venta no tiene productos." };

  const venta: Venta = {
    id: siguienteNumeroVenta(),
    fecha: ahoraTexto(),
    cliente: datos.cliente.trim() || "Cliente mostrador",
    lineas: datos.lineas,
    total: datos.lineas.reduce((acc, linea) => acc + linea.cantidad * linea.precio, 0),
    medioPago: datos.medioPago,
  };

  const invalida = datos.lineas.find((linea) => {
    const producto = obtenerProducto(linea.codigo);
    return !producto || producto.existencia < linea.cantidad;
  });

  if (invalida) {
    return {
      ok: false as const,
      mensaje: `Sin existencias suficientes de ${invalida.nombre}. Revise la venta antes de registrarla.`,
    };
  }

  datos.lineas.forEach((linea) => {
    registrarSalida({
      codigo: linea.codigo,
      cantidad: linea.cantidad,
      motivo: "Venta en punto de venta",
      referencia: venta.id,
    });
  });

  listaVentas = [venta, ...listaVentas];
  emitir();
  return { ok: true as const, venta };
}
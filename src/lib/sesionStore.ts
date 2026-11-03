import { useSyncExternalStore } from "react";
import { obtenerMecanicos } from "@/lib/mecanicosStore";

export type TipoAcceso = "Administrador" | "Mecánico";

export type Sesion = {
  tipo: TipoAcceso;
  nombre: string;
  usuario: string;
  mecanicoCodigo?: string;
};

export const USUARIO_ADMIN = "admin";
export const CLAVE_ADMIN = "admin123";

const CLAVE_ALMACEN = "prototipo-sesion-taller";

function leerSesion(): Sesion | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_ALMACEN);
    return crudo ? (JSON.parse(crudo) as Sesion) : null;
  } catch {
    return null;
  }
}

let sesion: Sesion | null = leerSesion();
const listeners = new Set<() => void>();

function emitir() {
  listeners.forEach((listener) => listener());
}

function persistir() {
  if (typeof window === "undefined") return;
  try {
    if (sesion) window.sessionStorage.setItem(CLAVE_ALMACEN, JSON.stringify(sesion));
    else window.sessionStorage.removeItem(CLAVE_ALMACEN);
  } catch {
    /* sesión solo en memoria si el navegador bloquea el almacenamiento */
  }
}

function suscribir(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function obtenerSesion() {
  return sesion;
}

export function useSesion() {
  return useSyncExternalStore(suscribir, obtenerSesion, obtenerSesion);
}

export function iniciarSesion(
  usuario: string,
  contrasena: string,
): { error?: string } {
  const nombreUsuario = usuario.trim().toLowerCase();

  if (!nombreUsuario || !contrasena) {
    return { error: "Ingrese el usuario y la contraseña." };
  }

  if (nombreUsuario === USUARIO_ADMIN) {
    if (contrasena !== CLAVE_ADMIN) {
      return { error: "La contraseña del administrador no coincide." };
    }
    sesion = { tipo: "Administrador", nombre: "Administración", usuario: USUARIO_ADMIN };
    persistir();
    emitir();
    return {};
  }

  const mecanico = obtenerMecanicos().find(
    (item) => item.usuario.toLowerCase() === nombreUsuario,
  );
  if (!mecanico) {
    return { error: "No existe un usuario registrado con ese nombre." };
  }
  if (!mecanico.activo) {
    return { error: "Este mecánico está inactivo. Consulte con el administrador." };
  }
  if (mecanico.contrasena !== contrasena) {
    return { error: "La contraseña del mecánico no coincide." };
  }

  sesion = {
    tipo: "Mecánico",
    nombre: mecanico.nombre,
    usuario: mecanico.usuario,
    mecanicoCodigo: mecanico.codigo,
  };
  persistir();
  emitir();
  return {};
}

export function cerrarSesion() {
  sesion = null;
  persistir();
  emitir();
}
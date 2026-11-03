/**
 * Persistencia compartida del prototipo.
 *
 * Guarda el estado de los módulos en IndexedDB (misma base para todos los
 * perfiles del mismo navegador) y lo replica entre pestañas con BroadcastChannel.
 * Así, al cerrar sesión o recargar, los datos siguen disponibles y un cambio
 * hecho como administrador se ve al entrar como mecánico en otra pestaña.
 *
 * Limitación conocida: la persistencia vive en el navegador del dispositivo.
 * No es una base de datos multiusuario en la nube; para eso hace falta conectar
 * Readdy Backend o SaaS Supabase.
 */

const NOMBRE_BASE = "taller-pdv-datos";
const VERSION_BASE = 1;
const ALMACEN = "estado";
const NOMBRE_CANAL = "taller-pdv-sincronizacion";

type FilaEstado = {
  clave: string;
  valor: unknown;
};

type MensajeCanal = {
  clave: string;
  valor: unknown;
};

let promesaBase: Promise<IDBDatabase | null> | null = null;

function abrirBase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return Promise.resolve(null);
  }
  if (promesaBase) return promesaBase;

  promesaBase = new Promise((resolve) => {
    try {
      const solicitud = window.indexedDB.open(NOMBRE_BASE, VERSION_BASE);
      solicitud.onupgradeneeded = () => {
        const base = solicitud.result;
        if (!base.objectStoreNames.contains(ALMACEN)) {
          base.createObjectStore(ALMACEN, { keyPath: "clave" });
        }
      };
      solicitud.onsuccess = () => resolve(solicitud.result);
      solicitud.onerror = () => resolve(null);
      solicitud.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return promesaBase;
}

export async function leerEstado<T>(clave: string): Promise<T | null> {
  const base = await abrirBase();
  if (!base) return null;

  return new Promise((resolve) => {
    try {
      const transaccion = base.transaction(ALMACEN, "readonly");
      const solicitud = transaccion.objectStore(ALMACEN).get(clave);
      solicitud.onsuccess = () => {
        const fila = solicitud.result as FilaEstado | undefined;
        resolve(fila ? (fila.valor as T) : null);
      };
      solicitud.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function escribirEstado(clave: string, valor: unknown): Promise<void> {
  const base = await abrirBase();
  if (!base) return;
  try {
    const transaccion = base.transaction(ALMACEN, "readwrite");
    transaccion.objectStore(ALMACEN).put({ clave, valor });
  } catch {
    /* almacenamiento bloqueado por el navegador: se conserva solo en memoria */
  }
}

let canal: BroadcastChannel | null = null;
const receptores = new Map<string, (valor: unknown) => void>();

function obtenerCanal(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
    return null;
  }
  if (canal) return canal;
  try {
    canal = new window.BroadcastChannel(NOMBRE_CANAL);
    canal.onmessage = (evento: MessageEvent<MensajeCanal>) => {
      const mensaje = evento.data;
      if (!mensaje || typeof mensaje.clave !== "string") return;
      const receptor = receptores.get(mensaje.clave);
      if (receptor) receptor(mensaje.valor);
    };
  } catch {
    canal = null;
  }
  return canal;
}

export type Persistencia = {
  /** Programa el guardado del estado actual (con un pequeño agrupado). */
  guardar: () => void;
};

/**
 * Crea la persistencia de un módulo.
 * - Hydrata el estado guardado al iniciar (si el módulo no fue modificado antes).
 * - Aplica los cambios recibidos desde otra pestaña sin volver a escribirlos.
 */
export function crearPersistencia<T>(
  clave: string,
  obtener: () => T,
  aplicar: (valor: T) => void,
): Persistencia {
  let tocado = false;
  let temporizador: ReturnType<typeof setTimeout> | null = null;

  receptores.set(clave, (valor) => {
    aplicar(valor as T);
  });

  leerEstado<T>(clave)
    .then((guardado) => {
      if (tocado) return;
      if (guardado === null || guardado === undefined) return;
      aplicar(guardado);
    })
    .catch(() => undefined);

  const guardar = () => {
    tocado = true;
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      const valor = obtener();
      void escribirEstado(clave, valor);
      const conexion = obtenerCanal();
      if (conexion) {
        try {
          conexion.postMessage({ clave, valor } as MensajeCanal);
        } catch {
          /* canal no disponible */
        }
      }
    }, 180);
  };

  return { guardar };
}
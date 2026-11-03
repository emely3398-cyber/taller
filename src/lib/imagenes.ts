import type { FotoOrden, Producto } from "@/types/admin";

export type FotoVista = {
  url: string;
  nombre?: string;
  pie?: string;
};

/** Convierte un archivo en una URL de datos para que la fotografía persista en el prototipo. */
export function leerComoDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result || ""));
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(archivo);
  });
}

export async function leerArchivosComoDataUrl(
  archivos: File[],
): Promise<{ nombre: string; url: string }[]> {
  return Promise.all(
    archivos.map(async (archivo) => ({
      nombre: archivo.name,
      url: await leerComoDataUrl(archivo),
    })),
  );
}

export function fotosDeOrden(fotos: FotoOrden[]): FotoVista[] {
  return fotos.map((foto) => ({ url: foto.url, nombre: foto.nombre }));
}

export function fotosDeProducto(producto: Producto): FotoVista[] {
  const urls = [producto.imagen, ...(producto.imagenes ?? [])].filter(
    (url): url is string => Boolean(url && url.trim()),
  );
  return Array.from(new Set(urls)).map((url) => ({ url, nombre: producto.nombre }));
}
import { useState } from "react";
import PhotoViewer from "@/components/base/PhotoViewer";
import type { FotoVista } from "@/lib/imagenes";

type PhotoGalleryProps = {
  fotos: FotoVista[];
  alt: string;
  titulo?: string;
  vacio?: string;
  columnas?: string;
  proporcion?: string;
  pie?: (foto: FotoVista) => string | undefined;
  nota?: string;
};

export default function PhotoGallery({
  fotos,
  alt,
  titulo,
  vacio = "Sin fotografías registradas.",
  columnas = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  proporcion = "aspect-[4/3]",
  pie,
  nota,
}: PhotoGalleryProps) {
  const [indiceAbierto, setIndiceAbierto] = useState<number | null>(null);

  if (fotos.length === 0) {
    return (
      <p className="border border-dashed border-background-700 bg-background-100 px-2.5 py-3 text-[12px] text-foreground-500">
        {vacio}
      </p>
    );
  }

  return (
    <>
      <div className={`grid gap-2 ${columnas}`}>
        {fotos.map((foto, indice) => (
          <div key={`${foto.url}-${indice}`} className="border border-background-800 bg-background-100 p-1">
            <button
              type="button"
              onClick={() => setIndiceAbierto(indice)}
              aria-label={`Ampliar fotografía ${indice + 1} de ${fotos.length}`}
              className={`group relative block w-full cursor-pointer overflow-hidden bg-background-200 ${proporcion}`}
            >
              <img
                src={foto.url}
                alt={`${alt} ${indice + 1}`}
                title={alt}
                className="h-full w-full object-cover object-top"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <i className="ri-zoom-in-line text-[14px] leading-none" aria-hidden="true" />
                </span>
              </span>
            </button>
            <p className="mt-1 truncate text-[10px] text-foreground-500">
              {pie ? pie(foto) || "Ver ampliada" : foto.nombre || "Ver ampliada"}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-foreground-500">
        <i className="ri-focus-3-line mr-1 align-middle text-[12px]" aria-hidden="true" />
        {nota || "Toque o haga clic en una fotografía para verla ampliada."}
      </p>

      {indiceAbierto !== null && (
        <PhotoViewer
          fotos={fotos}
          indiceInicial={indiceAbierto}
          titulo={titulo || alt}
          onClose={() => setIndiceAbierto(null)}
        />
      )}
    </>
  );
}
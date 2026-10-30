import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import type { FotoVista } from "@/lib/imagenes";

type PhotoViewerProps = {
  fotos: FotoVista[];
  indiceInicial?: number;
  titulo?: string;
  onClose: () => void;
};

export default function PhotoViewer({
  fotos,
  indiceInicial = 0,
  titulo,
  onClose,
}: PhotoViewerProps) {
  const total = fotos.length;
  const [indice, setIndice] = useState(() => {
    if (total === 0) return 0;
    return Math.min(Math.max(indiceInicial, 0), total - 1);
  });
  const inicioToque = useRef<number | null>(null);
  const varias = total > 1;
  const actual = fotos[indice];

  const anterior = useCallback(() => {
    if (total < 2) return;
    setIndice((prev) => (prev - 1 + total) % total);
  }, [total]);

  const siguiente = useCallback(() => {
    if (total < 2) return;
    setIndice((prev) => (prev + 1) % total);
  }, [total]);

  useEffect(() => {
    const alPresionar = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") anterior();
      if (event.key === "ArrowRight") siguiente();
    };
    window.addEventListener("keydown", alPresionar);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = overflowPrevio;
    };
  }, [anterior, siguiente, onClose]);

  if (!actual) return null;

  const cerrarFondo = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo || "Visor de fotografías"}
      onClick={cerrarFondo}
      className="fixed inset-0 z-[95] flex items-stretch justify-center bg-black/85 md:items-center md:p-4"
    >
      <div className="flex h-full w-full flex-col md:h-[90vh] md:max-h-[90vh] md:max-w-[1100px] md:border md:border-white/15 md:bg-black/40">
        <div className="flex shrink-0 items-start justify-between gap-3 px-3 py-2.5 text-white md:px-4">
          <div className="min-w-0">
            {titulo && <p className="truncate text-[12px] font-medium text-white/90">{titulo}</p>}
            <p className="mt-0.5 truncate text-[11px] text-white/60">
              {varias ? "Use las flechas o deslice para recorrer" : "Fotografía ampliada"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar visor"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border border-white/25 text-white/85 hover:bg-white/15 hover:text-white"
          >
            <i className="ri-close-line text-[17px] leading-none" aria-hidden="true" />
          </button>
        </div>

        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-1 md:px-4"
          onTouchStart={(event) => {
            inicioToque.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const inicio = inicioToque.current;
            inicioToque.current = null;
            if (inicio === null) return;
            const fin = event.changedTouches[0]?.clientX ?? inicio;
            const desplazamiento = fin - inicio;
            if (Math.abs(desplazamiento) < 45) return;
            if (desplazamiento > 0) anterior();
            else siguiente();
          }}
        >
          {varias && (
            <button
              type="button"
              onClick={anterior}
              aria-label="Fotografía anterior"
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center border border-white/25 bg-black/45 text-white hover:bg-black/70 md:left-4 md:h-11 md:w-11"
            >
              <i className="ri-arrow-left-s-line text-[22px] leading-none" aria-hidden="true" />
            </button>
          )}

          <img
            src={actual.url}
            alt={actual.nombre ? `Fotografía ampliada: ${actual.nombre}` : "Fotografía ampliada"}
            draggable={false}
            className="max-h-full max-w-full select-none object-contain"
          />

          {varias && (
            <button
              type="button"
              onClick={siguiente}
              aria-label="Fotografía siguiente"
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center border border-white/25 bg-black/45 text-white hover:bg-black/70 md:right-4 md:h-11 md:w-11"
            >
              <i className="ri-arrow-right-s-line text-[22px] leading-none" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-2.5 text-white md:px-4">
          <div className="min-w-0">
            <p className="truncate text-[11px] text-white/75">
              {actual.nombre || "Fotografía registrada"}
            </p>
            {actual.pie && <p className="truncate text-[11px] text-white/50">{actual.pie}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span className="border border-white/20 px-2 py-1 font-mono text-[11px] text-white/85">
              {indice + 1} de {total}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer border border-white/25 px-3 py-1 text-[11px] text-white/90 hover:bg-white/15 hover:text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import type { FotoVista } from "@/lib/imagenes";

type PhotoThumbProps = {
  fotos: FotoVista[];
  alt: string;
  onOpen: (indice: number) => void;
};

export default function PhotoThumb({ fotos, alt, onOpen }: PhotoThumbProps) {
  if (fotos.length === 0) {
    return (
      <span className="flex h-11 w-16 items-center justify-center border border-dashed border-background-700 text-[10px] text-foreground-500">
        Sin foto
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(0)}
      aria-label={`Ampliar foto de ${alt}`}
      className="group relative block h-11 w-16 cursor-pointer overflow-hidden border border-background-800 bg-background-200"
    >
      <img
        src={fotos[0].url}
        alt={`Foto de ${alt}`}
        title={alt}
        className="h-full w-full object-cover object-top"
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
        <i
          className="ri-zoom-in-line text-[13px] leading-none text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </span>
      {fotos.length > 1 && (
        <span className="pointer-events-none absolute bottom-0 right-0 bg-black/65 px-1 font-mono text-[9px] leading-[14px] text-white">
          {fotos.length}
        </span>
      )}
    </button>
  );
}
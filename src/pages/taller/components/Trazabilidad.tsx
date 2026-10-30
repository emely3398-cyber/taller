import { useState } from "react";
import PhotoViewer from "@/components/base/PhotoViewer";
import { formatDateTime } from "@/lib/format";
import type { OrdenServicio } from "@/types/admin";

type Props = {
  orden: OrdenServicio;
  limite?: boolean;
};

export default function Trazabilidad({ orden, limite = true }: Props) {
  const registros = [...orden.seguimiento].reverse();
  const [visor, setVisor] = useState<{ fotos: { url: string; nombre?: string }[]; indice: number } | null>(null);

  return (
    <>
    <ol
      className={`divide-y divide-background-700 overflow-y-auto ${
        limite ? "max-h-[460px]" : ""
      }`.trim()}
    >
      {registros.map((registro, index) => (
        <li key={`${registro.fecha}-${index}`} className="px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-[11px] text-foreground-500">
              {formatDateTime(registro.fecha)}
            </span>
            {registro.estadoAnterior && registro.estadoAnterior !== registro.estadoNuevo ? (
              <>
                <span className="text-[11px] text-foreground-400">{registro.estadoAnterior}</span>
                <i
                  className="ri-arrow-right-line text-[11px] leading-none text-foreground-500"
                  aria-hidden="true"
                />
                <span className="border border-primary-200 bg-primary-50 px-1.5 py-0.5 text-[11px] text-primary-700">
                  {registro.estadoNuevo}
                </span>
              </>
            ) : (
              <>
                <span className="border border-primary-200 bg-primary-50 px-1.5 py-0.5 text-[11px] text-primary-700">
                  {registro.estadoNuevo}
                </span>
                <span className="text-[10px] uppercase tracking-[0.04em] text-foreground-500">
                  Avance registrado
                </span>
              </>
            )}
          </div>

          <p className="mt-1 text-[12px] leading-relaxed text-foreground-100">
            {registro.observacion}
          </p>

          {registro.cambioServicio && (
            <p className="mt-1 border-l-2 border-accent-300 pl-2 text-[11px] text-foreground-300">
              Cambio en diagnóstico o servicio: {registro.cambioServicio}
            </p>
          )}

          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-foreground-500">
            <i className="ri-user-settings-line text-[12px] leading-none" aria-hidden="true" />
            {registro.mecanico}
          </p>

          {registro.fotos.length > 0 && (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {registro.fotos.map((foto, indiceFoto) => (
                <li key={`${indiceFoto}-${foto.nombre}`} className="border border-background-800 p-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setVisor({
                        fotos: registro.fotos.map((item) => ({ url: item.url, nombre: item.nombre })),
                        indice: indiceFoto,
                      })
                    }
                    aria-label={`Ampliar fotografía del avance ${indiceFoto + 1}`}
                    className="group relative block h-14 w-20 cursor-pointer overflow-hidden bg-background-200"
                  >
                    <img
                      src={foto.url}
                      alt={`Avance de la orden ${orden.id}`}
                      title={`${orden.marca} ${orden.modelo} ${orden.placa}`}
                      className="h-full w-full object-cover object-top"
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                      <i
                        className="ri-zoom-in-line text-[13px] leading-none text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
      {registros.length === 0 && (
        <li className="px-3 py-6 text-center text-[12px] text-foreground-500">
          La orden todavía no tiene movimientos registrados.
        </li>
      )}
    </ol>

      {visor && (
        <PhotoViewer
          fotos={visor.fotos}
          indiceInicial={visor.indice}
          titulo={`Avance ${orden.id} · ${orden.marca} ${orden.modelo}`}
          onClose={() => setVisor(null)}
        />
      )}
    </>
  );
}
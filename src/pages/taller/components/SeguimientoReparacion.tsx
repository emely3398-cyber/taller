import { useEffect, useMemo, useState } from "react";
import { btn } from "@/components/base/buttonStyles";
import StatusTag from "@/components/base/StatusTag";
import { formatDateTime } from "@/lib/format";
import Trazabilidad from "@/pages/taller/components/Trazabilidad";
import type { EstadoOrden, OrdenServicio } from "@/types/admin";

type Props = {
  orden: OrdenServicio;
};

type Etapa = {
  estado: EstadoOrden;
  icono: string;
  nota?: string;
};

const ETAPAS: Etapa[] = [
  { estado: "Recibida", icono: "ri-inbox-archive-line" },
  { estado: "En diagnóstico", icono: "ri-file-search-line" },
  { estado: "Cotizada", icono: "ri-file-list-3-line" },
  { estado: "En reparación", icono: "ri-tools-line" },
  { estado: "En espera de repuesto", icono: "ri-time-line", nota: "Opcional" },
  { estado: "Reparación finalizada", icono: "ri-check-double-line" },
  { estado: "Entregada", icono: "ri-checkbox-circle-line" },
];

type Situacion = "completada" | "actual" | "pendiente";

function situacionDe(etapa: EstadoOrden, registrados: Set<EstadoOrden>, actual: EstadoOrden): Situacion {
  if (etapa === actual) return "actual";
  if (registrados.has(etapa)) return "completada";
  return "pendiente";
}

const estilosEtapa: Record<Situacion, string> = {
  completada: "border-primary-200 bg-primary-50 text-primary-800",
  actual: "border-primary-600 bg-primary-500 text-white",
  pendiente: "border-background-800 bg-background-200 text-foreground-500",
};

const estilosIcono: Record<Situacion, string> = {
  completada: "bg-primary-500 text-white",
  actual: "bg-white/20 text-white",
  pendiente: "bg-background-300 text-foreground-500",
};

const estilosLinea: Record<Situacion, string> = {
  completada: "bg-primary-400",
  actual: "bg-primary-400",
  pendiente: "bg-background-700",
};

export default function SeguimientoReparacion({ orden }: Props) {
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [etapaConsultada, setEtapaConsultada] = useState<EstadoOrden | null>(null);

  useEffect(() => {
    if (!historialAbierto && !etapaConsultada) return undefined;
    const alPresionar = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHistorialAbierto(false);
        setEtapaConsultada(null);
      }
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [historialAbierto, etapaConsultada]);

  const registrados = useMemo(() => {
    const set = new Set<EstadoOrden>();
    orden.seguimiento.forEach((registro) => set.add(registro.estadoNuevo));
    set.add(orden.estado);
    return set;
  }, [orden.seguimiento, orden.estado]);

  const cancelada = orden.estado === "Servicio cancelado";
  const totalMovimientos = orden.seguimiento.length;
  const ultimo = orden.seguimiento[orden.seguimiento.length - 1];
  const etapasVisibles = ETAPAS.filter((etapa) => registrados.has(etapa.estado));

  const movimientosEtapa = etapaConsultada
    ? orden.seguimiento.filter(
        (registro) => registro.estadoNuevo === etapaConsultada && registro.estadoAnterior !== etapaConsultada,
      )
    : [];

  const abrirEtapa = (estado: EstadoOrden) => {
    setHistorialAbierto(false);
    setEtapaConsultada(estado);
  };

  const abrirHistorial = () => {
    setEtapaConsultada(null);
    setHistorialAbierto(true);
  };

  const cerrar = () => {
    setHistorialAbierto(false);
    setEtapaConsultada(null);
  };

  return (
    <>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.04em] text-foreground-500">
              Estado actual
            </p>
            <StatusTag label={orden.estado} />
            {ultimo && (
              <span className="text-[11px] text-foreground-500">
                Último movimiento {formatDateTime(ultimo.fecha)}
              </span>
            )}
          </div>
          <button type="button" onClick={abrirHistorial} className={btn("secondary")}>
            <i className="ri-history-line text-[13px] leading-none" aria-hidden="true" />
            Ver historial
            <span className="text-foreground-500">({totalMovimientos})</span>
          </button>
        </div>

        {/* Escritorio: barra horizontal de etapas */}
        <ol className="mt-3 hidden lg:flex lg:flex-wrap lg:items-stretch">
          {etapasVisibles.map((etapa, index) => {
            const situacion = situacionDe(etapa.estado, registrados, orden.estado);
            return (
              <li key={etapa.estado} className="flex min-w-0 flex-1 items-start">
                <button
                  type="button"
                  onClick={() => abrirEtapa(etapa.estado)}
                  aria-label={`Consultar movimientos de la etapa ${etapa.estado}`}
                  className={`flex w-full cursor-pointer flex-col items-center gap-1.5 border px-1.5 py-2 text-center transition-colors ${estilosEtapa[situacion]}`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${estilosIcono[situacion]}`}
                  >
                    <i className={`${etapa.icono} text-[14px] leading-none`} aria-hidden="true" />
                  </span>
                  <span className="text-[11px] font-medium leading-tight">{etapa.estado}</span>
                  <span className="text-[10px] leading-none opacity-80">
                    {situacion === "actual"
                      ? "Estado actual"
                      : situacion === "completada"
                        ? "Registrada"
                        : etapa.nota || "Pendiente"}
                  </span>
                </button>
                {index < etapasVisibles.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`mt-5 h-0.5 w-3 shrink-0 ${estilosLinea[situacion]}`}
                  />
                )}
              </li>
            );
          })}
        </ol>

        {/* Móvil y tablet: registros compactos, sin desplazamiento horizontal */}
        <ol className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:hidden">
          {etapasVisibles.map((etapa) => {
            const situacion = situacionDe(etapa.estado, registrados, orden.estado);
            return (
              <li key={etapa.estado}>
                <button
                  type="button"
                  onClick={() => abrirEtapa(etapa.estado)}
                  aria-label={`Consultar movimientos de la etapa ${etapa.estado}`}
                  className={`flex w-full cursor-pointer items-center gap-2 border px-2 py-2 text-left ${estilosEtapa[situacion]}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${estilosIcono[situacion]}`}
                  >
                    <i className={`${etapa.icono} text-[12px] leading-none`} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium">{etapa.estado}</span>
                    <span className="block text-[10px] opacity-80">
                      {situacion === "actual"
                        ? "Estado actual"
                        : situacion === "completada"
                          ? "Registrada en el historial"
                          : etapa.nota || "Pendiente"}
                    </span>
                  </span>
                  <i className="ri-arrow-right-s-line text-[13px] leading-none opacity-70" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>

        {cancelada && (
          <div className="mt-2 flex flex-wrap items-center gap-2 border border-background-800 bg-background-200 px-2.5 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground-200 text-background-50">
              <i className="ri-close-circle-line text-[13px] leading-none" aria-hidden="true" />
            </span>
            <p className="text-[12px] text-foreground-100">
              <strong>Servicio cancelado.</strong> Salida alternativa del servicio, no una etapa
              obligatoria de la reparación.
            </p>
            {orden.motivoCancelacion && (
              <p className="w-full border-t border-background-700 pt-1.5 text-[11px] text-foreground-300">
                Motivo: {orden.motivoCancelacion}
              </p>
            )}
          </div>
        )}
      </div>

      {(historialAbierto || etapaConsultada) && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Cerrar historial"
            onClick={cerrar}
            className="absolute inset-0 h-full w-full cursor-pointer bg-black/45"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={
              etapaConsultada
                ? `Movimientos de la etapa ${etapaConsultada}`
                : `Historial de la orden ${orden.id}`
            }
            className="relative flex max-h-[85vh] w-full max-w-[600px] flex-col border border-background-800 bg-background-900"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-background-800 px-3 py-2.5">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-foreground-500">
                  {orden.id} · {orden.marca} {orden.modelo} · {orden.placa}
                </p>
                <h2 className="truncate text-[14px] font-semibold text-foreground-50">
                  {etapaConsultada
                    ? `Movimientos de la etapa: ${etapaConsultada}`
                    : "Historial de movimientos"}
                </h2>
              </div>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border border-background-800 text-foreground-400 hover:bg-background-200 hover:text-foreground-50"
              >
                <i className="ri-close-line text-[15px] leading-none" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {etapaConsultada ? (
                <>
                  {movimientosEtapa.length === 0 ? (
                    <p className="px-3 py-6 text-center text-[12px] text-foreground-500">
                      La etapa <strong>{etapaConsultada}</strong> no está registrada en el historial
                      de esta orden.
                    </p>
                  ) : (
                    <Trazabilidad
                      orden={{ ...orden, seguimiento: movimientosEtapa }}
                      limite={false}
                    />
                  )}
                </>
              ) : (
                <Trazabilidad orden={orden} limite={false} />
              )}
            </div>

            <div className="shrink-0 border-t border-background-800 p-3">
              <button type="button" onClick={cerrar} className={`${btn("secondary")} w-full`}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
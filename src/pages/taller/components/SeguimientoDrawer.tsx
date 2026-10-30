import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusTag from "@/components/base/StatusTag";
import { btn } from "@/components/base/buttonStyles";
import { formatDate, formatDateTime } from "@/lib/format";
import CambioEstadoForm from "@/pages/taller/components/CambioEstadoForm";
import Trazabilidad from "@/pages/taller/components/Trazabilidad";
import type { OrdenServicio } from "@/types/admin";

type Props = {
  orden: OrdenServicio;
  onClose: () => void;
};

export default function SeguimientoDrawer({ orden, onClose }: Props) {
  const [cambioAbierto, setCambioAbierto] = useState(false);

  useEffect(() => {
    const alPresionar = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onClose]);

  const ultimo = orden.seguimiento[orden.seguimiento.length - 1];

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <button
        type="button"
        aria-label="Cerrar seguimiento"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-pointer bg-black/45"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Seguimiento de la orden ${orden.id}`}
        className="relative flex h-full w-full max-w-[440px] flex-col border-l border-background-800 bg-background-900"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-background-800 px-3 py-2.5">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-foreground-500">Seguimiento de la orden</p>
            <h2 className="truncate text-[14px] font-semibold text-foreground-50">
              {orden.id} · {orden.marca} {orden.modelo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border border-background-800 text-foreground-400 hover:bg-background-200 hover:text-foreground-50"
          >
            <i className="ri-close-line text-[15px] leading-none" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-background-800 px-3 py-2.5">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
              <div>
                <p className="text-[10px] uppercase tracking-[0.04em] text-foreground-500">
                  Propietario
                </p>
                <p className="truncate text-foreground-50">{orden.propietario}</p>
                <p className="font-mono text-[11px] text-foreground-400">{orden.telefono}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.04em] text-foreground-500">
                  Motocicleta
                </p>
                <p className="truncate text-foreground-50">
                  {orden.marca} {orden.modelo} {orden.anio && `· ${orden.anio}`}
                </p>
                <p className="font-mono text-[11px] text-foreground-400">{orden.placa}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.04em] text-foreground-500">
                  Mecánico asignado
                </p>
                <p className="truncate text-foreground-50">{orden.mecanico}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.04em] text-foreground-500">
                  Estado actual
                </p>
                <div className="mt-0.5">
                  <StatusTag label={orden.estado} />
                </div>
              </div>
            </div>

            <p className="mt-2 border-t border-background-800 pt-2 text-[11px] text-foreground-500">
              Recepción {formatDate(orden.fechaIngreso)} · Entrega estimada{" "}
              {formatDate(orden.fechaEntrega)}
              {ultimo && ` · Último movimiento ${formatDateTime(ultimo.fecha)}`}
            </p>

            {orden.repuestoFaltante && (
              <p className="mt-2 border border-accent-300 bg-accent-50 px-2 py-1.5 text-[11px] text-accent-800">
                <strong>Repuesto pendiente:</strong> {orden.repuestoFaltante}
              </p>
            )}
            {orden.motivoCancelacion && (
              <p className="mt-2 border border-background-800 bg-background-200 px-2 py-1.5 text-[11px] text-foreground-300">
                <strong>Motivo de cancelación:</strong> {orden.motivoCancelacion}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCambioAbierto((prev) => !prev)}
                className={btn(cambioAbierto ? "secondary" : "primary")}
                aria-expanded={cambioAbierto}
              >
                <i
                  className={`${cambioAbierto ? "ri-close-line" : "ri-refresh-line"} text-[13px] leading-none`}
                  aria-hidden="true"
                />
                {cambioAbierto ? "Ocultar registro" : "Registrar cambio de estado"}
              </button>
              <Link to={`/taller/${orden.id}`} className={btn("secondary")}>
                <i className="ri-external-link-line text-[13px] leading-none" aria-hidden="true" />
                Ver hoja completa
              </Link>
            </div>
          </div>

          {cambioAbierto && (
            <div className="border-b border-background-800 bg-background-100 p-3">
              <p className="mb-2 text-[11px] uppercase tracking-[0.04em] text-foreground-500">
                Nuevo movimiento
              </p>
              <CambioEstadoForm orden={orden} onRegistrado={() => undefined} />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2 border-b border-background-800 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.04em] text-foreground-500">
                Línea de tiempo
              </p>
              <span className="text-[11px] text-foreground-500">
                {orden.seguimiento.length} movimientos
              </span>
            </div>
            <Trazabilidad orden={orden} limite={false} />
          </div>

          {orden.seguimiento.length === 1 && (
            <p className="px-3 py-2 text-[11px] leading-relaxed text-foreground-500">
              Solo se muestran los estados realmente registrados. La orden no avanza sola: cada
              cambio lo registra el personal del taller.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
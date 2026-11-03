import { useState, type FormEvent } from "react";
import { btn } from "@/components/base/buttonStyles";
import Field from "@/components/base/Field";
import { formatDateTime } from "@/lib/format";
import { actualizarTipoAtencion } from "@/lib/ordenesStore";
import { useSesion } from "@/lib/sesionStore";
import { TIPOS_ATENCION } from "@/lib/taller";
import type { OrdenServicio, TipoAtencion } from "@/types/admin";

type Props = {
  orden: OrdenServicio;
};

/**
 * Permite al administrador actualizar el tipo de atención en cualquier etapa
 * del seguimiento. Cada cambio queda registrado con el valor anterior, el nuevo,
 * el usuario responsable y la fecha, sin alterar el diagnóstico ni el estado.
 */
export default function TipoAtencionControl({ orden }: Props) {
  const sesion = useSesion();
  const [valor, setValor] = useState<TipoAtencion | "">(orden.tipoAtencion || "");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const historial = orden.historialAtencion ?? [];

  const guardar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAviso("");
    if (!valor) {
      setError("Seleccione el tipo de atención que corresponde a la motocicleta.");
      return;
    }
    if (valor === orden.tipoAtencion) {
      setError("El tipo de atención seleccionado es el que está vigente.");
      return;
    }
    actualizarTipoAtencion(orden.id, valor, sesion?.nombre || "Administración", motivo);
    setMotivo("");
    setError("");
    setAviso(
      `Tipo de atención actualizado a ${valor}. El cambio quedó registrado en la trazabilidad de la orden.`,
    );
  };

  return (
    <div className="mt-3 border-t border-background-800 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.04em] text-foreground-500">
          Tipo de atención vigente
        </p>
        <span className="border border-background-800 bg-background-100 px-2 py-0.5 text-[11px] text-foreground-200">
          {orden.tipoAtencion || "Sin especificar"}
        </span>
      </div>

      <form onSubmit={guardar} className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field label="Actualizar tipo de atención" htmlFor={`tipo-atencion-admin-${orden.id}`}>
          <select
            id={`tipo-atencion-admin-${orden.id}`}
            className="admin-field"
            value={valor}
            onChange={(e) => {
              setValor(e.target.value as TipoAtencion | "");
              setError("");
              setAviso("");
            }}
          >
            <option value="">Sin especificar</option>
            {TIPOS_ATENCION.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Motivo del cambio" htmlFor={`tipo-atencion-motivo-${orden.id}`}>
          <input
            id={`tipo-atencion-motivo-${orden.id}`}
            className="admin-field"
            value={motivo}
            maxLength={160}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. El cliente solicita revisión general"
          />
        </Field>
        <div className="flex items-end">
          <button type="submit" className={`${btn("secondary")} w-full`}>
            <i className="ri-save-line text-[13px] leading-none" aria-hidden="true" />
            Actualizar clasificación
          </button>
        </div>
      </form>

      <p className="mt-1.5 text-[11px] leading-relaxed text-foreground-500">
        El cambio se guarda en la misma hoja de servicio y no altera el diagnóstico, el estado de la
        orden, las cotizaciones ni el inventario.
      </p>

      {error && (
        <p className="mt-2 border border-accent-300 bg-accent-50 px-2 py-1.5 text-[11px] text-accent-800">
          {error}
        </p>
      )}
      {aviso && (
        <p className="mt-2 border border-primary-200 bg-primary-50 px-2 py-1.5 text-[11px] text-primary-800">
          {aviso}
        </p>
      )}

      {historial.length > 0 && (
        <ul className="mt-2 divide-y divide-background-700 border border-background-800">
          {historial
            .slice()
            .reverse()
            .map((cambio, indice) => (
              <li key={`${cambio.fecha}-${indice}`} className="px-2 py-1.5">
                <p className="text-[11px] text-foreground-100">
                  {cambio.valorAnterior || "Sin especificar"} → <strong>{cambio.valorNuevo}</strong>
                </p>
                <p className="text-[10px] text-foreground-500">
                  {formatDateTime(cambio.fecha)} · {cambio.responsable}
                  {cambio.motivo ? ` · ${cambio.motivo}` : ""}
                </p>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
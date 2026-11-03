import { useState } from "react";
import { btn } from "@/components/base/buttonStyles";
import { formatDate, formatMoney } from "@/lib/format";
import {
  autorizarAmpliacionCotizacion,
  incorporarPendienteCotizacion,
  registrarAmpliacionCotizacion,
  type ResultadoCotizacion,
} from "@/lib/cotizacionesStore";
import { useSesion } from "@/lib/sesionStore";
import type { Cotizacion, PendienteCotizacion } from "@/types/admin";

type Props = {
  cotizacion: Cotizacion;
  puedeEditar: boolean;
};

const ESTILO_ESTADO: Record<PendienteCotizacion["estado"], string> = {
  "Pendiente de incorporar": "border-accent-300 bg-accent-50 text-accent-800",
  "Pendiente de autorización": "border-accent-300 bg-accent-50 text-accent-800",
  Incorporado: "border-primary-300 bg-primary-50 text-primary-800",
  Autorizado: "border-primary-300 bg-primary-50 text-primary-800",
};

/**
 * Repuestos agregados a la orden después de crear la cotización.
 * Pendiente / Enviada: se incorporan conservando el mismo número de cotización.
 * Aprobada: se registra una ampliación y la autorización explícita del cliente.
 */
export default function RepuestosAdicionales({ cotizacion, puedeEditar }: Props) {
  const sesion = useSesion();
  const [valores, setValores] = useState<Record<string, { cantidad: string; precio: string }>>({});
  const [nota, setNota] = useState("");
  const [resultado, setResultado] = useState<ResultadoCotizacion | null>(null);

  const pendientes = cotizacion.pendientes ?? [];
  const ampliaciones = cotizacion.ampliaciones ?? [];
  const responsable = sesion?.nombre || "Administración";
  const rechazada = cotizacion.estado === "Rechazada";

  const valorDe = (pendiente: PendienteCotizacion) =>
    valores[pendiente.id] ?? {
      cantidad: String(pendiente.cantidad),
      precio: String(pendiente.precioUnitario),
    };

  const actualizar = (
    pendiente: PendienteCotizacion,
    campo: "cantidad" | "precio",
    valor: string,
  ) => {
    setValores((prev) => {
      const base = prev[pendiente.id] ?? {
        cantidad: String(pendiente.cantidad),
        precio: String(pendiente.precioUnitario),
      };
      return { ...prev, [pendiente.id]: { ...base, [campo]: valor } };
    });
  };

  if (cotizacion.tipo !== "Taller") return null;

  const incorporar = (pendiente: PendienteCotizacion) => {
    const valor = valorDe(pendiente);
    setResultado(
      incorporarPendienteCotizacion(cotizacion.id, pendiente.id, {
        cantidad: Number(valor.cantidad),
        precioUnitario: Number(valor.precio),
        responsable,
        motivo: nota,
      }),
    );
  };

  const ampliar = (pendiente: PendienteCotizacion) => {
    const valor = valorDe(pendiente);
    setResultado(
      registrarAmpliacionCotizacion(cotizacion.id, pendiente.id, {
        cantidad: Number(valor.cantidad),
        precioUnitario: Number(valor.precio),
        responsable,
        motivo: nota,
      }),
    );
  };

  const autorizar = (ampliacionId: string) => {
    setResultado(autorizarAmpliacionCotizacion(cotizacion.id, ampliacionId, responsable));
  };

  return (
    <div className="space-y-2">
      {cotizacion.estado === "Aprobada" && (
        <p className="border border-background-800 bg-background-100 px-2.5 py-2 text-[11px] leading-relaxed text-foreground-300">
          Cotización aprobada: los importes aprobados no se modifican en silencio. Cada repuesto
          adicional se registra como ampliación y requiere la autorización explícita del cliente.
          {cotizacion.importeAprobado !== undefined && (
            <span className="mt-1 block">
              Importe originalmente aprobado:{" "}
              <span className="font-mono text-foreground-50">
                {formatMoney(cotizacion.importeAprobado)}
              </span>
            </span>
          )}
        </p>
      )}

      {cotizacion.requiereNuevaConfirmacion && (
        <p className="border border-accent-300 bg-accent-50 px-2.5 py-2 text-[11px] leading-relaxed text-accent-800">
          La cotización se modificó después de enviarse al cliente. El ajuste quedó registrado y la
          versión requiere una nueva comunicación y confirmación; el sistema no asume aprobación.
        </p>
      )}

      {rechazada && (
        <p className="border border-background-800 bg-background-200 px-2.5 py-2 text-[11px] text-foreground-400">
          La cotización está rechazada. Se conserva el historial y no se incorporan repuestos
          posteriores.
        </p>
      )}

      {pendientes.length === 0 ? (
        <p className="text-[12px] text-foreground-500">
          No hay repuestos agregados a la orden después de crear esta cotización.
        </p>
      ) : (
        <>
          {puedeEditar && !rechazada && (
            <div className="border border-background-800 bg-background-100 px-2 py-1.5">
              <label
                htmlFor={`nota-adicional-${cotizacion.id}`}
                className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
              >
                Nota del ajuste (opcional)
              </label>
              <input
                id={`nota-adicional-${cotizacion.id}`}
                className="admin-field"
                value={nota}
                maxLength={180}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej. Repuesto adicional solicitado por el mecánico"
              />
            </div>
          )}

          <ul className="space-y-2">
            {pendientes.map((pendiente) => {
              const valor = valorDe(pendiente);
              const ampliacion = ampliaciones.find((item) => item.id === pendiente.ampliacionId);
              const resuelto =
                pendiente.estado === "Incorporado" || pendiente.estado === "Autorizado";
              return (
                <li
                  key={pendiente.id}
                  className="border border-background-800 bg-background-100 px-2.5 py-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12px] text-foreground-50">{pendiente.descripcion}</p>
                      <p className="font-mono text-[10px] text-foreground-500">
                        {pendiente.codigo} · {pendiente.cantidad} ×{" "}
                        {formatMoney(pendiente.precioUnitario)} · {formatDate(pendiente.fecha)} ·{" "}
                        {pendiente.registradoPor}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap border px-1.5 py-0.5 text-[10px] ${ESTILO_ESTADO[pendiente.estado]}`}
                    >
                      {pendiente.estado}
                    </span>
                  </div>

                  {pendiente.observacion && (
                    <p className="mt-1 text-[11px] text-foreground-400">{pendiente.observacion}</p>
                  )}

                  {resuelto && (
                    <p className="mt-1 text-[11px] text-foreground-500">
                      Resuelto {pendiente.fechaResolucion ? formatDate(pendiente.fechaResolucion) : ""}{" "}
                      {pendiente.resueltoPor ? `por ${pendiente.resueltoPor}` : ""}.
                    </p>
                  )}

                  {puedeEditar && !rechazada && !resuelto && (
                    <>
                      {pendiente.estado === "Pendiente de incorporar" && (
                        <div className="mt-2 flex flex-wrap items-end gap-2">
                          <div className="w-[92px]">
                            <label
                              htmlFor={`cant-${pendiente.id}`}
                              className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                            >
                              Cantidad
                            </label>
                            <input
                              id={`cant-${pendiente.id}`}
                              className="admin-field text-right font-mono"
                              value={valor.cantidad}
                              inputMode="numeric"
                              onChange={(e) => actualizar(pendiente, "cantidad", e.target.value)}
                            />
                          </div>
                          <div className="w-[130px]">
                            <label
                              htmlFor={`precio-${pendiente.id}`}
                              className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                            >
                              Precio unit.
                            </label>
                            <input
                              id={`precio-${pendiente.id}`}
                              className="admin-field text-right font-mono"
                              value={valor.precio}
                              inputMode="decimal"
                              onChange={(e) => actualizar(pendiente, "precio", e.target.value)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => incorporar(pendiente)}
                            className={btn("secondary")}
                          >
                            <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
                            Incorporar a la cotización
                          </button>
                        </div>
                      )}

                      {pendiente.estado === "Pendiente de autorización" &&
                        (ampliacion ? (
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border border-accent-300 bg-accent-50 px-2 py-1.5">
                            <p className="text-[11px] text-accent-800">
                              Ampliación registrada por {formatMoney(ampliacion.importe)}. Pendiente
                              de autorización del cliente.
                            </p>
                            <button
                              type="button"
                              onClick={() => autorizar(ampliacion.id)}
                              className={btn("primary")}
                            >
                              <i
                                className="ri-check-double-line text-[13px] leading-none"
                                aria-hidden="true"
                              />
                              Registrar autorización del cliente
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 flex flex-wrap items-end gap-2">
                            <div className="w-[92px]">
                              <label
                                htmlFor={`cant-${pendiente.id}`}
                                className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                              >
                                Cantidad
                              </label>
                              <input
                                id={`cant-${pendiente.id}`}
                                className="admin-field text-right font-mono"
                                value={valor.cantidad}
                                inputMode="numeric"
                                onChange={(e) => actualizar(pendiente, "cantidad", e.target.value)}
                              />
                            </div>
                            <div className="w-[130px]">
                              <label
                                htmlFor={`precio-${pendiente.id}`}
                                className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                              >
                                Precio unit.
                              </label>
                              <input
                                id={`precio-${pendiente.id}`}
                                className="admin-field text-right font-mono"
                                value={valor.precio}
                                inputMode="decimal"
                                onChange={(e) => actualizar(pendiente, "precio", e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => ampliar(pendiente)}
                              className={btn("secondary")}
                            >
                              <i
                                className="ri-file-add-line text-[13px] leading-none"
                                aria-hidden="true"
                              />
                              Registrar ampliación
                            </button>
                          </div>
                        ))}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {ampliaciones.length > 0 && (
        <div className="border-t border-background-800 pt-2">
          <p className="text-[10px] uppercase tracking-[0.04em] text-foreground-500">
            Ampliaciones de la cotización aprobada
          </p>
          <ul className="mt-1 divide-y divide-background-700 border border-background-800">
            {ampliaciones.map((ampliacion) => (
              <li key={ampliacion.id} className="px-2 py-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-foreground-100">
                    {ampliacion.cantidad} × {ampliacion.descripcion} ·{" "}
                    <span className="font-mono">{formatMoney(ampliacion.importe)}</span>
                  </p>
                  <span
                    className={`border px-1.5 py-0.5 text-[10px] ${
                      ampliacion.autorizada
                        ? "border-primary-300 bg-primary-50 text-primary-800"
                        : "border-accent-300 bg-accent-50 text-accent-800"
                    }`}
                  >
                    {ampliacion.autorizada ? "Autorizada por el cliente" : "Pendiente de autorización"}
                  </span>
                </div>
                <p className="text-[10px] text-foreground-500">
                  {formatDate(ampliacion.fecha)} · {ampliacion.registradoPor}
                  {ampliacion.fechaAutorizacion
                    ? ` · autorizada el ${formatDate(ampliacion.fechaAutorizacion)}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {resultado && (
        <p
          className={`border px-2 py-1.5 text-[11px] ${
            resultado.ok
              ? "border-primary-200 bg-primary-50 text-primary-800"
              : "border-accent-300 bg-accent-50 text-accent-800"
          }`}
        >
          {resultado.mensaje}
        </p>
      )}
    </div>
  );
}
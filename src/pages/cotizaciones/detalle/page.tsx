import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import Field from "@/components/base/Field";
import StatusTag from "@/components/base/StatusTag";
import { btn } from "@/components/base/buttonStyles";
import { useCotizaciones, calcularTotales, guardarCotizacion, hoyISO } from "@/lib/cotizacionesStore";
import { cancelarOrdenPorRechazo, registrarAprobacionCotizacion } from "@/lib/ordenesStore";
import { useSesion } from "@/lib/sesionStore";
import { formatDate, formatMoney } from "@/lib/format";
import type { EstadoCotizacion } from "@/types/admin";

const ESTADOS: EstadoCotizacion[] = ["Pendiente", "Enviada al cliente", "Aprobada", "Rechazada"];

export default function CotizacionDetallePage() {
  const { id } = useParams();
  const cotizaciones = useCotizaciones();
  const sesion = useSesion();
  const esMecanico = sesion?.tipo === "Mecánico";
  const cotizacion = cotizaciones.find((item) => item.id === id);

  const [elementoId, setElementoId] = useState(
    cotizacion?.tipo === "Taller" ? "mano-obra" : cotizacion?.lineas[0]?.id || "",
  );
  const [campo, setCampo] = useState<"precio" | "cantidad">("precio");
  const [nuevoValor, setNuevoValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoCotizacion>(
    cotizacion?.estado ?? "Pendiente",
  );
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [errorEstado, setErrorEstado] = useState("");
  const [avisoEstado, setAvisoEstado] = useState("");

  if (!cotizacion) {
    return (
      <div>
        <PageHeader title="Cotización" subtitle="El registro solicitado no está disponible." />
        <Panel title="Cotización no encontrada">
          <p className="text-[13] text-foreground-300">
            No se encontró la cotización <span className="font-mono">{id}</span>.
          </p>
          <Link to="/cotizaciones" className={`${btn("primary")} mt-3`}>
            Volver al listado
          </Link>
        </Panel>
      </div>
    );
  }

  const totales = calcularTotales(cotizacion);

  const valorActualTexto = (() => {
    if (elementoId === "mano-obra") {
      return cotizacion.manoObraTipo === "Fijo"
        ? `${formatMoney(cotizacion.manoObraValor)} (monto fijo)`
        : `${formatMoney(cotizacion.manoObraValor)} por hora`;
    }
    const linea = cotizacion.lineas.find((item) => item.id === elementoId);
    if (!linea) return "—";
    return campo === "precio"
      ? `${formatMoney(linea.precioUnitario)} por unidad`
      : `${linea.cantidad} unidades`;
  })();

  const aplicarEstado = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorEstado("");
    setAvisoEstado("");

    if (estadoSeleccionado === cotizacion.estado) {
      setErrorEstado("Seleccione un estado distinto al actual para registrar el cambio.");
      return;
    }
    if (estadoSeleccionado === "Rechazada" && !motivoRechazo.trim()) {
      setErrorEstado("Indique el motivo del rechazo del presupuesto.");
      return;
    }

    guardarCotizacion({ ...cotizacion, estado: estadoSeleccionado });

    if (cotizacion.tipo === "Taller" && cotizacion.referencia) {
      if (estadoSeleccionado === "Aprobada") {
        registrarAprobacionCotizacion(cotizacion.referencia, cotizacion.id);
      }
      if (estadoSeleccionado === "Rechazada") {
        cancelarOrdenPorRechazo(
          cotizacion.referencia,
          cotizacion.id,
          motivoRechazo.trim(),
        );
      }
    }

    setMotivoRechazo("");
    setAvisoEstado(
      estadoSeleccionado === "Aprobada"
        ? "Aprobación registrada. La orden vinculada ya puede pasar a En reparación."
        : estadoSeleccionado === "Rechazada"
          ? "Rechazo registrado. La orden vinculada quedó en Servicio cancelado y el inventario no se descuenta."
          : `Estado actualizado a ${estadoSeleccionado}.`,
    );
  };

  const aplicarReajuste = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!elementoId) {
      setError("Seleccione el elemento que desea reajustar.");
      return;
    }
    const valor = Number(nuevoValor);
    if (!nuevoValor.trim() || Number.isNaN(valor) || valor < 0) {
      setError("Indique el nuevo valor del elemento seleccionado.");
      return;
    }
    if (!motivo.trim()) {
      setError("Registre el motivo del reajuste.");
      return;
    }

    if (elementoId === "mano-obra") {
      if (valor === cotizacion.manoObraValor) {
        setError("El nuevo valor es igual al actual.");
        return;
      }
      guardarCotizacion({
        ...cotizacion,
        manoObraValor: valor,
        reajustes: [
          {
            fecha: hoyISO(),
            elemento:
              cotizacion.manoObraTipo === "Fijo"
                ? "Mano de obra · monto fijo"
                : "Mano de obra · tarifa por hora",
            valorAnterior: formatMoney(cotizacion.manoObraValor),
            valorNuevo: formatMoney(valor),
            motivo: motivo.trim(),
          },
          ...cotizacion.reajustes,
        ],
      });
    } else {
      const linea = cotizacion.lineas.find((item) => item.id === elementoId);
      if (!linea) {
        setError("Seleccione un elemento válido.");
        return;
      }
      const actual = campo === "precio" ? linea.precioUnitario : linea.cantidad;
      if (valor === actual) {
        setError("El nuevo valor es igual al actual.");
        return;
      }
      const lineas = cotizacion.lineas.map((item) =>
        item.id === elementoId
          ? campo === "precio"
            ? { ...item, precioUnitario: valor }
            : { ...item, cantidad: valor }
          : item,
      );
      guardarCotizacion({
        ...cotizacion,
        lineas,
        reajustes: [
          {
            fecha: hoyISO(),
            elemento: `${linea.descripcion} · ${campo === "precio" ? "precio unitario" : "cantidad"}`,
            valorAnterior: campo === "precio" ? formatMoney(actual) : String(actual),
            valorNuevo: campo === "precio" ? formatMoney(valor) : String(valor),
            motivo: motivo.trim(),
          },
          ...cotizacion.reajustes,
        ],
      });
    }

    setNuevoValor("");
    setMotivo("");
    setError("");
    setAviso("Reajuste aplicado. El total estimado fue actualizado en esta misma cotización.");
  };

  return (
    <div>
      <PageHeader
        title={`Cotización ${cotizacion.id}`}
        subtitle={`${cotizacion.tipo} · ${cotizacion.cliente}`}
        actions={
          <>
            {cotizacion.tipo === "Taller" && (
              <Link to={`/taller/${cotizacion.referencia}`} className={btn("secondary")}>
                <i className="ri-clipboard-line text-[13px] leading-none" aria-hidden="true" />
                Ver orden {cotizacion.referencia}
              </Link>
            )}
            <Link to="/cotizaciones" className={btn("secondary")}>
              <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
              Volver al listado
            </Link>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Panel
            title="Datos de la cotización"
            actions={
              <div className="flex flex-col items-end gap-1">
                <StatusTag label={cotizacion.estado} />
                {esMecanico && (
                  <span className="text-[10px] text-foreground-500">Solo consulta</span>
                )}
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-[12px] sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-foreground-500">Número</p>
                <p className="font-mono text-foreground-50">{cotizacion.id}</p>
              </div>
              <div>
                <p className="text-foreground-500">Tipo</p>
                <p className="text-foreground-50">{cotizacion.tipo}</p>
              </div>
              <div>
                <p className="text-foreground-500">Fecha</p>
                <p className="font-mono text-foreground-50">{formatDate(cotizacion.fecha)}</p>
              </div>
              <div>
                <p className="text-foreground-500">Estado</p>
                <StatusTag label={cotizacion.estado} />
              </div>
              <div>
                <p className="text-foreground-500">Referencia</p>
                <p className="font-mono text-foreground-50">{cotizacion.referencia}</p>
              </div>
              <div>
                <p className="text-foreground-500">Cliente</p>
                <p className="text-foreground-50">{cotizacion.cliente}</p>
              </div>
              {cotizacion.tipo === "Taller" && (
                <>
                  <div>
                    <p className="text-foreground-500">Propietario</p>
                    <p className="text-foreground-50">{cotizacion.propietario || "—"}</p>
                  </div>
                  <div>
                    <p className="text-foreground-500">Motocicleta</p>
                    <p className="text-foreground-50">{cotizacion.motocicleta || "—"}</p>
                  </div>
                  <div>
                    <p className="text-foreground-500">Mecánico</p>
                    <p className="text-foreground-50">{cotizacion.mecanico || "—"}</p>
                  </div>
                </>
              )}
            </div>
          </Panel>

          <Panel title="Materiales y repuestos" flush>
            <div className="w-full overflow-x-auto">
              <table className="admin-table min-w-[620px]">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th className="text-right">Cantidad</th>
                    <th className="text-right">Precio unit.</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizacion.lineas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-foreground-500">
                        Esta cotización no tiene materiales registrados.
                      </td>
                    </tr>
                  )}
                  {cotizacion.lineas.map((linea) => (
                    <tr key={linea.id}>
                      <td className="whitespace-nowrap font-mono text-[12px] text-foreground-400">
                        {linea.codigo || "—"}
                      </td>
                      <td>{linea.descripcion}</td>
                      <td className="text-right font-mono">{linea.cantidad}</td>
                      <td className="whitespace-nowrap text-right font-mono">
                        {formatMoney(linea.precioUnitario)}
                      </td>
                      <td className="whitespace-nowrap text-right font-mono text-foreground-50">
                        {formatMoney(linea.cantidad * linea.precioUnitario)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Resumen de la cotización" flush>
            <dl className="divide-y divide-background-700 text-[12px]">
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <dt className="text-foreground-500">Materiales y repuestos (subtotal)</dt>
                <dd className="font-mono text-foreground-50">{formatMoney(totales.materiales)}</dd>
              </div>
              {cotizacion.tipo === "Taller" && (
                <>
                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <dt className="text-foreground-500">Tipo de mano de obra</dt>
                    <dd className="text-foreground-50">
                      {cotizacion.manoObraTipo === "Fijo" ? "Fija" : "Variable (por hora)"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <dt className="text-foreground-500">Precio actual de mano de obra</dt>
                    <dd className="font-mono text-foreground-50">
                      {formatMoney(cotizacion.manoObraValor)}
                      {cotizacion.manoObraTipo === "Variable" && (
                        <span className="ml-1 text-foreground-500">/ hora</span>
                      )}
                    </dd>
                  </div>
                  {cotizacion.manoObraTipo === "Variable" && (
                    <div className="flex items-center justify-between gap-3 px-3 py-2">
                      <dt className="text-foreground-500">Horas de trabajo</dt>
                      <dd className="font-mono text-foreground-50">
                        {cotizacion.manoObraHoras} h
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <dt className="text-foreground-500">Subtotal de mano de obra</dt>
                    <dd className="font-mono text-foreground-50">
                      {formatMoney(totales.manoObra)}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between gap-3 bg-background-100 px-3 py-2.5">
                <dt className="text-[13px] font-medium text-foreground-100">Total estimado</dt>
                <dd className="font-mono text-[15px] text-foreground-50">{formatMoney(totales.total)}</dd>
              </div>
            </dl>
            {cotizacion.observaciones && (
              <p className="border-t border-background-800 px-3 py-2 text-[12px] text-foreground-300">
                <span className="text-foreground-500">Observaciones: </span>
                {cotizacion.observaciones}
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-3">
          {!esMecanico && (
            <Panel
              title="Estado de la cotización"
              hint="Registro manual. Enviada al cliente no es aprobación."
            >
              <form onSubmit={aplicarEstado}>
                <div className="space-y-2">
                  <Field label="Estado" htmlFor="estado-cotizacion">
                    <select
                      id="estado-cotizacion"
                      className="admin-field"
                      value={estadoSeleccionado}
                      onChange={(e) => {
                        setEstadoSeleccionado(e.target.value as EstadoCotizacion);
                        setErrorEstado("");
                        setAvisoEstado("");
                      }}
                    >
                      {ESTADOS.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {estadoSeleccionado === "Rechazada" && (
                    <Field
                      label="Motivo del rechazo"
                      htmlFor="motivo-rechazo"
                      required
                      hint="La orden pasa a cancelada con este motivo."
                    >
                      <textarea
                        id="motivo-rechazo"
                        rows={2}
                        maxLength={250}
                        className="admin-field resize-y"
                        value={motivoRechazo}
                        onChange={(e) => {
                          setMotivoRechazo(e.target.value);
                          setErrorEstado("");
                        }}
                        placeholder="Ej. El cliente no acepta el costo de la mano de obra"
                      />
                    </Field>
                  )}
                </div>

                <button type="submit" className={`${btn("primary")} mt-2 w-full`}>
                  <i className="ri-check-line text-[13px] leading-none" aria-hidden="true" />
                  Registrar estado
                </button>

                {errorEstado && (
                  <p className="mt-2 border border-accent-300 bg-accent-50 px-2 py-1.5 text-[11px] text-accent-800">
                    {errorEstado}
                  </p>
                )}
                {avisoEstado && (
                  <p className="mt-2 border border-primary-200 bg-primary-50 px-2 py-1.5 text-[11px] text-primary-800">
                    {avisoEstado}
                  </p>
                )}
                <p className="mt-2 text-[11px] leading-relaxed text-foreground-500">
                  {cotizacion.tipo === "Taller"
                    ? "Solo Aprobada habilita el paso de la orden a En reparación. Rechazada cancela la orden vinculada sin descontar inventario."
                    : "Las cotizaciones de punto de venta no modifican órdenes de taller."}
                </p>
              </form>
            </Panel>
          )}

          {!esMecanico && (
            <Panel title="Reajustar precios" hint="Se conserva el mismo número de cotización.">
            <form onSubmit={aplicarReajuste}>
              <div className="space-y-2">
                <Field label="Elemento a modificar" htmlFor="reajuste-elemento">
                  <select
                    id="reajuste-elemento"
                    className="admin-field"
                    value={elementoId}
                    onChange={(e) => {
                      setElementoId(e.target.value);
                      setNuevoValor("");
                      setError("");
                      setAviso("");
                    }}
                  >
                    {cotizacion.tipo === "Taller" && (
                      <option value="mano-obra">Mano de obra</option>
                    )}
                    {cotizacion.lineas.map((linea) => (
                      <option key={linea.id} value={linea.id}>
                        {linea.descripcion}
                      </option>
                    ))}
                  </select>
                </Field>

                {elementoId !== "mano-obra" && (
                  <Field label="Campo a modificar" htmlFor="reajuste-campo">
                    <select
                      id="reajuste-campo"
                      className="admin-field"
                      value={campo}
                      onChange={(e) => {
                        setCampo(e.target.value as "precio" | "cantidad");
                        setNuevoValor("");
                      }}
                    >
                      <option value="precio">Precio unitario</option>
                      <option value="cantidad">Cantidad</option>
                    </select>
                  </Field>
                )}

                <div className="border border-background-800 bg-background-100 px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-[0.04em] text-foreground-500">
                    Valor anterior
                  </p>
                  <p className="font-mono text-[12px] text-foreground-50">{valorActualTexto}</p>
                </div>

                <Field label="Nuevo valor" htmlFor="reajuste-valor">
                  <input
                    id="reajuste-valor"
                    className="admin-field text-right font-mono"
                    value={nuevoValor}
                    inputMode="decimal"
                    onChange={(e) => setNuevoValor(e.target.value)}
                    placeholder="0.00"
                  />
                </Field>

                <Field label="Motivo del reajuste" htmlFor="reajuste-motivo" required>
                  <textarea
                    id="reajuste-motivo"
                    rows={2}
                    maxLength={250}
                    className="admin-field resize-y"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej. Aumento del proveedor o mayor cantidad de horas"
                  />
                </Field>
              </div>

              <button type="submit" className={`${btn("primary")} mt-2 w-full`}>
                <i className="ri-refresh-line text-[13px] leading-none" aria-hidden="true" />
                Aplicar reajuste
              </button>

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
            </form>
            </Panel>
          )}

          {esMecanico && (
            <p className="border border-background-800 bg-background-900 px-3 py-2 text-[11px] leading-relaxed text-foreground-500">
              Solo consulta: el mecánico puede revisar la cotización vinculada sin modificar
              importes.
            </p>
          )}

          <Panel
            title="Historial de reajustes"
            hint={`${cotizacion.reajustes.length} cambios registrados`}
            flush
          >
            <ul className="max-h-[420px] divide-y divide-background-700 overflow-y-auto">
              {cotizacion.reajustes.length === 0 && (
                <li className="px-3 py-4 text-center text-[12px] text-foreground-500">
                  La cotización no tiene reajustes.
                </li>
              )}
              {cotizacion.reajustes.map((reajuste, index) => (
                <li key={`${reajuste.fecha}-${index}`} className="px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-medium text-foreground-100">
                      {reajuste.elemento}
                    </p>
                    <span className="shrink-0 font-mono text-[11px] text-foreground-500">
                      {formatDate(reajuste.fecha)}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-foreground-300">
                    {reajuste.valorAnterior} → <span className="text-foreground-50">{reajuste.valorNuevo}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-foreground-500">{reajuste.motivo}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
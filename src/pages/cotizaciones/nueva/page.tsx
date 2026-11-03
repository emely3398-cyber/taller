import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import Field from "@/components/base/Field";
import { btn } from "@/components/base/buttonStyles";
import { useOrdenes } from "@/hooks/useOrdenes";
import { useProductos } from "@/lib/inventarioStore";
import { crearCotizacion, hoyISO, siguienteNumeroCotizacion, useCotizaciones } from "@/lib/cotizacionesStore";
import { marcarOrdenCotizada } from "@/lib/ordenesStore";
import { lineasDesdeOrden, materialesSolicitados, motocicletaDeOrden } from "@/lib/cotizacionOrden";
import { formatMoney } from "@/lib/format";
import type {
  Cotizacion,
  LineaCotizacion,
  ManoObraTipo,
  TipoCotizacion,
} from "@/types/admin";

let contador = 1000;

export default function NuevaCotizacionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const ordenes = useOrdenes();
  const productos = useProductos();
  const cotizaciones = useCotizaciones();

  const ordenParam = params.get("orden") || "";
  const [numeroCotizacion] = useState(() => siguienteNumeroCotizacion());
  const [tipo, setTipo] = useState<TipoCotizacion>(ordenParam ? "Taller" : "Punto de venta");
  const [ordenId, setOrdenId] = useState(ordenParam || "");
  const [fecha, setFecha] = useState(hoyISO());
  const [cliente, setCliente] = useState(() => {
    if (!ordenParam) return "";
    return ordenes.find((orden) => orden.id === ordenParam)?.propietario || "";
  });
  const [observaciones, setObservaciones] = useState("");
  const [lineas, setLineas] = useState<LineaCotizacion[]>(() => {
    if (!ordenParam) return [];
    return lineasDesdeOrden(
      ordenes.find((orden) => orden.id === ordenParam),
      productos,
    );
  });
  const [manoObraTipo, setManoObraTipo] = useState<ManoObraTipo>("Fijo");
  const [manoObraValor, setManoObraValor] = useState("0");
  const [manoObraHoras, setManoObraHoras] = useState("1");
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [error, setError] = useState("");

  const ordenActual = ordenes.find((orden) => orden.id === ordenId);
  const solicitados = materialesSolicitados(ordenActual);
  const importados = lineas.filter((linea) =>
    solicitados.some((material) => material.codigo === linea.codigo),
  ).length;

  const cotizacionExistente =
    tipo === "Taller" && ordenId
      ? cotizaciones.find(
          (item) =>
            item.tipo === "Taller" && item.referencia === ordenId && item.estado !== "Rechazada",
        )
      : undefined;

  const materiales = lineas.reduce((acc, linea) => acc + linea.cantidad * linea.precioUnitario, 0);
  const valorManoObra = Number(manoObraValor) || 0;
  const horas = Number(manoObraHoras) || 0;
  const totalManoObra =
    tipo === "Taller" ? (manoObraTipo === "Fijo" ? valorManoObra : valorManoObra * horas) : 0;
  const total = materiales + totalManoObra;

  const importarDesdeOrden = (nuevaOrdenId: string) => {
    const encontrada = ordenes.find((orden) => orden.id === nuevaOrdenId);
    setOrdenId(nuevaOrdenId);
    setCliente(encontrada?.propietario || "");
    setLineas(encontrada ? lineasDesdeOrden(encontrada, productos) : []);
    setError("");
  };

  const agregarDesdeInventario = () => {
    const producto = productos.find((item) => item.codigo === productoSeleccionado);
    if (!producto) {
      setError("Seleccione un repuesto del inventario para agregarlo.");
      return;
    }
    setLineas((prev) => {
      const existente = prev.find((linea) => linea.codigo === producto.codigo);
      if (existente) {
        return prev.map((linea) =>
          linea.codigo === producto.codigo
            ? { ...linea, cantidad: linea.cantidad + 1 }
            : linea,
        );
      }
      return [
        ...prev,
        {
          id: `L${contador++}`,
          codigo: producto.codigo,
          descripcion: producto.nombre,
          cantidad: 1,
          precioUnitario: tipo === "Punto de venta" ? producto.precioMayor : producto.precioMenor,
        },
      ];
    });
    setProductoSeleccionado("");
    setError("");
  };

  const actualizarLinea = (id: string, cambios: Partial<LineaCotizacion>) => {
    setLineas((prev) => prev.map((linea) => (linea.id === id ? { ...linea, ...cambios } : linea)));
  };

  const quitarLinea = (id: string) => {
    setLineas((prev) => prev.filter((linea) => linea.id !== id));
  };

  const guardar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lineasValidas = lineas.filter(
      (linea) => linea.descripcion.trim() && linea.cantidad > 0 && linea.precioUnitario >= 0,
    );
    if (tipo === "Taller" && !ordenId) {
      setError("Seleccione la hoja de servicio vinculada.");
      return;
    }
    if (cotizacionExistente) {
      setError(
        `La orden ${ordenId} ya tiene la cotización ${cotizacionExistente.id}. Ábrala en lugar de crear otra.`,
      );
      return;
    }
    if (!cliente.trim()) {
      setError("Indique el cliente de la cotización.");
      return;
    }
    if (lineasValidas.length === 0 && totalManoObra <= 0) {
      setError("Registre al menos un material del inventario o un monto de mano de obra.");
      return;
    }

    const cotizacion: Cotizacion = {
      id: siguienteNumeroCotizacion(),
      tipo,
      referencia: tipo === "Taller" ? ordenId : "Venta mostrador",
      cliente: cliente.trim(),
      propietario: tipo === "Taller" && ordenActual ? ordenActual.propietario : "",
      motocicleta: tipo === "Taller" ? motocicletaDeOrden(ordenActual) : "",
      mecanico: tipo === "Taller" && ordenActual ? ordenActual.mecanico : "",
      fecha,
      lineas: lineasValidas,
      manoObraTipo,
      manoObraValor: tipo === "Taller" ? valorManoObra : 0,
      manoObraHoras: tipo === "Taller" && manoObraTipo === "Variable" ? horas : 0,
      observaciones: observaciones.trim(),
      estado: "Pendiente",
      reajustes: [],
    };

    crearCotizacion(cotizacion);
    if (cotizacion.tipo === "Taller" && ordenId) {
      marcarOrdenCotizada(ordenId, cotizacion.id);
    }
    navigate(`/cotizaciones/${cotizacion.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Nueva cotización"
        subtitle="Cotización de taller vinculada a una orden de servicio o cotización de mostrador."
        actions={
          <Link to="/cotizaciones" className={btn("secondary")}>
            <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
            Volver al listado
          </Link>
        }
      />

      <form onSubmit={guardar} noValidate>
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <Panel title="Datos generales">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Número de cotización"
                  htmlFor="cot-numero"
                  hint="Se conserva aunque se apliquen reajustes de precio."
                >
                  <input
                    id="cot-numero"
                    className="admin-field font-mono"
                    value={numeroCotizacion}
                    readOnly
                  />
                </Field>
                <Field
                  label="Tipo de cotización"
                  htmlFor="cot-tipo"
                  hint={
                    tipo === "Taller"
                      ? "Se vincula a una hoja de servicio y admite mano de obra."
                      : "Sin hoja de servicio, sin datos de motocicleta ni mano de obra."
                  }
                  required
                >
                  <select
                    id="cot-tipo"
                    className="admin-field"
                    value={tipo}
                    onChange={(e) => {
                      const valor = e.target.value as TipoCotizacion;
                      setTipo(valor);
                      setError("");
                      setOrdenId("");
                      setCliente("");
                      setLineas([]);
                      setManoObraValor("0");
                    }}
                  >
                    <option value="Taller">Cotización de taller</option>
                    <option value="Punto de venta">Cotización de punto de venta</option>
                  </select>
                </Field>

                <Field label="Fecha" htmlFor="cot-fecha" required>
                  <input
                    id="cot-fecha"
                    type="date"
                    className="admin-field"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </Field>

                {tipo === "Taller" ? (
                  <Field label="Orden de servicio vinculada" htmlFor="cot-orden" required>
                    <select
                      id="cot-orden"
                      className="admin-field"
                      value={ordenId}
                      onChange={(e) => importarDesdeOrden(e.target.value)}
                    >
                      <option value="">Seleccione una orden</option>
                      {ordenes.map((orden) => (
                        <option key={orden.id} value={orden.id}>
                          {orden.id} · {orden.propietario} · {orden.placa}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : (
                  <Field
                    label="Referencia"
                    htmlFor="cot-referencia"
                  >
                    <input
                      id="cot-referencia"
                      className="admin-field"
                      value="Venta mostrador"
                      readOnly
                    />
                  </Field>
                )}

                <Field label="Cliente" htmlFor="cot-cliente" required>
                  <input
                    id="cot-cliente"
                    className="admin-field"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </Field>
              </div>

              {tipo === "Taller" && ordenActual && (
                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-background-800 pt-2.5 text-[12px] sm:grid-cols-3">
                  <div>
                    <p className="text-foreground-500">Propietario</p>
                    <p className="text-foreground-50">{ordenActual.propietario}</p>
                  </div>
                  <div>
                    <p className="text-foreground-500">Motocicleta</p>
                    <p className="text-foreground-50">{motocicletaDeOrden(ordenActual)}</p>
                  </div>
                  <div>
                    <p className="text-foreground-500">Mecánico asignado</p>
                    <p className="text-foreground-50">{ordenActual.mecanico}</p>
                  </div>
                </div>
              )}
              {tipo === "Taller" && !ordenActual && (
                <p className="mt-2 border border-accent-300 bg-accent-50 px-2 py-1.5 text-[11px] text-accent-800">
                  Seleccione una orden de servicio para completar los datos del propietario y la
                  motocicleta.
                </p>
              )}

              {cotizacionExistente && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border border-primary-200 bg-primary-50 px-2.5 py-2">
                  <p className="text-[11px] text-primary-800">
                    La orden {ordenId} ya tiene la cotización{" "}
                    <span className="font-mono">{cotizacionExistente.id}</span>. Puede reajustarla
                    en lugar de crear una nueva.
                  </p>
                  <Link
                    to={`/cotizaciones/${cotizacionExistente.id}`}
                    className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap border border-primary-300 bg-background-50 px-2 py-1 text-[11px] text-primary-700 hover:bg-background-100"
                  >
                    <i className="ri-file-text-line text-[12px] leading-none" aria-hidden="true" />
                    Abrir cotización
                  </Link>
                </div>
              )}
            </Panel>

            <Panel
              title="Materiales y repuestos"
              hint="Los precios se pueden cambiar después."
              flush
            >
              <div className="flex flex-col gap-2 border-b border-background-800 px-3 py-2.5 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="cot-producto"
                    className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                  >
                    Agregar producto del inventario
                  </label>
                  <select
                    id="cot-producto"
                    className="admin-field"
                    value={productoSeleccionado}
                    onChange={(e) => setProductoSeleccionado(e.target.value)}
                  >
                    <option value="">Seleccione un repuesto o producto</option>
                    {productos.map((producto) => (
                      <option key={producto.codigo} value={producto.codigo}>
                        {producto.codigo} · {producto.nombre} · {formatMoney(producto.precioMenor)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={agregarDesdeInventario}
                  className={`${btn("secondary")} whitespace-nowrap`}
                >
                  <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
                  Agregar del inventario
                </button>
              </div>

              {tipo === "Taller" && ordenActual && (
                <p
                  className={`border-b border-background-800 px-3 py-2 text-[11px] ${
                    solicitados.length === 0
                      ? "bg-accent-50 text-accent-800"
                      : "bg-background-100 text-foreground-400"
                  }`}
                >
                  {solicitados.length === 0
                    ? `La orden ${ordenActual.id} todavía no tiene materiales solicitados por el mecánico. Agregue repuestos del inventario si necesita cotizar alguno.`
                    : `${importados} ${importados === 1 ? "repuesto importado" : "repuestos importados"} desde la orden ${ordenActual.id}, con cantidades y precios del inventario compartido.`}
                </p>
              )}

              <div className="w-full overflow-x-auto">
                <table className="admin-table min-w-[760px]">
                  <thead>
                    <tr>
                      <th className="w-[110px]">Código</th>
                      <th>Descripción</th>
                      <th className="w-[100px] text-right">Cantidad</th>
                      <th className="w-[140px] text-right">Precio unit.</th>
                      <th className="w-[120px] text-right">Subtotal</th>
                      <th className="w-[56px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-foreground-500">
                          Agregue repuestos del inventario a la cotización.
                        </td>
                      </tr>
                    )}
                    {lineas.map((linea) => (
                      <tr key={linea.id}>
                        <td className="whitespace-nowrap font-mono text-[12px] text-foreground-100">
                          {linea.codigo || "—"}
                        </td>
                        <td className="text-foreground-100">{linea.descripcion}</td>
                        <td>
                          <input
                            aria-label="Cantidad"
                            className="admin-field text-right font-mono"
                            value={linea.cantidad}
                            inputMode="numeric"
                            onChange={(e) =>
                              actualizarLinea(linea.id, { cantidad: Number(e.target.value) || 0 })
                            }
                          />
                        </td>
                        <td>
                          <input
                            aria-label="Precio unitario"
                            className="admin-field text-right font-mono"
                            value={linea.precioUnitario}
                            inputMode="decimal"
                            onChange={(e) =>
                              actualizarLinea(linea.id, {
                                precioUnitario: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </td>
                        <td className="text-right font-mono text-foreground-50">
                          {formatMoney(linea.cantidad * linea.precioUnitario)}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => quitarLinea(linea.id)}
                            aria-label="Quitar material"
                            className="flex h-6 w-6 cursor-pointer items-center justify-center border border-background-800 text-foreground-400 hover:bg-background-200 hover:text-accent-700"
                          >
                            <i className="ri-close-line text-[13px] leading-none" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {tipo === "Taller" && (
              <Panel title="Mano de obra" hint="Se calcula con precio fijo o tarifa por hora.">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Tipo de precio" htmlFor="mano-obra-tipo">
                    <select
                      id="mano-obra-tipo"
                      className="admin-field"
                      value={manoObraTipo}
                      onChange={(e) => setManoObraTipo(e.target.value as ManoObraTipo)}
                    >
                      <option value="Fijo">Precio fijo</option>
                      <option value="Variable">Variable (tarifa × horas)</option>
                    </select>
                  </Field>
                  <Field
                    label={manoObraTipo === "Fijo" ? "Monto de mano de obra" : "Tarifa por hora"}
                    htmlFor="mano-obra-valor"
                  >
                    <input
                      id="mano-obra-valor"
                      className="admin-field text-right font-mono"
                      value={manoObraValor}
                      inputMode="decimal"
                      onChange={(e) => setManoObraValor(e.target.value)}
                    />
                  </Field>
                  <Field label="Horas de trabajo" htmlFor="mano-obra-horas">
                    <input
                      id="mano-obra-horas"
                      className="admin-field text-right font-mono"
                      value={manoObraHoras}
                      inputMode="decimal"
                      disabled={manoObraTipo === "Fijo"}
                      onChange={(e) => setManoObraHoras(e.target.value)}
                    />
                  </Field>
                </div>
                <p className="mt-2 text-[11px] text-foreground-500">
                  Subtotal de mano de obra calculado: {formatMoney(totalManoObra)}
                </p>
              </Panel>
            )}

            <Panel title="Observaciones">
              <Field label="Observaciones de la cotización" htmlFor="cot-observaciones">
                <textarea
                  id="cot-observaciones"
                  rows={2}
                  maxLength={500}
                  className="admin-field resize-y"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Vigencia o condiciones de pago"
                />
              </Field>
            </Panel>
          </div>

          <div>
            <Panel title="Resumen" className="lg:sticky lg:top-16">
              <dl className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-foreground-500">Tipo</dt>
                  <dd className="text-foreground-50">{tipo}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-foreground-500">Referencia</dt>
                  <dd className="font-mono text-foreground-50">
                    {tipo === "Taller" ? ordenId || "Sin orden" : "Mostrador"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-foreground-500">Materiales</dt>
                  <dd className="font-mono text-foreground-50">{lineas.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-background-800 pt-2">
                  <dt className="text-foreground-500">Subtotal de materiales</dt>
                  <dd className="font-mono text-foreground-50">{formatMoney(materiales)}</dd>
                </div>
                {tipo === "Taller" && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-foreground-500">Subtotal de mano de obra</dt>
                    <dd className="font-mono text-foreground-50">{formatMoney(totalManoObra)}</dd>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between gap-3 border-t border-background-800 pt-2">
                  <dt className="text-foreground-100">Total estimado</dt>
                  <dd className="font-mono text-[15px] text-foreground-50">{formatMoney(total)}</dd>
                </div>
              </dl>

              {error && (
                <p className="mt-3 border border-accent-300 bg-accent-50 px-2 py-1.5 text-[11px] text-accent-800">
                  {error}
                </p>
              )}

              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="submit"
                  className={`${btn("primary")} w-full`}
                  disabled={Boolean(cotizacionExistente)}
                >
                  <i className="ri-save-line text-[13px] leading-none" aria-hidden="true" />
                  Guardar cotización
                </button>
                <Link to="/cotizaciones" className={`${btn("secondary")} w-full`}>
                  Cancelar
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      </form>
    </div>
  );
}
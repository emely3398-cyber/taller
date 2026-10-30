import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import StatusTag from "@/components/base/StatusTag";
import Field from "@/components/base/Field";
import { btn } from "@/components/base/buttonStyles";
import { useProductos, useMovimientos, registrarEntrada, hoyISO } from "@/lib/inventarioStore";
import { useProveedores } from "@/lib/proveedoresStore";
import { formatDate } from "@/lib/format";

export default function MovimientosPage() {
  const productos = useProductos();
  const movimientos = useMovimientos();
  const proveedores = useProveedores();

  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [proveedorId, setProveedorId] = useState("");
  const [referencia, setReferencia] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const producto = productos.find((item) => item.codigo === codigo);
  const nombreProveedor = (id?: string) =>
    proveedores.find((proveedor) => proveedor.id === id)?.nombre || "—";

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return movimientos.filter((movimiento) => {
      const coincideTipo = tipoFiltro === "todos" || movimiento.tipo === tipoFiltro;
      const coincideTexto =
        !texto ||
        [movimiento.codigo, movimiento.nombre, movimiento.referencia, movimiento.motivo]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      return coincideTipo && coincideTexto;
    });
  }, [movimientos, tipoFiltro, busqueda]);

  const registrar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAviso("");
    if (!producto) {
      setError("Seleccione el producto comprado.");
      return;
    }
    const cantidadNumero = Number(cantidad);
    if (!cantidadNumero || cantidadNumero <= 0) {
      setError("Indique una cantidad mayor a cero.");
      return;
    }
    registrarEntrada({
      codigo: producto.codigo,
      cantidad: cantidadNumero,
      proveedorId: proveedorId || producto.proveedorId,
      referencia: referencia.trim() || "Compra sin comprobante",
      fecha,
    });
    setError("");
    setAviso(
      `Entrada registrada: ${cantidadNumero} × ${producto.nombre}. La existencia fue aumentada en el inventario compartido.`,
    );
    setCodigo("");
    setCantidad("1");
    setProveedorId("");
    setReferencia("");
  };

  return (
    <div>
      <PageHeader
        title="Entradas y salidas"
        subtitle="Movimientos del inventario compartido entre el taller y el punto de venta."
        actions={
          <Link to="/inventario" className={btn("secondary")}>
            <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
            Volver al inventario
          </Link>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Panel
            title="Registrar entrada"
            hint="Compra de un repuesto que ingresa al inventario."
          >
            <form onSubmit={registrar}>
              <div className="space-y-2">
                <Field label="Producto comprado" htmlFor="ent-producto" required>
                  <select
                    id="ent-producto"
                    className="admin-field"
                    value={codigo}
                    onChange={(e) => {
                      setCodigo(e.target.value);
                      const encontrado = productos.find((item) => item.codigo === e.target.value);
                      setProveedorId(encontrado?.proveedorId || "");
                      setError("");
                      setAviso("");
                    }}
                  >
                    <option value="">Seleccione un producto</option>
                    {productos.map((item) => (
                      <option key={item.codigo} value={item.codigo}>
                        {item.codigo} · {item.nombre}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Cantidad" htmlFor="ent-cantidad" required>
                    <input
                      id="ent-cantidad"
                      className="admin-field text-right font-mono"
                      value={cantidad}
                      inputMode="numeric"
                      onChange={(e) => setCantidad(e.target.value)}
                    />
                  </Field>
                  <Field label="Fecha" htmlFor="ent-fecha">
                    <input
                      id="ent-fecha"
                      type="date"
                      className="admin-field"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                    />
                  </Field>
                </div>

                <Field label="Proveedor" htmlFor="ent-proveedor">
                  <select
                    id="ent-proveedor"
                    className="admin-field"
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Referencia o comprobante"
                  htmlFor="ent-referencia"
                  hint="Factura, guía de remisión o nota de compra."
                >
                  <input
                    id="ent-referencia"
                    className="admin-field"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Factura 004-1182"
                  />
                </Field>

                {producto && (
                  <p className="text-[11px] text-foreground-500">
                    Existencia actual {producto.existencia} · proveedor habitual{" "}
                    {nombreProveedor(producto.proveedorId)}
                  </p>
                )}
              </div>

              <button type="submit" className={`${btn("primary")} mt-2.5 w-full`}>
                <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
                Registrar entrada
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

            <div className="mt-3 border-t border-background-800 pt-2 text-[11px] leading-relaxed text-foreground-500">
              <p className="font-medium text-foreground-300">Salidas del inventario</p>
              <p className="mt-1">
                Las salidas se generan al registrar una venta en el punto de venta o al despachar un
                repuesto desde la orden de servicio del taller.
              </p>
              <Link
                to="/punto-venta"
                className="mt-1 inline-flex cursor-pointer items-center gap-1 text-primary-600 hover:text-primary-800"
              >
                Ir al punto de venta
                <i className="ri-arrow-right-line text-[11px] leading-none" aria-hidden="true" />
              </Link>
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel
            title="Movimientos registrados"
            hint={`${filtrados.length} movimientos visibles`}
            flush
          >
            <div className="flex flex-col gap-2 border-b border-background-800 px-3 py-2.5 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="mov-buscar"
                  className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                >
                  Buscar movimiento
                </label>
                <input
                  id="mov-buscar"
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Código, producto o referencia"
                  className="admin-field"
                />
              </div>
              <div className="sm:w-[150px]">
                <label
                  htmlFor="mov-tipo"
                  className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                >
                  Tipo
                </label>
                <select
                  id="mov-tipo"
                  className="admin-field"
                  value={tipoFiltro}
                  onChange={(e) => setTipoFiltro(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="Entrada">Entradas</option>
                  <option value="Salida">Salidas</option>
                </select>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="admin-table min-w-[860px]">
                <thead>
                  <tr>
                    <th>Movimiento</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Producto</th>
                    <th className="text-right">Cantidad</th>
                    <th>Motivo</th>
                    <th>Referencia</th>
                    <th>Proveedor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((movimiento) => (
                    <tr key={movimiento.id}>
                      <td className="whitespace-nowrap font-mono text-foreground-50">
                        {movimiento.id}
                      </td>
                      <td className="whitespace-nowrap font-mono text-[12px]">
                        {formatDate(movimiento.fecha)}
                      </td>
                      <td>
                        <StatusTag label={movimiento.tipo} />
                      </td>
                      <td className="min-w-[200px]">
                        <p className="text-foreground-50">{movimiento.nombre}</p>
                        <p className="font-mono text-[11px] text-foreground-500">
                          {movimiento.codigo}
                        </p>
                      </td>
                      <td className="text-right font-mono">
                        {movimiento.tipo === "Entrada" ? "+" : "−"}
                        {movimiento.cantidad}
                      </td>
                      <td className="whitespace-nowrap text-[12px]">{movimiento.motivo}</td>
                      <td className="whitespace-nowrap font-mono text-[12px] text-foreground-400">
                        {movimiento.referencia || "—"}
                      </td>
                      <td className="whitespace-nowrap text-[12px]">
                        {movimiento.proveedorId ? nombreProveedor(movimiento.proveedorId) : "—"}
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-[12px] text-foreground-500">
                        No hay movimientos que coincidan con el filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
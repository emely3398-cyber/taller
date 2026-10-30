import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import { btn } from "@/components/base/buttonStyles";
import { useProductos } from "@/lib/inventarioStore";
import { registrarVenta } from "@/lib/ventasStore";
import { formatMoney, compatibilidadTexto } from "@/lib/format";
import type { Venta, VentaLinea } from "@/types/admin";

export default function PuntoVentaPage() {
  const productos = useProductos();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [tipoPrecio, setTipoPrecio] = useState<"Menor" | "Mayor">("Menor");
  const [lineas, setLineas] = useState<VentaLinea[]>([]);
  const [cliente, setCliente] = useState("");
  const [medioPago, setMedioPago] = useState<Venta["medioPago"]>("Efectivo");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const categorias = useMemo(() => Array.from(new Set(productos.map((p) => p.categoria))), [productos]);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideTexto =
        !texto ||
        [producto.codigo, producto.codigoBarras, producto.nombre, producto.marca]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      const coincideCategoria = categoria === "todas" || producto.categoria === categoria;
      return coincideTexto && coincideCategoria;
    });
  }, [productos, busqueda, categoria]);

  const total = lineas.reduce((acc, linea) => acc + linea.cantidad * linea.precio, 0);
  const unidades = lineas.reduce((acc, linea) => acc + linea.cantidad, 0);

  const enCarrito = (codigo: string) =>
    lineas.find((linea) => linea.codigo === codigo)?.cantidad || 0;

  const agregar = (codigo: string) => {
    const producto = productos.find((item) => item.codigo === codigo);
    if (!producto) return;
    const disponible = producto.existencia - enCarrito(codigo);
    if (disponible <= 0) {
      setError(`Sin existencias disponibles de ${producto.nombre}.`);
      return;
    }
    setError("");
    setMensaje("");
    setLineas((prev) => {
      const existente = prev.find((linea) => linea.codigo === codigo);
      if (existente) {
        return prev.map((linea) =>
          linea.codigo === codigo ? { ...linea, cantidad: linea.cantidad + 1 } : linea,
        );
      }
      return [
        ...prev,
        {
          codigo: producto.codigo,
          nombre: producto.nombre,
          cantidad: 1,
          precio: tipoPrecio === "Menor" ? producto.precioMenor : producto.precioMayor,
          tipoPrecio,
        },
      ];
    });
  };

  const cambiarCantidad = (codigo: string, delta: number) => {
    const producto = productos.find((item) => item.codigo === codigo);
    if (!producto) return;
    setLineas((prev) =>
      prev
        .map((linea) => {
          if (linea.codigo !== codigo) return linea;
          const nueva = Math.min(Math.max(linea.cantidad + delta, 0), producto.existencia);
          return { ...linea, cantidad: nueva };
        })
        .filter((linea) => linea.cantidad > 0),
    );
    setError("");
  };

  const cambiarTipoPrecio = (nuevo: "Menor" | "Mayor") => {
    setTipoPrecio(nuevo);
    setLineas((prev) =>
      prev.map((linea) => {
        const producto = productos.find((item) => item.codigo === linea.codigo);
        if (!producto) return linea;
        return {
          ...linea,
          tipoPrecio: nuevo,
          precio: nuevo === "Menor" ? producto.precioMenor : producto.precioMayor,
        };
      }),
    );
  };

  const confirmarVenta = () => {
    if (lineas.length === 0) {
      setError("Agregue al menos un producto para registrar la venta.");
      return;
    }
    const resultado = registrarVenta({ cliente, medioPago, lineas });
    if (!resultado.ok) {
      setError(resultado.mensaje);
      return;
    }
    setLineas([]);
    setCliente("");
    setError("");
    setMensaje(
      `Venta ${resultado.venta.id} registrada por ${formatMoney(resultado.venta.total)}. Se descontaron ${resultado.venta.lineas.reduce(
        (acc, linea) => acc + linea.cantidad,
        0,
      )} unidades del inventario compartido.`,
    );
  };

  return (
    <div>
      <PageHeader
        title="Punto de venta"
        subtitle="Registrar ventas de repuestos y productos con descuento automático de existencias."
        actions={
          <>
            <span className="hidden border border-background-800 bg-background-100 px-2 py-1 text-[11px] text-foreground-400 sm:inline-flex">
              Caja: mostrador principal
            </span>
            <Link to="/punto-venta/historial" className={btn("secondary")}>
              <i className="ri-file-list-3-line text-[13px] leading-none" aria-hidden="true" />
              Historial de ventas
            </Link>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Productos disponibles" hint={`${visibles.length} productos en el catálogo`} flush>
            <div className="flex flex-col gap-2 border-b border-background-800 px-3 py-2.5 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="pos-buscar"
                  className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                >
                  Buscar por nombre, código o código de barras
                </label>
                <input
                  id="pos-buscar"
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Ej. REP-1001, 7754123001001 o aceite"
                  className="admin-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
                <div>
                  <label
                    htmlFor="pos-categoria"
                    className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                  >
                    Categoría
                  </label>
                  <select
                    id="pos-categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="admin-field sm:w-[160px]"
                  >
                    <option value="todas">Todas</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500">
                    Precio
                  </span>
                  <div className="inline-flex items-center gap-1 border border-background-800 bg-background-100 p-1">
                    {(["Menor", "Mayor"] as const).map((opcion) => (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => cambiarTipoPrecio(opcion)}
                        className={`cursor-pointer whitespace-nowrap rounded-[2px] px-2 py-0.5 text-[11px] ${
                          tipoPrecio === opcion
                            ? "bg-primary-500 text-white"
                            : "text-foreground-400 hover:bg-background-200 hover:text-foreground-100"
                        }`}
                      >
                        {opcion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[440px] w-full overflow-auto">
              <table className="admin-table min-w-[680px]">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th className="text-right">Existencia</th>
                    <th className="text-right">Menor</th>
                    <th className="text-right">Mayor</th>
                    <th className="text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((producto) => {
                    const disponible = producto.existencia - enCarrito(producto.codigo);
                    return (
                      <tr key={producto.codigo}>
                        <td className="whitespace-nowrap font-mono text-foreground-50">
                          {producto.codigo}
                        </td>
                        <td>
                          <p className="text-foreground-50">{producto.nombre}</p>
                          <p className="text-[11px] text-foreground-500">
                            {producto.marca} · {compatibilidadTexto(producto)}
                          </p>
                        </td>
                        <td
                          className={`whitespace-nowrap text-right font-mono ${
                            disponible <= 0 ? "text-accent-700" : "text-foreground-200"
                          }`}
                        >
                          {disponible}
                        </td>
                        <td className="whitespace-nowrap text-right font-mono">
                          {formatMoney(producto.precioMenor)}
                        </td>
                        <td className="whitespace-nowrap text-right font-mono text-foreground-400">
                          {formatMoney(producto.precioMayor)}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => agregar(producto.codigo)}
                            disabled={disponible <= 0}
                            className={`inline-flex items-center gap-1 whitespace-nowrap border px-2 py-1 text-[11px] ${
                              disponible <= 0
                                ? "cursor-not-allowed border-background-800 bg-background-100 text-foreground-600"
                                : "cursor-pointer border-background-800 text-foreground-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                            }`}
                          >
                            <i className="ri-add-line text-[12px] leading-none" aria-hidden="true" />
                            Agregar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {visibles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-[12px] text-foreground-500">
                        No se encontraron productos con ese criterio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Venta actual" hint={`${unidades} unidades en la venta`}>
            <div className="space-y-2">
              <div>
                <label
                  htmlFor="pos-cliente"
                  className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                >
                  Cliente
                </label>
                <input
                  id="pos-cliente"
                  className="admin-field"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Cliente mostrador"
                />
              </div>

              <div className="border border-background-800">
                {lineas.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[11px] text-foreground-500">
                    Agregue productos desde el catálogo para iniciar la venta.
                  </p>
                ) : (
                  <ul className="divide-y divide-background-700">
                    {lineas.map((linea) => (
                      <li key={linea.codigo} className="px-2.5 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[12px] text-foreground-50">{linea.nombre}</p>
                            <p className="font-mono text-[10px] text-foreground-500">
                              {linea.codigo} · {formatMoney(linea.precio)} · precio {linea.tipoPrecio}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setLineas((prev) => prev.filter((item) => item.codigo !== linea.codigo))
                            }
                            aria-label={`Quitar ${linea.nombre}`}
                            className="flex h-5 w-5 cursor-pointer items-center justify-center border border-background-800 text-foreground-400 hover:bg-background-200 hover:text-accent-700"
                          >
                            <i className="ri-close-line text-[11px] leading-none" aria-hidden="true" />
                          </button>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center border border-background-800">
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(linea.codigo, -1)}
                              aria-label="Disminuir cantidad"
                              className="flex h-6 w-6 cursor-pointer items-center justify-center text-foreground-300 hover:bg-background-200"
                            >
                              <i className="ri-subtract-line text-[11px] leading-none" aria-hidden="true" />
                            </button>
                            <span className="w-8 text-center font-mono text-[12px] text-foreground-50">
                              {linea.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => cambiarCantidad(linea.codigo, 1)}
                              aria-label="Aumentar cantidad"
                              className="flex h-6 w-6 cursor-pointer items-center justify-center text-foreground-300 hover:bg-background-200"
                            >
                              <i className="ri-add-line text-[11px] leading-none" aria-hidden="true" />
                            </button>
                          </div>
                          <span className="font-mono text-[12px] text-foreground-50">
                            {formatMoney(linea.cantidad * linea.precio)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label
                  htmlFor="pos-pago"
                  className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                >
                  Medio de pago
                </label>
                <select
                  id="pos-pago"
                  className="admin-field"
                  value={medioPago}
                  onChange={(e) => setMedioPago(e.target.value as Venta["medioPago"])}
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-background-800 pt-2">
                <span className="text-[12px] text-foreground-400">Total general</span>
                <span className="font-mono text-[17px] text-foreground-50">{formatMoney(total)}</span>
              </div>

              {error && (
                <p className="border border-accent-300 bg-accent-50 px-2 py-1.5 text-[11px] text-accent-800">
                  {error}
                </p>
              )}
              {mensaje && (
                <p className="border border-primary-200 bg-primary-50 px-2 py-1.5 text-[11px] text-primary-800">
                  {mensaje}
                </p>
              )}

              <button type="button" onClick={confirmarVenta} className={`${btn("primary")} w-full`}>
                <i className="ri-check-line text-[13px] leading-none" aria-hidden="true" />
                Registrar venta
              </button>
              <button
                type="button"
                onClick={() => {
                  setLineas([]);
                  setCliente("");
                  setError("");
                  setMensaje("");
                }}
                className={`${btn("secondary")} w-full`}
              >
                Limpiar venta
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
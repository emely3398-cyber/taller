import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import StatusTag from "@/components/base/StatusTag";
import { btn } from "@/components/base/buttonStyles";
import { useProductos, useMovimientos } from "@/lib/inventarioStore";
import { useProveedores } from "@/lib/proveedoresStore";
import { formatMoney, compatibilidadTexto, stockEstado } from "@/lib/format";
import { fotosDeProducto, type FotoVista } from "@/lib/imagenes";
import PhotoThumb from "@/components/base/PhotoThumb";
import PhotoViewer from "@/components/base/PhotoViewer";

export default function InventarioPage() {
  const productos = useProductos();
  const movimientos = useMovimientos();
  const proveedores = useProveedores();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [marca, setMarca] = useState("todas");
  const [soloBajo, setSoloBajo] = useState(false);
  const [visor, setVisor] = useState<{ fotos: FotoVista[]; indice: number; titulo: string } | null>(null);

  const categorias = useMemo(() => Array.from(new Set(productos.map((p) => p.categoria))), [productos]);
  const marcas = useMemo(() => Array.from(new Set(productos.map((p) => p.marca))), [productos]);

  const nombreProveedor = (id: string) =>
    proveedores.find((proveedor) => proveedor.id === id)?.nombre || "Sin proveedor";

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideTexto =
        !texto ||
        [producto.codigo, producto.codigoBarras, producto.nombre, producto.modeloMoto]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      const coincideCategoria = categoria === "todas" || producto.categoria === categoria;
      const coincideMarca = marca === "todas" || producto.marca === marca;
      const coincideStock =
        !soloBajo || producto.existencia === 0 || producto.existencia <= producto.stockMinimo;
      return coincideTexto && coincideCategoria && coincideMarca && coincideStock;
    });
  }, [productos, busqueda, categoria, marca, soloBajo]);

  const sinStock = productos.filter((p) => p.existencia === 0).length;
  const bajoMinimo = productos.filter((p) => p.existencia > 0 && p.existencia <= p.stockMinimo).length;

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle="Inventario único compartido por el taller y el punto de venta."
        actions={
          <>
            <Link to="/inventario/movimientos" className={btn("secondary")}>
              <i className="ri-exchange-line text-[13px] leading-none" aria-hidden="true" />
              Entradas y salidas
            </Link>
            <Link to="/inventario/nuevo" className={btn("primary")}>
              <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
              Registrar producto
            </Link>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2 text-[11px] text-foreground-400">
        <span className="border border-background-800 bg-background-900 px-2 py-1">
          {productos.length} productos registrados
        </span>
        <span className="border border-background-800 bg-background-900 px-2 py-1">
          {bajoMinimo} con stock bajo
        </span>
        <span className="border border-background-800 bg-background-900 px-2 py-1">
          {sinStock} sin stock
        </span>
        <span className="border border-background-800 bg-background-900 px-2 py-1">
          {movimientos.length} movimientos registrados
        </span>
      </div>

      <Panel title="Productos y repuestos" hint={`${filtrados.length} registros visibles`} flush>
        <div className="border-b border-background-800 px-3 py-2.5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="inv-buscar"
                className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
              >
                Buscar
              </label>
              <input
                id="inv-buscar"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Código, producto o moto"
                className="admin-field"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
              <div className="min-w-0">
                <label
                  htmlFor="inv-categoria"
                  className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                >
                  Categoría
                </label>
                <select
                  id="inv-categoria"
                  className="admin-field sm:w-[150px]"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option value="todas">Todas</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label
                  htmlFor="inv-marca"
                  className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                >
                  Marca
                </label>
                <select
                  id="inv-marca"
                  className="admin-field sm:w-[150px]"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                >
                  <option value="todas">Todas</option>
                  {marcas.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 border border-background-800 bg-background-900 px-2 py-1.5 text-[11px] text-foreground-300">
                <input
                  type="checkbox"
                  checked={soloBajo}
                  onChange={(e) => setSoloBajo(e.target.checked)}
                  className="h-3 w-3 accent-current"
                />
                Solo stock bajo
              </label>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="admin-table min-w-[1340px]">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Código</th>
                <th>Código de barras</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Marca</th>
                <th>Compatibilidad</th>
                <th className="text-right">Existencia</th>
                <th className="text-right">Mín.</th>
                <th className="text-right">Precio mayor</th>
                <th className="text-right">Precio menor</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((producto) => {
                const fotos = fotosDeProducto(producto);
                return (
                <tr key={producto.codigo}>
                  <td className="w-16">
                    <PhotoThumb
                      fotos={fotos}
                      alt={producto.nombre}
                      onOpen={(indice) =>
                        setVisor({
                          fotos,
                          indice,
                          titulo: `${producto.codigo} · ${producto.nombre}`,
                        })
                      }
                    />
                  </td>
                  <td className="whitespace-nowrap font-mono text-foreground-50">{producto.codigo}</td>
                  <td className="whitespace-nowrap font-mono text-[11px] text-foreground-400">
                    {producto.codigoBarras}
                  </td>
                  <td className="min-w-[220px]">
                    <p className="text-foreground-50">{producto.nombre}</p>
                    <p className="text-[11px] text-foreground-500">Ubicación {producto.ubicacion}</p>
                  </td>
                  <td className="whitespace-nowrap">{producto.categoria}</td>
                  <td className="whitespace-nowrap">{producto.marca}</td>
                  <td className="min-w-[190px] text-[12px] text-foreground-300">
                    {compatibilidadTexto(producto)}
                  </td>
                  <td className="text-right font-mono text-foreground-50">{producto.existencia}</td>
                  <td className="text-right font-mono text-foreground-400">{producto.stockMinimo}</td>
                  <td className="whitespace-nowrap text-right font-mono">
                    {formatMoney(producto.precioMayor)}
                  </td>
                  <td className="whitespace-nowrap text-right font-mono">
                    {formatMoney(producto.precioMenor)}
                  </td>
                  <td className="whitespace-nowrap text-[12px]">
                    {nombreProveedor(producto.proveedorId)}
                  </td>
                  <td>
                    <StatusTag label={stockEstado(producto.existencia, producto.stockMinimo)} />
                  </td>
                  <td className="text-right">
                    <Link
                      to={`/inventario/editar/${producto.codigo}`}
                      className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap border border-background-800 px-2 py-1 text-[11px] text-foreground-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-6 text-center text-[12px] text-foreground-500">
                    No hay productos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {visor && (
        <PhotoViewer
          fotos={visor.fotos}
          indiceInicial={visor.indice}
          titulo={visor.titulo}
          onClose={() => setVisor(null)}
        />
      )}
    </div>
  );
}
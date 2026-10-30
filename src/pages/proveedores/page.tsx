import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import { btn } from "@/components/base/buttonStyles";
import { useProveedores } from "@/lib/proveedoresStore";
import { useProductos } from "@/lib/inventarioStore";
import { formatDate } from "@/lib/format";

export default function ProveedoresPage() {
  const proveedores = useProveedores();
  const productos = useProductos();
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return proveedores;
    return proveedores.filter((proveedor) =>
      [proveedor.nombre, proveedor.contacto, proveedor.ciudad, proveedor.correo]
        .join(" ")
        .toLowerCase()
        .includes(texto),
    );
  }, [proveedores, busqueda]);

  const asociadosDe = (proveedorId: string) =>
    productos.filter((producto) => producto.proveedorId === proveedorId);

  return (
    <div>
      <PageHeader
        title="Proveedores"
        subtitle="Registro de proveedores y relación con los productos del inventario."
        actions={
          <>
            <Link to="/inventario/movimientos" className={btn("secondary")}>
              <i className="ri-exchange-line text-[13px] leading-none" aria-hidden="true" />
              Registrar compra
            </Link>
            <Link to="/proveedores/nuevo" className={btn("primary")}>
              <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
              Nuevo proveedor
            </Link>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Proveedores registrados"
            hint={`${filtrados.length} de ${proveedores.length}`}
            flush
          >
            <div className="border-b border-background-800 px-3 py-2.5">
              <label
                htmlFor="prov-buscar"
                className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
              >
                Buscar proveedor
              </label>
              <input
                id="prov-buscar"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, contacto, ciudad o correo"
                className="admin-field"
              />
            </div>
            <div className="w-full overflow-x-auto">
              <table className="admin-table min-w-[960px]">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Proveedor</th>
                    <th>Contacto</th>
                    <th>Teléfono</th>
                    <th>Ciudad</th>
                    <th className="text-right">Productos</th>
                    <th>Última compra</th>
                    <th>Condiciones</th>
                    <th className="text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((proveedor) => (
                    <tr key={proveedor.id}>
                      <td className="whitespace-nowrap font-mono text-foreground-50">
                        {proveedor.id}
                      </td>
                      <td className="min-w-[170px]">
                        <p className="text-foreground-50">{proveedor.nombre}</p>
                        <p className="text-[11px] text-foreground-500">{proveedor.correo}</p>
                      </td>
                      <td className="whitespace-nowrap">{proveedor.contacto}</td>
                      <td className="whitespace-nowrap font-mono text-[12px]">{proveedor.telefono}</td>
                      <td className="whitespace-nowrap">{proveedor.ciudad}</td>
                      <td className="text-right font-mono">{asociadosDe(proveedor.id).length}</td>
                      <td className="whitespace-nowrap font-mono text-[12px]">
                        {formatDate(proveedor.ultimaCompra)}
                      </td>
                      <td className="whitespace-nowrap text-[12px] text-foreground-300">
                        {proveedor.condiciones}
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/proveedores/editar/${proveedor.id}`}
                          className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap border border-background-800 px-2 py-1 text-[11px] text-foreground-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-[12px] text-foreground-500">
                        No hay proveedores que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div>
          <Panel title="Productos por proveedor" hint="Relación usada para reposición de stock." flush>
            <ul className="divide-y divide-background-700">
              {proveedores.slice(0, 7).map((proveedor) => {
                const asociados = asociadosDe(proveedor.id);
                const criticos = asociados.filter(
                  (producto) => producto.existencia <= producto.stockMinimo,
                ).length;
                return (
                  <li key={proveedor.id} className="px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] text-foreground-50">{proveedor.nombre}</p>
                        <p className="text-[11px] text-foreground-500">
                          {asociados.length} productos asociados
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-foreground-400">
                        {criticos > 0 ? `${criticos} por reponer` : "Stock OK"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {asociados.slice(0, 3).map((producto) => (
                        <span
                          key={producto.codigo}
                          className="border border-background-800 bg-background-100 px-1.5 py-0.5 font-mono text-[10px] text-foreground-400"
                        >
                          {producto.codigo}
                        </span>
                      ))}
                      {asociados.length > 3 && (
                        <span className="px-1 py-0.5 text-[10px] text-foreground-500">
                          +{asociados.length - 3}
                        </span>
                      )}
                      {asociados.length === 0 && (
                        <span className="text-[10px] text-foreground-500">
                          Sin productos asociados
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import { btn } from "@/components/base/buttonStyles";
import { useVentas } from "@/lib/ventasStore";
import { formatMoney } from "@/lib/format";

export default function HistorialVentasPage() {
  const ventas = useVentas();
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return ventas;
    return ventas.filter((venta) =>
      [venta.id, venta.cliente, venta.fecha].join(" ").toLowerCase().includes(texto),
    );
  }, [ventas, busqueda]);

  const totalPeriodo = filtradas.reduce((acc, venta) => acc + venta.total, 0);
  const unidades = filtradas.reduce(
    (acc, venta) => acc + venta.lineas.reduce((suma, linea) => suma + linea.cantidad, 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Historial de ventas"
        subtitle="Ventas registradas en el punto de venta y su detalle de productos."
        actions={
          <Link to="/punto-venta" className={btn("secondary")}>
            <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
            Volver al punto de venta
          </Link>
        }
      />

      <Panel
        title="Ventas registradas"
        hint={`${filtradas.length} ventas · ${unidades} unidades · ${formatMoney(totalPeriodo)}`}
        flush
      >
        <div className="border-b border-background-800 px-3 py-2.5">
          <label
            htmlFor="ventas-buscar"
            className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
          >
            Buscar por número de venta, cliente o fecha
          </label>
          <input
            id="ventas-buscar"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="V-0003, Cliente mostrador, 2026-10-28"
            className="admin-field sm:max-w-[420px]"
          />
        </div>

        <div className="w-full overflow-x-auto">
          <table className="admin-table min-w-[900px]">
            <thead>
              <tr>
                <th>Número de venta</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Productos vendidos</th>
                <th className="text-right">Cantidades</th>
                <th className="text-right">Total</th>
                <th>Medio de pago</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((venta) => (
                <tr key={venta.id}>
                  <td className="whitespace-nowrap font-mono text-foreground-50">{venta.id}</td>
                  <td className="whitespace-nowrap font-mono text-[12px]">{venta.fecha}</td>
                  <td className="whitespace-nowrap">{venta.cliente}</td>
                  <td className="min-w-[280px]">
                    <ul className="space-y-0.5">
                      {venta.lineas.map((linea) => (
                        <li key={linea.codigo} className="text-[12px] text-foreground-300">
                          {linea.nombre}{" "}
                          <span className="font-mono text-[11px] text-foreground-500">
                            ({linea.codigo})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="text-right align-top font-mono">
                    <ul className="space-y-0.5">
                      {venta.lineas.map((linea) => (
                        <li key={linea.codigo}>{linea.cantidad}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="whitespace-nowrap text-right align-top font-mono text-foreground-50">
                    {formatMoney(venta.total)}
                  </td>
                  <td className="whitespace-nowrap align-top">{venta.medioPago}</td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[12px] text-foreground-500">
                    No hay ventas que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
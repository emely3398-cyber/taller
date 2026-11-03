import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import StatusTag from "@/components/base/StatusTag";
import { btn } from "@/components/base/buttonStyles";
import { useCotizaciones, calcularTotales } from "@/lib/cotizacionesStore";
import { useOrdenes } from "@/hooks/useOrdenes";
import { formatDate, formatMoney } from "@/lib/format";
import type { TipoCotizacion } from "@/types/admin";

const tabs: { value: "todas" | TipoCotizacion; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "Taller", label: "Taller" },
  { value: "Punto de venta", label: "Punto de venta" },
];

export default function CotizacionesPage() {
  const [params, setParams] = useSearchParams();
  const cotizaciones = useCotizaciones();
  const ordenes = useOrdenes();
  const [busqueda, setBusqueda] = useState("");

  const tipoActual = (params.get("tipo") || "todas") as "todas" | TipoCotizacion;
  const referencia = params.get("referencia") || "";

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return cotizaciones.filter((cotizacion) => {
      const coincideTipo = tipoActual === "todas" || cotizacion.tipo === tipoActual;
      const coincideRef = !referencia || cotizacion.referencia === referencia;
      const coincideTexto =
        !texto ||
        [cotizacion.id, cotizacion.cliente, cotizacion.referencia]
          .join(" ")
          .toLowerCase()
          .includes(texto);
      return coincideTipo && coincideRef && coincideTexto;
    });
  }, [cotizaciones, tipoActual, referencia, busqueda]);

  const cambiarTipo = (tipo: string) => {
    const next = new URLSearchParams(params);
    if (tipo === "todas") next.delete("tipo");
    else next.set("tipo", tipo);
    setParams(next, { replace: true });
  };

  const limpiarReferencia = () => {
    const next = new URLSearchParams(params);
    next.delete("referencia");
    setParams(next, { replace: true });
  };

  const clienteDeOrden = (ordenId: string) =>
    ordenes.find((orden) => orden.id === ordenId)?.propietario || "—";

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        subtitle="Un solo módulo para cotizaciones de taller y de productos del punto de venta."
        actions={
          <Link to="/cotizaciones/nueva" className={btn("primary")}>
            <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
            Nueva cotización
          </Link>
        }
      />

      <Panel title="Cotizaciones registradas" hint={`${filtradas.length} registros visibles`} flush>
        <div className="flex flex-col gap-2 border-b border-background-800 px-3 py-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit flex-wrap items-center gap-1 border border-background-800 bg-background-100 p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => cambiarTipo(tab.value)}
                  className={`cursor-pointer whitespace-nowrap rounded-[2px] px-2.5 py-1 text-[12px] transition-colors ${
                    tipoActual === tab.value
                      ? "bg-primary-500 text-white"
                      : "text-foreground-400 hover:bg-background-200 hover:text-foreground-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por número, cliente u orden"
                aria-label="Buscar cotización"
                className="admin-field sm:w-[260px]"
              />
            </div>
          </div>

          {referencia ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-400">
              <span className="border border-background-800 px-2 py-1">
                Orden vinculada: <span className="font-mono text-foreground-50">{referencia}</span>
              </span>
              <button
                type="button"
                onClick={limpiarReferencia}
                className="cursor-pointer text-primary-600 underline decoration-primary-200 underline-offset-2 hover:text-primary-800"
              >
                Quitar filtro
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-foreground-500">
              Las cotizaciones no descuentan inventario.
            </p>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <table className="admin-table min-w-[1020px]">
            <thead>
              <tr>
                <th>Número</th>
                <th>Tipo</th>
                <th>Referencia</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th className="text-right">Materiales</th>
                <th className="text-right">Reajustes</th>
                <th className="text-right">Total estimado</th>
                <th>Estado</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((cotizacion) => (
                <tr key={cotizacion.id}>
                  <td className="whitespace-nowrap font-mono text-foreground-50">{cotizacion.id}</td>
                  <td>
                    <StatusTag label={cotizacion.tipo} />
                  </td>
                  <td className="whitespace-nowrap">
                    {cotizacion.tipo === "Taller" ? (
                      <Link
                        to={`/taller/${cotizacion.referencia}`}
                        className="cursor-pointer font-mono text-primary-600 underline decoration-primary-200 underline-offset-2 hover:text-primary-800"
                      >
                        {cotizacion.referencia}
                      </Link>
                    ) : (
                      <span className="text-foreground-400">{cotizacion.referencia}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    {cotizacion.cliente || clienteDeOrden(cotizacion.referencia)}
                  </td>
                  <td className="whitespace-nowrap font-mono text-[12px]">
                    {formatDate(cotizacion.fecha)}
                  </td>
                  <td className="text-right font-mono">{cotizacion.lineas.length}</td>
                  <td className="text-right font-mono">
                    {cotizacion.reajustes.length > 0 ? (
                      <span className="text-foreground-50">{cotizacion.reajustes.length}</span>
                    ) : (
                      <span className="text-foreground-500">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-right font-mono text-foreground-50">
                    {formatMoney(calcularTotales(cotizacion).total)}
                  </td>
                  <td>
                    <StatusTag label={cotizacion.estado} />
                  </td>
                  <td className="text-right">
                    <Link
                      to={`/cotizaciones/${cotizacion.id}`}
                      className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap border border-background-800 px-2 py-1 text-[11px] text-foreground-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    >
                      Ver cotización
                    </Link>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-[12px] text-foreground-500">
                    No hay cotizaciones para el filtro seleccionado.
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
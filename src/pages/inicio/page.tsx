import { Link } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import StatusTag from "@/components/base/StatusTag";
import { btn } from "@/components/base/buttonStyles";
import { esEstadoCerrado } from "@/lib/taller";
import { useOrdenes } from "@/hooks/useOrdenes";
import { formatDate } from "@/lib/format";

const accesos = [
  {
    to: "/taller/nueva",
    label: "Nueva hoja de servicio",
    hint: "Registrar ingreso de motocicleta",
    icon: "ri-file-add-line",
  },
  {
    to: "/taller",
    label: "Consultar órdenes de servicio",
    hint: "Listado y seguimiento de reparaciones",
    icon: "ri-clipboard-line",
  },
  {
    to: "/cotizaciones/nueva",
    label: "Nueva cotización",
    hint: "Taller o punto de venta",
    icon: "ri-file-list-3-line",
  },
  {
    to: "/punto-venta",
    label: "Registrar venta",
    hint: "Venta de repuestos y productos",
    icon: "ri-shopping-cart-2-line",
  },
  {
    to: "/inventario",
    label: "Consultar inventario",
    hint: "Existencias, códigos y precios",
    icon: "ri-archive-2-line",
  },
  {
    to: "/proveedores",
    label: "Proveedores",
    hint: "Contactos y productos asociados",
    icon: "ri-truck-line",
  },
];

export default function InicioPage() {
  const ordenes = useOrdenes();
  const recientes = ordenes.slice(0, 6);
  const pendientes = ordenes.filter((orden) => !esEstadoCerrado(orden.estado));

  return (
    <div>
      <PageHeader
        title="Inicio"
        subtitle="Accesos directos a las operaciones diarias del taller y del punto de venta."
        actions={
          <Link to="/inventario/movimientos" className={btn("secondary")}>
            <i className="ri-exchange-line text-[13px] leading-none" aria-hidden="true" />
            Entradas y salidas de inventario
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {accesos.map((acceso) => (
          <Link
            key={acceso.to}
            to={acceso.to}
            className="group flex min-h-[76px] flex-col justify-between border border-background-800 bg-background-900 px-2.5 py-2 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
          >
            <span className="flex h-4 w-4 items-center justify-center text-foreground-400 group-hover:text-primary-600">
              <i className={`${acceso.icon} text-[16px] leading-none`} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-[12px] font-medium leading-tight text-foreground-100">
                {acceso.label}
              </span>
              <span className="mt-1 block text-[10px] leading-tight text-foreground-500">
                {acceso.hint}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <Panel
        title="Órdenes de servicio recientes"
        hint="Registros abiertos y entregados de los últimos días."
        flush
        actions={
          <Link to="/taller" className={btn("secondary")}>
            <i className="ri-list-check text-[13px] leading-none" aria-hidden="true" />
            Ver todas las órdenes
          </Link>
        }
      >
        <div className="w-full overflow-x-auto">
          <table className="admin-table min-w-[980px]">
            <thead>
              <tr>
                <th>Número de orden</th>
                <th>Propietario</th>
                <th>Motocicleta</th>
                <th>Placa</th>
                <th>Mecánico</th>
                <th>Estado</th>
                <th>Fecha estimada de entrega</th>
                <th className="text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((orden) => (
                <tr key={orden.id}>
                  <td className="whitespace-nowrap font-mono text-foreground-50">{orden.id}</td>
                  <td className="whitespace-nowrap">{orden.propietario}</td>
                  <td className="whitespace-nowrap">
                    {orden.marca} {orden.modelo}
                  </td>
                  <td className="whitespace-nowrap font-mono text-[12px]">{orden.placa}</td>
                  <td className="whitespace-nowrap">{orden.mecanico}</td>
                  <td>
                    <StatusTag label={orden.estado} />
                  </td>
                  <td className="whitespace-nowrap font-mono text-[12px]">
                    {formatDate(orden.fechaEntrega)}
                  </td>
                  <td className="text-right">
                    <Link
                      to={`/taller/${orden.id}`}
                      className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap border border-background-800 px-2 py-1 text-[11px] text-foreground-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    >
                      Ver detalle
                      <i
                        className="ri-arrow-right-s-line text-[12px] leading-none"
                        aria-hidden="true"
                      />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-3">
        <Panel
          title="Pendientes de atención"
          hint={`${pendientes.length} órdenes abiertas en el taller`}
          flush
        >
          <ul className="divide-y divide-background-700">
            {pendientes.slice(0, 4).map((orden) => (
              <li key={orden.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-foreground-100">
                    <span className="font-mono text-foreground-400">{orden.id}</span> ·{" "}
                    {orden.propietario}
                  </p>
                  <p className="truncate text-[11px] text-foreground-500">
                    {orden.marca} {orden.modelo} · {orden.placa}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusTag label={orden.estado} />
                  <Link
                    to={`/taller/${orden.id}`}
                    className="cursor-pointer text-[11px] text-primary-600 underline decoration-primary-200 underline-offset-2 hover:text-primary-800"
                  >
                    Abrir
                  </Link>
                </div>
              </li>
            ))}
            {pendientes.length === 0 && (
              <li className="px-3 py-4 text-center text-[12px] text-foreground-500">
                No hay órdenes abiertas.
              </li>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
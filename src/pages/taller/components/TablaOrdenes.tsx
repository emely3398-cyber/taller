import { Link } from "react-router-dom";
import StatusTag from "@/components/base/StatusTag";
import { formatDate } from "@/lib/format";
import { btn } from "@/components/base/buttonStyles";
import type { OrdenServicio } from "@/types/admin";

type Props = {
  ordenes: OrdenServicio[];
  onSeguimiento: (id: string) => void;
  mostrarMecanico?: boolean;
  mensajeVacio?: string;
};

export default function TablaOrdenes({
  ordenes,
  onSeguimiento,
  mostrarMecanico = true,
  mensajeVacio = "No hay órdenes que coincidan con la búsqueda.",
}: Props) {
  const columnas = mostrarMecanico ? 10 : 9;

  return (
    <div className="w-full">
      <ul className="divide-y divide-background-700 md:hidden">
        {ordenes.map((orden) => (
          <li key={orden.id} className="px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-[12px] text-foreground-500">{orden.id}</p>
                <p className="truncate text-[13px] font-medium text-foreground-50">
                  {orden.propietario}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSeguimiento(orden.id)}
                title={`Ver seguimiento de ${orden.id}`}
                aria-label={`Ver seguimiento de la orden ${orden.id}`}
                className="shrink-0 cursor-pointer rounded-[2px] border border-transparent p-0.5 hover:border-primary-300 hover:bg-primary-50"
              >
                <StatusTag label={orden.estado} />
              </button>
            </div>

            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div className="min-w-0">
                <dt className="text-foreground-500">Motocicleta</dt>
                <dd className="truncate text-foreground-200">
                  {orden.marca} {orden.modelo}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-foreground-500">Placa</dt>
                <dd className="truncate font-mono text-foreground-200">{orden.placa}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-foreground-500">Tipo de servicio</dt>
                <dd className="truncate text-foreground-200">{orden.tipoServicio || "Por definir"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-foreground-500">Entrega estimada</dt>
                <dd className="truncate font-mono text-foreground-200">
                  {formatDate(orden.fechaEntrega)}
                </dd>
              </div>
              {mostrarMecanico && (
                <div className="col-span-2 min-w-0">
                  <dt className="text-foreground-500">Mecánico</dt>
                  <dd className="truncate text-foreground-200">{orden.mecanico}</dd>
                </div>
              )}
            </dl>

            <div className="mt-2 flex flex-wrap gap-2">
              <Link to={`/taller/${orden.id}`} className={btn("secondary")}>
                <i className="ri-eye-line text-[13px] leading-none" aria-hidden="true" />
                Ver detalle
              </Link>
              <button
                type="button"
                onClick={() => onSeguimiento(orden.id)}
                className={btn("ghost")}
              >
                <i className="ri-git-branch-line text-[13px] leading-none" aria-hidden="true" />
                Seguimiento
              </button>
            </div>
          </li>
        ))}
        {ordenes.length === 0 && (
          <li className="px-3 py-6 text-center text-[12px] text-foreground-500">{mensajeVacio}</li>
        )}
      </ul>

      <div className="hidden w-full overflow-x-auto md:block">
        <table className="admin-table min-w-[1120px]">
          <thead>
            <tr>
              <th>Número de orden</th>
              <th>Fecha de ingreso</th>
              <th>Propietario</th>
              <th>Motocicleta</th>
              <th>Placa</th>
              {mostrarMecanico && <th>Mecánico</th>}
              <th>Tipo de servicio</th>
              <th>Estado</th>
              <th>Entrega estimada</th>
              <th className="text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => (
              <tr key={orden.id}>
                <td className="whitespace-nowrap font-mono text-foreground-50">{orden.id}</td>
                <td className="whitespace-nowrap font-mono text-[12px]">
                  {formatDate(orden.fechaIngreso)}
                </td>
                <td className="whitespace-nowrap">{orden.propietario}</td>
                <td className="whitespace-nowrap">
                  {orden.marca} {orden.modelo}
                </td>
                <td className="whitespace-nowrap font-mono text-[12px]">{orden.placa}</td>
                {mostrarMecanico && <td className="whitespace-nowrap">{orden.mecanico}</td>}
                <td className="whitespace-nowrap">{orden.tipoServicio || "Por definir"}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => onSeguimiento(orden.id)}
                    title={`Ver seguimiento de ${orden.id}`}
                    aria-label={`Ver seguimiento de la orden ${orden.id}`}
                    className="cursor-pointer rounded-[2px] border border-transparent p-0.5 hover:border-primary-300 hover:bg-primary-50"
                  >
                    <StatusTag label={orden.estado} />
                  </button>
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
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={columnas} className="py-6 text-center text-[12px] text-foreground-500">
                  {mensajeVacio}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
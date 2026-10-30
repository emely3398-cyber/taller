import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import StatusTag from "@/components/base/StatusTag";
import { btn } from "@/components/base/buttonStyles";
import { useOrdenes } from "@/hooks/useOrdenes";
import { useMecanicos } from "@/lib/mecanicosStore";
import { esEstadoCerrado } from "@/lib/taller";
import TallerTabs from "@/pages/taller/components/TallerTabs";

export default function MecanicosPage() {
  const mecanicos = useMecanicos();
  const ordenes = useOrdenes();
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return mecanicos;
    return mecanicos.filter((mecanico) =>
      [mecanico.nombre, mecanico.codigo, mecanico.usuario, mecanico.telefono]
        .join(" ")
        .toLowerCase()
        .includes(texto),
    );
  }, [mecanicos, busqueda]);

  const ordenesDe = (nombre: string) => ordenes.filter((orden) => orden.mecanico === nombre);
  const activasDe = (nombre: string) =>
    ordenesDe(nombre).filter((orden) => !esEstadoCerrado(orden.estado)).length;

  return (
    <div>
      <PageHeader
        title="Mecánicos"
        subtitle="Registro del personal técnico del taller y sus órdenes asignadas."
        actions={
          <Link to="/taller/mecanicos/nuevo" className={btn("primary")}>
            <i className="ri-user-add-line text-[13px] leading-none" aria-hidden="true" />
            Registrar mecánico
          </Link>
        }
      />

      <TallerTabs />

      <Panel title="Personal del taller" hint={`${filtrados.length} mecánicos registrados`} flush>
        <div className="border-b border-background-800 px-3 py-2.5">
          <label
            htmlFor="mecanico-buscar"
            className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
          >
            Buscar por nombre, código o usuario
          </label>
          <input
            id="mecanico-buscar"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Carlos López, MEC-001, clopez"
            className="admin-field sm:max-w-[320px]"
          />
        </div>

        <div className="w-full overflow-x-auto">
          <table className="admin-table min-w-[860px]">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre completo</th>
                <th>Teléfono</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th className="text-right">Órdenes activas</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((mecanico) => (
                <tr key={mecanico.codigo}>
                  <td className="whitespace-nowrap font-mono text-foreground-50">
                    {mecanico.codigo}
                  </td>
                  <td className="whitespace-nowrap">{mecanico.nombre}</td>
                  <td className="whitespace-nowrap font-mono text-[12px]">{mecanico.telefono}</td>
                  <td className="whitespace-nowrap font-mono text-[12px]">{mecanico.usuario}</td>
                  <td>
                    <StatusTag label={mecanico.activo ? "Activo" : "Inactivo"} />
                  </td>
                  <td className="text-right font-mono">{activasDe(mecanico.nombre)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/taller/mecanicos/${mecanico.codigo}`}
                        className="cursor-pointer whitespace-nowrap border border-background-800 px-2 py-1 text-[11px] text-foreground-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                      >
                        Ver perfil
                      </Link>
                      <Link
                        to={`/taller/mecanicos/editar/${mecanico.codigo}`}
                        className="cursor-pointer whitespace-nowrap border border-background-800 px-2 py-1 text-[11px] text-foreground-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[12px] text-foreground-500">
                    No hay mecánicos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="mt-3 border border-background-800 bg-background-900 px-3 py-2 text-[11px] leading-relaxed text-foreground-500">
        Los mecánicos acceden al sistema con su usuario y contraseña desde la pantalla de inicio de
        sesión. Su perfil muestra únicamente las órdenes que tienen asignadas.
      </p>
    </div>
  );
}
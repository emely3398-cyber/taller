import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import { btn } from "@/components/base/buttonStyles";
import { useOrdenes } from "@/hooks/useOrdenes";
import { esEstadoCerrado } from "@/lib/taller";
import { useSesion } from "@/lib/sesionStore";
import SeguimientoDrawer from "@/pages/taller/components/SeguimientoDrawer";
import TablaOrdenes from "@/pages/taller/components/TablaOrdenes";

export default function MisOrdenesPage() {
  const sesion = useSesion();
  const ordenes = useOrdenes();
  const [busqueda, setBusqueda] = useState("");
  const [ordenAbierta, setOrdenAbierta] = useState<string | null>(null);

  const asignadas = useMemo(() => {
    if (!sesion || sesion.tipo !== "Mecánico") return [];
    return ordenes.filter((orden) => orden.mecanico === sesion.nombre);
  }, [ordenes, sesion]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return asignadas;
    return asignadas.filter((orden) =>
      [orden.id, orden.propietario, orden.placa, orden.modelo]
        .join(" ")
        .toLowerCase()
        .includes(texto),
    );
  }, [asignadas, busqueda]);

  if (!sesion) return <Navigate to="/login" replace />;
  if (sesion.tipo !== "Mecánico") return <Navigate to="/taller" replace />;

  const activas = asignadas.filter((orden) => !esEstadoCerrado(orden.estado));
  const ordenSeleccionada = ordenes.find((orden) => orden.id === ordenAbierta) || null;

  return (
    <div>
      <PageHeader
        title="Mis órdenes asignadas"
        subtitle={`${sesion.nombre} · ${activas.length} reparaciones en curso`}
        actions={
          <>
            <Link to="/taller/nueva" className={btn("primary")}>
              <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
              Nueva hoja de servicio
            </Link>
            <Link to={`/taller/mecanicos/${sesion.mecanicoCodigo}`} className={btn("secondary")}>
              <i className="ri-user-line text-[13px] leading-none" aria-hidden="true" />
              Mi perfil
            </Link>
          </>
        }
      />

      <Panel title="Órdenes de servicio" flush>
        <div className="border-b border-background-800 px-3 py-2.5">
          <label
            htmlFor="mis-ordenes-buscar"
            className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
          >
            Buscar por número de orden, propietario, placa o modelo
          </label>
          <input
            id="mis-ordenes-buscar"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="OS-0002, Diego Pérez, M-731DFG"
            className="admin-field sm:max-w-[360px]"
          />
        </div>

        <TablaOrdenes
          ordenes={filtradas}
          onSeguimiento={setOrdenAbierta}
          mostrarMecanico={false}
          mensajeVacio="No tiene órdenes asignadas con ese criterio."
        />
      </Panel>

      {ordenSeleccionada && (
        <SeguimientoDrawer orden={ordenSeleccionada} onClose={() => setOrdenAbierta(null)} />
      )}
    </div>
  );
}
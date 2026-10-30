import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import { btn } from "@/components/base/buttonStyles";
import { useOrdenes } from "@/hooks/useOrdenes";
import { ESTADOS_ORDEN } from "@/lib/taller";
import SeguimientoDrawer from "@/pages/taller/components/SeguimientoDrawer";
import TablaOrdenes from "@/pages/taller/components/TablaOrdenes";
import TallerTabs from "@/pages/taller/components/TallerTabs";

export default function TallerPage() {
  const ordenes = useOrdenes();
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("todos");
  const [ordenAbierta, setOrdenAbierta] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return ordenes.filter((orden) => {
      const coincideTexto =
        !texto ||
        [orden.id, orden.propietario, orden.placa].join(" ").toLowerCase().includes(texto);
      const coincideEstado = estado === "todos" || orden.estado === estado;
      return coincideTexto && coincideEstado;
    });
  }, [ordenes, busqueda, estado]);

  const ordenSeleccionada = ordenes.find((orden) => orden.id === ordenAbierta) || null;

  const limpiar = () => {
    setBusqueda("");
    setEstado("todos");
  };

  return (
    <div>
      <PageHeader
        title="Taller"
        subtitle="Órdenes de servicio registradas, mecánico asignado y estado de reparación."
        actions={
          <>
            <Link to="/taller/mecanicos" className={btn("secondary")}>
              <i className="ri-user-settings-line text-[13px] leading-none" aria-hidden="true" />
              Mecánicos
            </Link>
            <Link to="/taller/nueva" className={btn("primary")}>
              <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
              Nueva hoja de servicio
            </Link>
          </>
        }
      />

      <TallerTabs />

      <Panel title="Órdenes de servicio" flush>
        <div className="border-b border-background-800 px-3 py-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="taller-buscar"
                className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
              >
                Buscar por número de orden, propietario o placa
              </label>
              <input
                id="taller-buscar"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="OS-0001, Carlos López, M-482ABC"
                className="admin-field"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 sm:flex-none">
                <label
                  htmlFor="taller-estado"
                  className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                >
                  Estado de la orden
                </label>
                <select
                  id="taller-estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="admin-field sm:w-[195px]"
                >
                  <option value="todos">Todos los estados</option>
                  {ESTADOS_ORDEN.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={limpiar} className={btn("secondary")}>
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <TablaOrdenes ordenes={filtradas} onSeguimiento={setOrdenAbierta} />
      </Panel>

      {ordenSeleccionada && (
        <SeguimientoDrawer
          orden={ordenSeleccionada}
          onClose={() => setOrdenAbierta(null)}
        />
      )}
    </div>
  );
}
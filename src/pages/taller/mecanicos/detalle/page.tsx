import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import StatusTag from "@/components/base/StatusTag";
import { btn } from "@/components/base/buttonStyles";
import { useOrdenes } from "@/hooks/useOrdenes";
import { obtenerMecanico } from "@/lib/mecanicosStore";
import { esEstadoCerrado } from "@/lib/taller";
import { useSesion } from "@/lib/sesionStore";
import SeguimientoDrawer from "@/pages/taller/components/SeguimientoDrawer";
import TablaOrdenes from "@/pages/taller/components/TablaOrdenes";

export default function MecanicoDetallePage() {
  const { codigo } = useParams();
  const sesion = useSesion();
  const ordenes = useOrdenes();
  const mecanico = codigo ? obtenerMecanico(codigo) : undefined;
  const [ordenAbierta, setOrdenAbierta] = useState<string | null>(null);

  const esMecanico = sesion?.tipo === "Mecánico";
  const sinAcceso = esMecanico && sesion?.mecanicoCodigo !== codigo;

  if (!mecanico) {
    return (
      <div>
        <PageHeader title="Perfil del mecánico" subtitle="El registro solicitado no está disponible." />
        <Panel title="Mecánico no encontrado">
          <p className="text-[13px] text-foreground-300">
            No se encontró el mecánico <span className="font-mono">{codigo}</span>.
          </p>
          <Link to="/taller/mecanicos" className={`${btn("primary")} mt-3`}>
            Volver al listado
          </Link>
        </Panel>
      </div>
    );
  }

  if (sinAcceso) {
    return (
      <div>
        <PageHeader title="Perfil del mecánico" subtitle="Acceso restringido." />
        <Panel title="Sin acceso a este perfil">
          <p className="text-[13px] text-foreground-300">
            El usuario <span className="font-mono">{sesion?.usuario}</span> solo puede consultar su
            propio perfil y las órdenes que tiene asignadas.
          </p>
          <Link
            to={`/taller/mecanicos/${sesion?.mecanicoCodigo || ""}`}
            className={`${btn("primary")} mt-3`}
          >
            Ir a mi perfil
          </Link>
        </Panel>
      </div>
    );
  }

  const asignadas = ordenes.filter((orden) => orden.mecanico === mecanico.nombre);
  const activas = asignadas.filter((orden) => !esEstadoCerrado(orden.estado));
  const ordenSeleccionada = ordenes.find((orden) => orden.id === ordenAbierta) || null;

  return (
    <div>
      <PageHeader
        title={mecanico.nombre}
        subtitle={`${mecanico.codigo} · ${activas.length} reparaciones en curso`}
        actions={
          <>
            <Link to="/taller/nueva" className={btn("primary")}>
              <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
              Nueva hoja de servicio
            </Link>
            {!esMecanico && (
              <Link to={`/taller/mecanicos/editar/${mecanico.codigo}`} className={btn("secondary")}>
                <i className="ri-edit-line text-[13px] leading-none" aria-hidden="true" />
                Editar datos
              </Link>
            )}
            <Link
              to={esMecanico ? "/taller/mis-ordenes" : "/taller/mecanicos"}
              className={btn("secondary")}
            >
              <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
              {esMecanico ? "Mis órdenes" : "Volver a mecánicos"}
            </Link>
          </>
        }
      />

      <Panel
        title="Información básica"
        actions={<StatusTag label={mecanico.activo ? "Activo" : "Inactivo"} />}
      >
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-[12px] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-foreground-500">Código de mecánico</dt>
            <dd className="font-mono text-foreground-50">{mecanico.codigo}</dd>
          </div>
          <div>
            <dt className="text-foreground-500">Nombre completo</dt>
            <dd className="text-foreground-50">{mecanico.nombre}</dd>
          </div>
          <div>
            <dt className="text-foreground-500">Teléfono</dt>
            <dd className="font-mono text-foreground-50">{mecanico.telefono}</dd>
          </div>
          <div>
            <dt className="text-foreground-500">Usuario de acceso</dt>
            <dd className="font-mono text-foreground-50">{mecanico.usuario}</dd>
          </div>
        </dl>
      </Panel>

      <div className="mt-3">
        <Panel
          title="Órdenes de servicio asignadas"
          hint="Motocicletas que está reparando y estado de cada reparación."
          flush
        >
          <TablaOrdenes
            ordenes={asignadas}
            onSeguimiento={setOrdenAbierta}
            mostrarMecanico={false}
            mensajeVacio="Este mecánico no tiene órdenes asignadas."
          />
        </Panel>
      </div>

      {ordenSeleccionada && (
        <SeguimientoDrawer orden={ordenSeleccionada} onClose={() => setOrdenAbierta(null)} />
      )}
    </div>
  );
}
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import StatusTag from "@/components/base/StatusTag";
import { btn } from "@/components/base/buttonStyles";
import { useOrdenes } from "@/hooks/useOrdenes";
import { agregarSeguimientoOrden } from "@/lib/ordenesStore";
import { useCotizaciones, calcularTotales } from "@/lib/cotizacionesStore";
import { useSesion } from "@/lib/sesionStore";
import { formatDate, formatMoney } from "@/lib/format";
import { fotosDeOrden } from "@/lib/imagenes";
import PhotoGallery from "@/components/feature/PhotoGallery";
import CambioEstadoForm from "@/pages/taller/components/CambioEstadoForm";
import DespachoRepuesto from "@/pages/taller/components/DespachoRepuesto";
import DiagnosticoOrden from "@/pages/taller/components/DiagnosticoOrden";
import MaterialesOrden from "@/pages/taller/components/MaterialesOrden";
import SeguimientoReparacion from "@/pages/taller/components/SeguimientoReparacion";
import Trazabilidad from "@/pages/taller/components/Trazabilidad";

export default function OrdenDetallePage() {
  const { id } = useParams();
  const ordenes = useOrdenes();
  const cotizaciones = useCotizaciones();
  const sesion = useSesion();
  const orden = ordenes.find((item) => item.id === id);

  const [nota, setNota] = useState("");
  const [avisoNota, setAvisoNota] = useState("");

  if (!orden) {
    return (
      <div>
        <PageHeader title="Orden de servicio" subtitle="El registro solicitado no está disponible." />
        <Panel title="Orden no encontrada">
          <p className="text-[13px] text-foreground-300">
            No se encontró la orden <span className="font-mono">{id}</span> en el listado del taller.
          </p>
          <Link to="/taller" className={`${btn("primary")} mt-3`}>
            Volver al listado
          </Link>
        </Panel>
      </div>
    );
  }

  const vinculadas = cotizaciones.filter((cotizacion) => cotizacion.referencia === orden.id);
  const cotizacionVigente = vinculadas.some((cotizacion) => cotizacion.estado !== "Rechazada");
  const cotizacionAprobada = vinculadas.some((cotizacion) => cotizacion.estado === "Aprobada");
  const esMecanico = sesion?.tipo === "Mecánico";
  const fotosAvance = orden.seguimiento.flatMap((registro) =>
    registro.fotos.map((foto) => ({ ...foto, fecha: registro.fecha })),
  );

  if (esMecanico && orden.mecanico !== sesion?.nombre) {
    return (
      <div>
        <PageHeader
          title={`Orden ${orden.id}`}
          subtitle="Acceso restringido al mecánico asignado."
        />
        <Panel title="Sin acceso a esta orden">
          <p className="text-[13px] text-foreground-300">
            Esta orden está asignada a <strong>{orden.mecanico}</strong>. Su usuario solo puede
            consultar y actualizar las reparaciones que tiene asignadas.
          </p>
          <Link to="/taller/mis-ordenes" className={`${btn("primary")} mt-3`}>
            Ir a mis órdenes
          </Link>
        </Panel>
      </div>
    );
  }

  const registrarNota = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const texto = nota.trim();
    if (!texto) return;
    agregarSeguimientoOrden(orden.id, texto, orden.mecanico);
    setNota("");
    setAvisoNota("Nota agregada a la trazabilidad de la orden.");
  };

  return (
    <div>
      <PageHeader
        title={`Orden ${orden.id}`}
        subtitle={`${orden.propietario} · ${orden.marca} ${orden.modelo} · Placa ${orden.placa}`}
        actions={
          <>
            {!esMecanico && !cotizacionVigente && (
              <Link to={`/cotizaciones/nueva?orden=${orden.id}`} className={btn("secondary")}>
                <i className="ri-file-add-line text-[13px] leading-none" aria-hidden="true" />
                Crear cotización
              </Link>
            )}
            <Link to={esMecanico ? "/taller/mis-ordenes" : "/taller"} className={btn("secondary")}>
              <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
              {esMecanico ? "Mis órdenes" : "Volver al listado"}
            </Link>
          </>
        }
      />

      <div className="space-y-3">
        <Panel
          title="Datos de la orden"
          actions={
            <div className="flex items-center gap-2">
              <StatusTag label={orden.estado} />
              <span className="text-[11px] text-foreground-500">
                Entrega estimada {formatDate(orden.fechaEntrega)}
              </span>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-[12px] sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-foreground-500">Propietario</p>
              <p className="text-foreground-50">{orden.propietario}</p>
            </div>
            <div>
              <p className="text-foreground-500">Teléfono</p>
              <p className="font-mono text-foreground-50">{orden.telefono}</p>
            </div>
            <div>
              <p className="text-foreground-500">Motocicleta</p>
              <p className="text-foreground-50">
                {orden.marca} {orden.modelo}
                {orden.anio && ` · ${orden.anio}`}
              </p>
            </div>
            <div>
              <p className="text-foreground-500">Placa</p>
              <p className="font-mono text-foreground-50">{orden.placa}</p>
            </div>
            <div>
              <p className="text-foreground-500">Número de chasis</p>
              <p className="font-mono text-foreground-50">{orden.chasis || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-500">Tipo de servicio</p>
              <p className="text-foreground-50">{orden.tipoServicio || "Por definir en el diagnóstico"}</p>
            </div>
            <div>
              <p className="text-foreground-500">Mecánico asignado</p>
              <p className="text-foreground-50">{orden.mecanico}</p>
            </div>
            <div>
              <p className="text-foreground-500">Recepción / entrega estimada</p>
              <p className="font-mono text-foreground-50">
                {formatDate(orden.fechaIngreso)} → {formatDate(orden.fechaEntrega)}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-foreground-500">Características de la motocicleta</p>
              <p className="text-foreground-200">{orden.caracteristicas || "Sin observaciones."}</p>
            </div>
          </div>

          {(orden.repuestoFaltante || orden.motivoCancelacion) && (
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-background-800 pt-2.5 text-[12px] sm:grid-cols-2">
              {orden.repuestoFaltante && (
                <div className="border border-accent-300 bg-accent-50 px-2.5 py-2">
                  <p className="text-accent-800">Repuesto faltante</p>
                  <p className="mt-0.5 text-foreground-100">{orden.repuestoFaltante}</p>
                </div>
              )}
              {orden.motivoCancelacion && (
                <div className="border border-background-800 bg-background-200 px-2.5 py-2">
                  <p className="text-foreground-500">Motivo de cancelación</p>
                  <p className="mt-0.5 text-foreground-100">{orden.motivoCancelacion}</p>
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel title="Seguimiento de la reparación">
          <SeguimientoReparacion orden={orden} />
        </Panel>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="order-2 space-y-3 lg:order-1 lg:col-span-2">
            <Panel title="Falla reportada por el propietario">
              <dl className="grid grid-cols-1 gap-3 text-[12px] sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-foreground-500">Falla reportada</dt>
                  <dd className="mt-0.5 text-foreground-50">{orden.falla}</dd>
                </div>
                <div>
                  <dt className="text-foreground-500">Desde cuándo presenta el problema</dt>
                  <dd className="mt-0.5 text-foreground-200">{orden.desdeCuando || "No indicado."}</dd>
                </div>
                <div>
                  <dt className="text-foreground-500">Observaciones iniciales</dt>
                  <dd className="mt-0.5 text-foreground-200">
                    {orden.observacionesIniciales || "Sin observaciones."}
                  </dd>
                </div>
              </dl>
            </Panel>

            <Panel title="Diagnóstico técnico">
              <DiagnosticoOrden orden={orden} />
            </Panel>

            <Panel
              title="Fotografías de recepción"
              hint={`${orden.fotos.length} ${orden.fotos.length === 1 ? "imagen registrada" : "imágenes registradas"}`}
            >
              <PhotoGallery
                fotos={fotosDeOrden(orden.fotos)}
                alt={`Fotografía de recepción ${orden.id} · ${orden.marca} ${orden.modelo}`}
                titulo={`Recepción ${orden.id} · ${orden.marca} ${orden.modelo} · Placa ${orden.placa}`}
                columnas="grid-cols-2 sm:grid-cols-3"
                vacio="Esta orden no tiene fotografías de ingreso registradas."
                nota="Toque o haga clic en una fotografía para verla ampliada y conservar el detalle de la motocicleta."
                pie={(foto) => foto.nombre}
              />
            </Panel>

            <Panel
              title="Fotografías del avance"
              hint={`${fotosAvance.length} ${fotosAvance.length === 1 ? "fotografía registrada" : "fotografías registradas"}`}
            >
              <PhotoGallery
                fotos={fotosAvance.map((foto) => ({
                  url: foto.url,
                  nombre: foto.nombre,
                  pie: `Avance del ${formatDate(foto.fecha)}`,
                }))}
                alt={`Fotografía de avance ${orden.id}`}
                titulo={`Avance ${orden.id} · ${orden.marca} ${orden.modelo}`}
                columnas="grid-cols-2 sm:grid-cols-3"
                vacio="Aún no hay fotografías de avance. Se agregan al registrar los movimientos de la reparación."
                pie={(foto) => foto.pie}
              />
            </Panel>

            <Panel title="Repuestos y materiales" flush>
              <MaterialesOrden orden={orden} />
            </Panel>

            <Panel title="Cotización vinculada">
              {vinculadas.length === 0 ? (
                <div>
                  <p className="text-[12px] text-foreground-300">
                    Esta orden todavía no tiene cotización. Al crearla, el estado de la orden pasa
                    automáticamente a <strong>Cotizada</strong>.
                  </p>
                  {esMecanico ? (
                    <p className="mt-2 border border-background-800 bg-background-100 px-2.5 py-2 text-[11px] text-foreground-500">
                      El administrador elabora la cotización. Usted podrá consultarla aquí cuando
                      esté registrada.
                    </p>
                  ) : (
                    <Link
                      to={`/cotizaciones/nueva?orden=${orden.id}`}
                      className={`${btn("primary")} mt-2`}
                    >
                      <i className="ri-file-add-line text-[13px] leading-none" aria-hidden="true" />
                      Crear cotización
                    </Link>
                  )}
                </div>
              ) : (
                <ul className="space-y-2">
                  {vinculadas.map((cotizacion) => {
                    const totales = calcularTotales(cotizacion);
                    return (
                      <li
                        key={cotizacion.id}
                        className="border border-background-800 bg-background-100 px-2.5 py-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-[12px] text-foreground-50">{cotizacion.id}</p>
                          <StatusTag label={cotizacion.estado} />
                        </div>
                        <dl className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-3">
                          <div className="flex justify-between gap-2 sm:block">
                            <dt className="text-foreground-500">Materiales</dt>
                            <dd className="font-mono text-foreground-100">
                              {formatMoney(totales.materiales)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2 sm:block">
                            <dt className="text-foreground-500">Mano de obra</dt>
                            <dd className="font-mono text-foreground-100">
                              {formatMoney(totales.manoObra)}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2 sm:block">
                            <dt className="text-foreground-500">Total</dt>
                            <dd className="font-mono text-[13px] text-foreground-50">
                              {formatMoney(totales.total)}
                            </dd>
                          </div>
                        </dl>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[11px] text-foreground-500">
                            {cotizacion.estado === "Aprobada"
                              ? "Aprobada por el propietario: la reparación puede iniciarse."
                              : cotizacion.estado === "Rechazada"
                                ? "Rechazada: la orden se cancela con el motivo registrado."
                                : cotizacion.estado === "Enviada al cliente"
                                  ? "Enviada al cliente: aún no autoriza la reparación."
                                  : "Pendiente de envío al cliente."}
                          </p>
                          <Link
                            to={`/cotizaciones/${cotizacion.id}`}
                            className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap border border-background-800 px-2 py-1 text-[11px] text-foreground-200 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                          >
                            <i className="ri-file-text-line text-[12px] leading-none" aria-hidden="true" />
                            Ver cotización
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <Panel
              title="Repuestos despachados"
              hint="Cada despacho descuenta existencias del inventario compartido."
              flush
            >
              <div className="w-full overflow-x-auto">
                <table className="admin-table min-w-[520px]">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Fecha</th>
                      <th className="text-right">Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orden.repuestosDespachados.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-foreground-500">
                          Aún no se despacharon repuestos para esta orden.
                        </td>
                      </tr>
                    )}
                    {orden.repuestosDespachados.map((repuesto) => (
                      <tr key={repuesto.codigo}>
                        <td className="font-mono text-foreground-50">{repuesto.codigo}</td>
                        <td>{repuesto.descripcion}</td>
                        <td className="whitespace-nowrap font-mono text-[12px]">
                          {formatDate(repuesto.fecha)}
                        </td>
                        <td className="text-right font-mono">{repuesto.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!esMecanico && <DespachoRepuesto orden={orden} />}
            </Panel>
          </div>

          <div className="order-1 space-y-3 lg:order-2">
            <Panel
              title="Cambio de estado y avance"
              hint="Todo movimiento queda en la trazabilidad."
            >
              <CambioEstadoForm orden={orden} cotizacionAprobada={cotizacionAprobada} />
            </Panel>

            <Panel title="Trazabilidad" hint={`${orden.seguimiento.length} movimientos`} flush>
              <Trazabilidad orden={orden} />
              <form onSubmit={registrarNota} className="border-t border-background-800 p-3">
                <label
                  htmlFor="nueva-nota"
                  className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                >
                  Agregar nota sin cambiar de estado
                </label>
                <textarea
                  id="nueva-nota"
                  rows={2}
                  maxLength={300}
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Aviso al propietario, repuesto recibido, prueba de ruta"
                  className="admin-field resize-y"
                />
                <button type="submit" className={`${btn("secondary")} mt-2 w-full`}>
                  <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
                  Registrar nota
                </button>
                {avisoNota && <p className="mt-2 text-[11px] text-foreground-300">{avisoNota}</p>}
              </form>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
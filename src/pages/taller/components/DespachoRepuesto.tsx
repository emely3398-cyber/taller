import { useMemo, useRef, useState, type FormEvent } from "react";
import { btn } from "@/components/base/buttonStyles";
import Field from "@/components/base/Field";
import { useProductos } from "@/lib/inventarioStore";
import { useCotizaciones } from "@/lib/cotizacionesStore";
import { registrarCambioOrden } from "@/lib/ordenesStore";
import { registrarDespachoRepuesto } from "@/lib/repuestosStore";
import { cotizacionesDeOrden, cantidadesPorCodigo, repuestosDespachables } from "@/lib/repuestosFlujo";
import { useSesion } from "@/lib/sesionStore";
import type { OrdenServicio } from "@/types/admin";

type Props = {
  orden: OrdenServicio;
};

export default function DespachoRepuesto({ orden }: Props) {
  const productos = useProductos();
  const cotizaciones = useCotizaciones();
  const sesion = useSesion();

  const [busqueda, setBusqueda] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [despachado, setDespachado] = useState(false);
  const ultimoEnvio = useRef(0);

  const vinculadas = cotizacionesDeOrden(orden.id, cotizaciones).filter(
    (cotizacion) => cotizacion.estado !== "Rechazada",
  );
  const aprobadas = vinculadas.filter((cotizacion) => cotizacion.estado === "Aprobada");
  const despachables = useMemo(
    () => repuestosDespachables(orden, cotizaciones, productos),
    [orden, cotizaciones, productos],
  );

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return despachables;
    return despachables.filter((item) =>
      `${item.nombre} ${item.codigo}`.toLowerCase().includes(texto),
    );
  }, [despachables, busqueda]);

  const seleccionado = despachables.find((item) => item.codigo === codigo);

  let bloqueo = "";
  if (vinculadas.length === 0) {
    bloqueo =
      "Esta orden no tiene una cotización de taller vinculada. El despacho requiere una cotización aprobada.";
  } else if (aprobadas.length === 0) {
    bloqueo =
      "La cotización de taller todavía está pendiente de autorización del cliente. No se pueden despachar repuestos.";
  } else if (despachables.length === 0) {
    const codigosOrden = Array.from(new Set((orden.materiales ?? []).map((item) => item.codigo)));
    const sinAutorizar = codigosOrden.some(
      (item) => cantidadesPorCodigo(orden, item, cotizaciones).autorizada <= 0,
    );
    bloqueo = sinAutorizar
      ? "Los repuestos registrados en esta orden todavía no están incluidos en una cotización aprobada o en una ampliación autorizada."
      : "No hay repuestos autorizados pendientes de despacho en esta orden.";
  }

  const despachar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAviso("");
    setDespachado(false);
    const ahora = Date.now();
    if (ahora - ultimoEnvio.current < 1500) {
      setError(
        "El despacho anterior ya fue registrado. Evite confirmar dos veces el mismo movimiento.",
      );
      return;
    }
    if (bloqueo) {
      setError(bloqueo);
      return;
    }
    if (!seleccionado) {
      setError("Busque y seleccione un repuesto autorizado de esta orden.");
      return;
    }
    const cantidadNumero = Number(cantidad);
    if (!cantidadNumero || cantidadNumero <= 0) {
      setError("Indique una cantidad mayor a cero.");
      return;
    }
    if (cantidadNumero > seleccionado.pendiente) {
      setError(
        `La cantidad solicitada supera las unidades autorizadas pendientes (${seleccionado.pendiente}).`,
      );
      return;
    }
    if (cantidadNumero > seleccionado.existencia) {
      setError(
        `No hay existencias suficientes para realizar el despacho: solo ${seleccionado.existencia} disponibles.`,
      );
      return;
    }

    const resultado = registrarDespachoRepuesto(
      orden.id,
      { codigo: seleccionado.codigo, descripcion: seleccionado.nombre, cantidad: cantidadNumero },
      cotizaciones,
      sesion?.nombre || "Administración",
    );
    if (!resultado.ok) {
      setError(resultado.mensaje);
      return;
    }

    ultimoEnvio.current = Date.now();
    setError("");
    setCantidad("1");
    setCodigo("");
    setBusqueda("");
    setDespachado(true);
    setAviso(resultado.mensaje);
  };

  const volverAReparacion = () => {
    registrarCambioOrden(orden.id, {
      estadoNuevo: "En reparación",
      observacion: "Repuesto recibido y despachado a la orden. Se reanuda la reparación.",
      mecanico: orden.mecanico,
    });
    setDespachado(false);
    setAviso("La orden vuelve a la etapa En reparación.");
  };

  return (
    <form onSubmit={despachar} className="border-t border-background-800 px-3 py-2.5">
      <p className="mb-2 text-[11px] uppercase tracking-[0.04em] text-foreground-500">
        Despachar repuesto autorizado de esta orden
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field
          label="Buscar repuesto de la orden"
          htmlFor={`despacho-buscar-${orden.id}`}
          className="sm:col-span-2"
        >
          <div className="relative">
            <i
              className="ri-search-line pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[13px] leading-none text-foreground-500"
              aria-hidden="true"
            />
            <input
              id={`despacho-buscar-${orden.id}`}
              type="search"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setCodigo("");
                setError("");
                setAviso("");
              }}
              disabled={Boolean(bloqueo)}
              placeholder="Nombre o código del repuesto autorizado"
              autoComplete="off"
              className="admin-field pl-7 text-[13px] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </Field>
        <Field label="Cantidad a despachar" htmlFor={`despacho-cantidad-${orden.id}`}>
          <input
            id={`despacho-cantidad-${orden.id}`}
            className="admin-field font-mono"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            inputMode="numeric"
            disabled={Boolean(bloqueo)}
          />
        </Field>
      </div>

      {!seleccionado && !bloqueo && (
        <ul className="mt-1 max-h-56 divide-y divide-background-700 overflow-y-auto border border-background-800">
          {filtrados.length === 0 && (
            <li className="px-2 py-2 text-[11px] text-foreground-500">
              No hay repuestos autorizados pendientes con ese criterio.
            </li>
          )}
          {filtrados.map((item) => (
            <li key={item.codigo}>
              <button
                type="button"
                onClick={() => {
                  setCodigo(item.codigo);
                  setCantidad(String(item.pendiente));
                  setError("");
                  setAviso("");
                }}
                className="flex w-full cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-left hover:bg-background-100"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12px] text-foreground-100">
                    {item.nombre}
                  </span>
                  <span className="block font-mono text-[10px] text-foreground-500">
                    {item.codigo} · autorizadas {item.autorizada} · despachadas {item.despachada} ·
                    pendientes {item.pendiente}
                  </span>
                </span>
                <span
                  className={`shrink-0 whitespace-nowrap font-mono text-[10px] ${
                    item.existencia > 0 ? "text-foreground-300" : "text-accent-800"
                  }`}
                >
                  {item.existencia > 0 ? `${item.existencia} en stock` : "Sin existencias"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {seleccionado && (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border border-primary-200 bg-primary-50 px-2 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-[12px] text-primary-800">{seleccionado.nombre}</p>
            <p className="font-mono text-[10px] text-primary-700">
              {seleccionado.codigo} · autorizadas {seleccionado.autorizada} · despachadas{" "}
              {seleccionado.despachada} · pendientes {seleccionado.pendiente} · existencia{" "}
              {seleccionado.existencia}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCodigo("");
              setError("");
              setAviso("");
            }}
            className="shrink-0 cursor-pointer border border-primary-300 bg-background-50 px-2 py-0.5 text-[11px] text-primary-700 hover:bg-background-100"
          >
            Cambiar
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={Boolean(bloqueo)}
        className={`${btn("secondary")} mt-2 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <i className="ri-upload-2-line text-[13px] leading-none" aria-hidden="true" />
        Despachar y descontar del inventario
      </button>

      {bloqueo && (
        <p className="mt-2 border border-accent-300 bg-accent-50 px-2 py-1.5 text-[11px] text-accent-800">
          {bloqueo}
        </p>
      )}
      {error && (
        <p className="mt-2 border border-accent-300 bg-accent-50 px-2 py-1.5 text-[11px] text-accent-800">
          {error}
        </p>
      )}
      {aviso && (
        <p className="mt-2 border border-primary-200 bg-primary-50 px-2 py-1.5 text-[11px] text-primary-800">
          {aviso}
        </p>
      )}
      {despachado && orden.estado === "En espera de repuesto" && (
        <div className="mt-2 border border-primary-200 bg-primary-50 px-2 py-1.5">
          <p className="text-[11px] text-primary-800">
            La orden está en espera de repuesto. Puede continuar la reparación con la pieza
            despachada.
          </p>
          <button type="button" onClick={volverAReparacion} className={`${btn("primary")} mt-1.5`}>
            <i className="ri-arrow-right-line text-[13px] leading-none" aria-hidden="true" />
            Volver a En reparación
          </button>
        </div>
      )}
    </form>
  );
}
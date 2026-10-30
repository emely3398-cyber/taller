import { useState, type FormEvent } from "react";
import { btn } from "@/components/base/buttonStyles";
import Field from "@/components/base/Field";
import { useProductos, registrarSalida } from "@/lib/inventarioStore";
import { registrarRepuestoDespachado, registrarCambioOrden } from "@/lib/ordenesStore";
import { formatMoney } from "@/lib/format";
import type { OrdenServicio } from "@/types/admin";

type Props = {
  orden: OrdenServicio;
};

export default function DespachoRepuesto({ orden }: Props) {
  const productos = useProductos();
  const disponibles = productos.filter((producto) => producto.existencia > 0);
  const [codigo, setCodigo] = useState(disponibles[0]?.codigo || "");
  const [cantidad, setCantidad] = useState("1");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [despachado, setDespachado] = useState(false);

  const producto = productos.find((item) => item.codigo === codigo);

  const despachar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAviso("");
    setDespachado(false);
    if (!producto) {
      setError("Seleccione un repuesto del inventario.");
      return;
    }
    const cantidadNumero = Number(cantidad);
    if (!cantidadNumero || cantidadNumero <= 0) {
      setError("Indique una cantidad mayor a cero.");
      return;
    }
    if (cantidadNumero > producto.existencia) {
      setError(`Solo hay ${producto.existencia} unidades disponibles de ${producto.nombre}.`);
      return;
    }
    const salida = registrarSalida({
      codigo: producto.codigo,
      cantidad: cantidadNumero,
      motivo: "Despacho a orden de servicio",
      referencia: orden.id,
    });
    if (!salida) {
      setError("No se pudo descontar la existencia. Registre primero la entrada del repuesto.");
      return;
    }
    registrarRepuestoDespachado(orden.id, {
      codigo: producto.codigo,
      descripcion: producto.nombre,
      cantidad: cantidadNumero,
    });
    setError("");
    setCantidad("1");
    setCodigo("");
    setDespachado(true);
    setAviso(
      `Despachadas ${cantidadNumero} unidades de ${producto.nombre}. Existencias descontadas del inventario compartido.`,
    );
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
        Despachar repuesto a esta orden
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Field label="Repuesto del inventario" htmlFor="despacho-producto" className="sm:col-span-2">
          <select
            id="despacho-producto"
            className="admin-field"
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value);
              setError("");
              setAviso("");
            }}
          >
            <option value="">Seleccione un repuesto</option>
            {disponibles.map((item) => (
              <option key={item.codigo} value={item.codigo}>
                {item.codigo} · {item.nombre} ({item.existencia} disp.)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cantidad" htmlFor="despacho-cantidad">
          <input
            id="despacho-cantidad"
            className="admin-field font-mono"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            inputMode="numeric"
          />
        </Field>
      </div>

      {producto && (
        <p className="mt-1 text-[11px] text-foreground-500">
          Existencia {producto.existencia} · Precio por menor {formatMoney(producto.precioMenor)} · Ubicación{" "}
          {producto.ubicacion}
        </p>
      )}

      <button type="submit" className={`${btn("secondary")} mt-2`}>
        <i className="ri-upload-2-line text-[13px] leading-none" aria-hidden="true" />
        Despachar y descontar del inventario
      </button>

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
      {disponibles.length === 0 && (
        <p className="mt-2 text-[11px] text-foreground-500">
          No hay existencias disponibles. Registre la entrada del repuesto comprado en Inventario.
        </p>
      )}
    </form>
  );
}
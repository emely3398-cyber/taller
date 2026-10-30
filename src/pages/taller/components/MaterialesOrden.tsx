import { useMemo, useState, type FormEvent } from "react";
import { btn } from "@/components/base/buttonStyles";
import Field from "@/components/base/Field";
import { useProductos } from "@/lib/inventarioStore";
import { registrarMaterialOrden } from "@/lib/ordenesStore";
import { useSesion } from "@/lib/sesionStore";
import type { EstadoMaterialOrden, OrdenServicio } from "@/types/admin";

const ESTADOS_SOLICITUD: EstadoMaterialOrden[] = ["Requerido", "Pendiente"];

type Props = {
  orden: OrdenServicio;
};

export default function MaterialesOrden({ orden }: Props) {
  const productos = useProductos();
  const sesion = useSesion();
  const esMecanico = sesion?.tipo === "Mecánico";

  const [busqueda, setBusqueda] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [estado, setEstado] = useState<EstadoMaterialOrden>("Requerido");
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [avisoEscanner, setAvisoEscanner] = useState(false);

  const producto = productos.find((item) => item.codigo === codigo);

  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return [];
    return productos
      .filter((item) =>
        [
          item.nombre,
          item.codigo,
          item.codigoBarras,
          item.marca,
          item.marcaMoto,
          item.modeloMoto,
          item.anioCompatible,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(texto),
      )
      .slice(0, 8);
  }, [productos, busqueda]);

  const seleccionar = (codigoProducto: string) => {
    const encontrado = productos.find((item) => item.codigo === codigoProducto);
    setCodigo(codigoProducto);
    setEstado(encontrado && encontrado.existencia > 0 ? "Requerido" : "Pendiente");
    setError("");
    setAviso("");
  };

  const limpiarSeleccion = () => {
    setCodigo("");
    setBusqueda("");
    setError("");
    setAviso("");
  };

  const agregar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAviso("");
    if (!producto) {
      setError("Busque y seleccione un repuesto de la lista de resultados.");
      return;
    }
    const numero = Number(cantidad);
    if (!numero || numero <= 0) {
      setError("Indique una cantidad mayor a cero.");
      return;
    }
    registrarMaterialOrden(orden.id, {
      codigo: producto.codigo,
      nombre: producto.nombre,
      cantidad: numero,
      estado,
      registradoPor: sesion?.nombre || orden.mecanico,
      observacion: observacion.trim() || undefined,
    });
    setError("");
    setAviso(
      `${numero} × ${producto.nombre} registrado como ${estado.toLowerCase()}. El inventario no se descuenta hasta confirmar el despacho.`,
    );
    setCantidad("1");
    setObservacion("");
    setCodigo("");
    setBusqueda("");
  };

  return (
    <div>
      <form onSubmit={agregar} className="px-3 py-2.5">
        <p className="mb-2 text-[11px] uppercase tracking-[0.04em] text-foreground-500">
          Registrar material o repuesto en esta orden
        </p>

        <Field label="Buscar repuesto" htmlFor={`material-buscar-${orden.id}`}>
          <div className="relative">
            <i
              className="ri-search-line pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[13px] leading-none text-foreground-500"
              aria-hidden="true"
            />
            <input
              id={`material-buscar-${orden.id}`}
              type="search"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setCodigo("");
                setError("");
              }}
              placeholder="Nombre, código, marca o modelo compatible"
              autoComplete="off"
              className="admin-field pl-7 pr-9 text-[13px]"
            />
            <button
              type="button"
              onClick={() => setAvisoEscanner((prev) => !prev)}
              onBlur={() => setAvisoEscanner(false)}
              aria-label="Escanear código de barras"
              title="Próximamente"
              className="group absolute right-0.5 top-1/2 flex h-[26px] w-[26px] -translate-y-1/2 cursor-pointer items-center justify-center border border-background-800 text-foreground-400 hover:bg-background-200 hover:text-foreground-100"
            >
              <i
                className="ri-scan-2-line flex h-4 w-4 items-center justify-center text-[14px] leading-none"
                aria-hidden="true"
              />
              <span className="pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap border border-background-800 bg-background-950 px-1.5 py-0.5 text-[10px] text-foreground-300 opacity-0 group-hover:opacity-100">
                Próximamente
              </span>
            </button>
          </div>
        </Field>

        {avisoEscanner && (
          <p className="mt-1 border border-background-800 bg-background-100 px-2 py-1 text-[11px] text-foreground-400">
            Lectura de código de barras: próximamente. Por ahora busque el repuesto por texto.
          </p>
        )}

        {!producto && busqueda.trim() !== "" && (
          <ul className="mt-1 max-h-56 divide-y divide-background-700 overflow-y-auto border border-background-800">
            {resultados.length === 0 && (
              <li className="px-2 py-2 text-[11px] text-foreground-500">
                No se encontraron repuestos con ese criterio.
              </li>
            )}
            {resultados.map((item) => (
              <li key={item.codigo}>
                <button
                  type="button"
                  onClick={() => seleccionar(item.codigo)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-2 py-1.5 text-left hover:bg-background-100"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] text-foreground-100">
                      {item.nombre}
                    </span>
                    <span className="block font-mono text-[10px] text-foreground-500">
                      {item.codigo}
                      {item.marcaMoto || item.modeloMoto
                        ? ` · ${[item.marcaMoto, item.modeloMoto].filter(Boolean).join(" ")}`
                        : ""}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 whitespace-nowrap font-mono text-[11px] ${
                      item.existencia > 0 ? "text-foreground-300" : "text-accent-800"
                    }`}
                  >
                    {item.existencia} disp.
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {producto && (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border border-primary-200 bg-primary-50 px-2 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-[12px] text-primary-800">{producto.nombre}</p>
              <p className="font-mono text-[10px] text-primary-700">
                {producto.codigo} · {producto.existencia} disponibles
              </p>
            </div>
            <button
              type="button"
              onClick={limpiarSeleccion}
              className="shrink-0 cursor-pointer border border-primary-300 bg-background-50 px-2 py-0.5 text-[11px] text-primary-700 hover:bg-background-100"
            >
              Cambiar
            </button>
          </div>
        )}

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="Cantidad" htmlFor={`material-cantidad-${orden.id}`}>
            <input
              id={`material-cantidad-${orden.id}`}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              inputMode="numeric"
              className="admin-field font-mono"
            />
          </Field>
          <Field label="Situación del material" htmlFor={`material-estado-${orden.id}`}>
            <select
              id={`material-estado-${orden.id}`}
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoMaterialOrden)}
              className="admin-field"
            >
              {ESTADOS_SOLICITUD.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Observación"
            htmlFor={`material-observacion-${orden.id}`}
            className="sm:col-span-2"
          >
            <input
              id={`material-observacion-${orden.id}`}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              maxLength={200}
              placeholder="Ej. Se necesita para el armado del motor"
              className="admin-field"
            />
          </Field>
        </div>

        {producto && (
          <p className="mt-1 text-[11px] text-foreground-500">
            Compatibilidad{" "}
            {[producto.marcaMoto, producto.modeloMoto].filter(Boolean).join(" ") || "General"}
            {producto.anioCompatible ? ` · ${producto.anioCompatible}` : ""}
            {!esMecanico && ` · Precio por menor Q ${producto.precioMenor.toFixed(2)}`}
          </p>
        )}

        <button type="submit" className={`${btn("secondary")} mt-2`}>
          <i className="ri-add-line text-[13px] leading-none" aria-hidden="true" />
          Registrar material
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
      </form>
    </div>
  );
}
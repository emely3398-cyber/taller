import { useState, type ChangeEvent, type FormEvent } from "react";
import { btn } from "@/components/base/buttonStyles";
import Field from "@/components/base/Field";
import PhotoViewer from "@/components/base/PhotoViewer";
import { leerArchivosComoDataUrl } from "@/lib/imagenes";
import { SIN_ASIGNAR } from "@/lib/taller";
import { registrarCambioOrden } from "@/lib/ordenesStore";
import { useMecanicos } from "@/lib/mecanicosStore";
import { useSesion } from "@/lib/sesionStore";
import type { EstadoOrden, FotoOrden, OrdenServicio } from "@/types/admin";

type Props = {
  orden: OrdenServicio;
  cotizacionAprobada?: boolean;
  onRegistrado?: () => void;
};

const ESTADOS_MECANICO: EstadoOrden[] = [
  "En diagnóstico",
  "En reparación",
  "En espera de repuesto",
  "Reparación finalizada",
];

const ESTADOS_ADMIN: EstadoOrden[] = [
  ...ESTADOS_MECANICO,
  "Entregada",
  "Servicio cancelado",
];

export default function CambioEstadoForm({ orden, cotizacionAprobada = false, onRegistrado }: Props) {
  const mecanicos = useMecanicos();
  const sesion = useSesion();
  const esMecanico = sesion?.tipo === "Mecánico";

  const puedeReparar =
    cotizacionAprobada || orden.estado === "En reparación" || orden.estado === "En espera de repuesto";

  const estadosPermitidos = (esMecanico ? ESTADOS_MECANICO : ESTADOS_ADMIN).filter(
    (item) => item !== "En reparación" || puedeReparar,
  );

  const estadoInicial = (): EstadoOrden => {
    if (estadosPermitidos.includes(orden.estado)) return orden.estado;
    if (orden.estado === "Cotizada" && estadosPermitidos.includes("En reparación")) {
      return "En reparación";
    }
    return estadosPermitidos[0];
  };

  const [estado, setEstado] = useState<EstadoOrden>(estadoInicial);
  const [observacion, setObservacion] = useState("");
  const [mecanico, setMecanico] = useState(esMecanico ? sesion.nombre : orden.mecanico);
  const [repuestoFaltante, setRepuestoFaltante] = useState(orden.repuestoFaltante || "");
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [fotos, setFotos] = useState<FotoOrden[]>([]);
  const [indiceVisor, setIndiceVisor] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const opcionesMecanico = Array.from(
    new Set([
      ...mecanicos.filter((item) => item.activo).map((item) => item.nombre),
      orden.mecanico,
      SIN_ASIGNAR,
    ]),
  );

  const agregarFotos = (origen: FotoOrden["origen"]) => async (event: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(event.target.files || []);
    event.target.value = "";
    if (archivos.length === 0) return;
    const nuevas = await leerArchivosComoDataUrl(archivos);
    setFotos((prev) => [
      ...prev,
      ...nuevas.map((archivo) => ({ nombre: archivo.nombre, url: archivo.url, origen })),
    ]);
    setError("");
  };

  const quitarFoto = (url: string) => {
    setFotos((prev) => prev.filter((foto) => foto.url !== url));
  };

  const enviar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAviso("");

    if (!observacion.trim()) {
      setError("Registre las observaciones del avance para la trazabilidad.");
      return;
    }
    if (estado === "En espera de repuesto" && !repuestoFaltante.trim()) {
      setError("Indique cuál es la pieza o repuesto que falta.");
      return;
    }
    if (estado === "Servicio cancelado" && !motivoCancelacion.trim()) {
      setError("Indique el motivo por el que no puede realizarse el servicio.");
      return;
    }

    setError("");
    registrarCambioOrden(orden.id, {
      estadoNuevo: estado,
      observacion: observacion.trim(),
      mecanico,
      fotos,
      repuestoFaltante: repuestoFaltante.trim() || undefined,
      motivoCancelacion: motivoCancelacion.trim() || undefined,
    });
    setObservacion("");
    setMotivoCancelacion("");
    setFotos([]);
    setAviso(`Movimiento registrado. Estado actual: ${estado}.`);
    onRegistrado?.();
  };

  const seleccionadas = fotos.filter((foto) => foto.origen !== "camara").length;
  const tomadas = fotos.filter((foto) => foto.origen === "camara").length;

  return (
    <form onSubmit={enviar}>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Field label="Nuevo estado" htmlFor={`estado-orden-${orden.id}`}>
          <select
            id={`estado-orden-${orden.id}`}
            className="admin-field"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value as EstadoOrden);
              setError("");
              setAviso("");
            }}
          >
            {estadosPermitidos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Mecánico responsable"
          htmlFor={`mecanico-cambio-${orden.id}`}
        >
          <select
            id={`mecanico-cambio-${orden.id}`}
            className="admin-field"
            value={mecanico}
            disabled={esMecanico}
            onChange={(e) => setMecanico(e.target.value)}
          >
            {opcionesMecanico.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>

        {estado === "En espera de repuesto" && (
          <Field
            label="Pieza o repuesto faltante"
            htmlFor={`repuesto-faltante-${orden.id}`}
            required
            className="sm:col-span-2"
          >
            <input
              id={`repuesto-faltante-${orden.id}`}
              className="admin-field"
              value={repuestoFaltante}
              onChange={(e) => setRepuestoFaltante(e.target.value)}
              placeholder="Ej. Kit de cilindro y pistón Suzuki GN125 (REP-6002)"
            />
          </Field>
        )}

        {estado === "Servicio cancelado" && (
          <Field
            label="Motivo de la cancelación"
            htmlFor={`motivo-cancelacion-${orden.id}`}
            required
            className="sm:col-span-2"
          >
            <textarea
              id={`motivo-cancelacion-${orden.id}`}
              rows={2}
              maxLength={300}
              className="admin-field resize-y"
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              placeholder="No se consigue el repuesto y el servicio no puede realizarse"
            />
          </Field>
        )}

        <Field
          label="Observaciones del avance"
          htmlFor={`observacion-cambio-${orden.id}`}
          required
          className="sm:col-span-2"
        >
          <textarea
            id={`observacion-cambio-${orden.id}`}
            rows={3}
            maxLength={500}
            className="admin-field resize-y"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Ej. Se desmontó la culata y se confirma desgaste del pistón"
          />
        </Field>

        <div className="sm:col-span-2">
          <p className="mb-1 block text-[11px] font-medium uppercase tracking-[0.04em] text-foreground-400">
            Fotografías del avance
            <span className="ml-1 normal-case text-foreground-500">(opcional, sin límite)</span>
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`fotos-avance-${orden.id}`}
                className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
              >
                Seleccionar imágenes
              </label>
              <input
                id={`fotos-avance-${orden.id}`}
                type="file"
                accept="image/*"
                multiple
                onChange={agregarFotos("archivo")}
                className="admin-field cursor-pointer file:mr-2 file:cursor-pointer file:border-0 file:bg-background-200 file:px-2 file:py-0.5 file:text-[11px] file:text-foreground-200"
              />
            </div>
            <div>
              <label
                htmlFor={`fotos-avance-camara-${orden.id}`}
                className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
              >
                Tomar fotografía
              </label>
              <input
                id={`fotos-avance-camara-${orden.id}`}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={agregarFotos("camara")}
                className="admin-field cursor-pointer file:mr-2 file:cursor-pointer file:border-0 file:bg-background-200 file:px-2 file:py-0.5 file:text-[11px] file:text-foreground-200"
              />
            </div>
          </div>
        </div>
      </div>

      {fotos.length > 0 && (
        <div className="mt-2 border-t border-background-800 pt-2">
          <p className="text-[11px] text-foreground-500">
            {seleccionadas > 0 &&
              `${seleccionadas} ${seleccionadas === 1 ? "imagen seleccionada" : "imágenes seleccionadas"}`}
            {seleccionadas > 0 && tomadas > 0 && " · "}
            {tomadas > 0 && `${tomadas} ${tomadas === 1 ? "fotografía tomada" : "fotografías tomadas"}`}
            {" · "}
            {fotos.length} {fotos.length === 1 ? "fotografía registrada" : "fotografías registradas"}
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {fotos.map((foto, indice) => (
              <li key={`${indice}-${foto.nombre}`} className="border border-background-800 bg-background-100 p-1">
                <button
                  type="button"
                  onClick={() => setIndiceVisor(indice)}
                  aria-label={`Ampliar ${foto.nombre}`}
                  className="group relative block h-16 w-24 cursor-pointer overflow-hidden bg-background-200"
                >
                  <img
                    src={foto.url}
                    alt={foto.nombre}
                    title={foto.nombre}
                    className="h-full w-full object-cover object-top"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                    <i
                      className="ri-zoom-in-line text-[14px] leading-none text-white opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => quitarFoto(foto.url)}
                  className="mt-1 w-full cursor-pointer text-[10px] text-foreground-500 hover:text-accent-700"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit" className={`${btn("primary")} mt-2.5 w-full`}>
        <i className="ri-check-line text-[13px] leading-none" aria-hidden="true" />
        Registrar movimiento
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

      {indiceVisor !== null && fotos.length > 0 && (
        <PhotoViewer
          fotos={fotos.map((foto) => ({ url: foto.url, nombre: foto.nombre }))}
          indiceInicial={indiceVisor}
          titulo={`Avance ${orden.id} · ${orden.marca} ${orden.modelo}`}
          onClose={() => setIndiceVisor(null)}
        />
      )}
    </form>
  );
}
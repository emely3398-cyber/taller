import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import Field from "@/components/base/Field";
import StatusTag from "@/components/base/StatusTag";
import { btn } from "@/components/base/buttonStyles";
import { agregarOrden, hoyISO, registrarCambioOrden, siguienteNumeroOrden } from "@/lib/ordenesStore";
import { SIN_ASIGNAR, TIPOS_ATENCION } from "@/lib/taller";
import { useMecanicos } from "@/lib/mecanicosStore";
import { useSesion } from "@/lib/sesionStore";
import { formatDate } from "@/lib/format";
import { leerArchivosComoDataUrl } from "@/lib/imagenes";
import PhotoViewer from "@/components/base/PhotoViewer";
import type { FotoOrden, OrdenServicio, TipoAtencion } from "@/types/admin";

type FormHoja = {
  fechaIngreso: string;
  fechaEntrega: string;
  tipoAtencion: TipoAtencion | "";
  propietario: string;
  telefono: string;
  marca: string;
  modelo: string;
  anio: string;
  placa: string;
  chasis: string;
  caracteristicas: string;
  falla: string;
  desdeCuando: string;
  observacionesIniciales: string;
  mecanico: string;
};

const inicial = (): FormHoja => ({
  fechaIngreso: hoyISO(),
  fechaEntrega: "",
  tipoAtencion: "",
  propietario: "",
  telefono: "",
  marca: "",
  modelo: "",
  anio: "",
  placa: "",
  chasis: "",
  caracteristicas: "",
  falla: "",
  desdeCuando: "",
  observacionesIniciales: "",
  mecanico: SIN_ASIGNAR,
});

export default function NuevaHojaPage() {
  const mecanicos = useMecanicos();
  const sesion = useSesion();
  const esMecanico = sesion?.tipo === "Mecánico";
  const mecanicoSesion = sesion?.nombre || SIN_ASIGNAR;

  const opcionesMecanico = Array.from(
    new Set([
      ...mecanicos.filter((item) => item.activo).map((item) => item.nombre),
      ...(esMecanico ? [mecanicoSesion] : []),
      SIN_ASIGNAR,
    ]),
  );
  const valoresIniciales = (): FormHoja => ({
    ...inicial(),
    mecanico: esMecanico ? mecanicoSesion : opcionesMecanico[0] || SIN_ASIGNAR,
  });

  const [numeroOrden] = useState(() => siguienteNumeroOrden());
  const [form, setForm] = useState<FormHoja>(valoresIniciales);
  const [fotos, setFotos] = useState<FotoOrden[]>([]);
  const [indiceVisor, setIndiceVisor] = useState<number | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [guardada, setGuardada] = useState<OrdenServicio | null>(null);
  const [avisoDiagnostico, setAvisoDiagnostico] = useState("");

  const set = <K extends keyof FormHoja>(campo: K, valor: FormHoja[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const agregarFotos = (origen: FotoOrden["origen"]) => async (event: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(event.target.files || []);
    event.target.value = "";
    if (archivos.length === 0) return;
    const nuevas = await leerArchivosComoDataUrl(archivos);
    setFotos((prev) => [
      ...prev,
      ...nuevas.map((archivo) => ({ nombre: archivo.nombre, url: archivo.url, origen })),
    ]);
  };

  const quitarFoto = (url: string) => {
    setFotos((prev) => prev.filter((foto) => foto.url !== url));
  };

  const seleccionadas = fotos.filter((foto) => foto.origen !== "camara").length;
  const tomadas = fotos.filter((foto) => foto.origen === "camara").length;

  const validar = () => {
    const faltantes: string[] = [];
    if (!form.fechaIngreso) faltantes.push("Fecha de recepción");
    if (!form.fechaEntrega) faltantes.push("Fecha estimada de entrega");
    if (!form.tipoAtencion) faltantes.push("Tipo de atención");
    if (!form.propietario.trim()) faltantes.push("Nombre completo del propietario");
    if (!form.telefono.trim()) faltantes.push("Número de teléfono");
    if (!form.marca.trim()) faltantes.push("Marca de la motocicleta");
    if (!form.modelo.trim()) faltantes.push("Modelo de la motocicleta");
    if (!form.placa.trim()) faltantes.push("Número de placa");
    if (!form.falla.trim()) faltantes.push("Descripción de la falla reportada");
    return faltantes;
  };

  const guardar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const faltantes = validar();
    setErrores(faltantes);
    if (faltantes.length > 0) return;

    const orden: OrdenServicio = {
      id: numeroOrden,
      fechaIngreso: form.fechaIngreso,
      fechaEntrega: form.fechaEntrega,
      tipoAtencion: form.tipoAtencion || undefined,
      propietario: form.propietario.trim(),
      telefono: form.telefono.trim(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      anio: form.anio.trim(),
      placa: form.placa.trim().toUpperCase(),
      chasis: form.chasis.trim(),
      caracteristicas: form.caracteristicas.trim(),
      fotos,
      falla: form.falla.trim(),
      desdeCuando: form.desdeCuando.trim(),
      observacionesIniciales: form.observacionesIniciales.trim(),
      trabajoARealizar: "",
      trabajoRealizado: "",
      mecanico: esMecanico ? mecanicoSesion : form.mecanico,
      estado: "Recibida",
      materiales: [],
      repuestosDespachados: [],
      seguimiento: [
        {
          fecha: form.fechaIngreso,
          estadoAnterior: null,
          estadoNuevo: "Recibida",
          observacion: "Recepción de la motocicleta registrada en el taller.",
          mecanico: esMecanico ? mecanicoSesion : form.mecanico,
          fotos: [],
        },
      ],
    };

    agregarOrden(orden);
    setGuardada(orden);
    setAvisoDiagnostico("");
    window.scrollTo({ top: 0 });
  };

  const iniciarDiagnostico = () => {
    if (!guardada || guardada.estado !== "Recibida") return;
    registrarCambioOrden(guardada.id, {
      estadoNuevo: "En diagnóstico",
      observacion: "La motocicleta pasa a revisión técnica para completar el diagnóstico.",
      mecanico: guardada.mecanico,
    });
    setGuardada({ ...guardada, estado: "En diagnóstico" });
    setAvisoDiagnostico("Etapa En diagnóstico iniciada. La recepción se conserva en el historial.");
  };

  if (guardada) {
    return (
      <div>
        <PageHeader
          title="Nueva hoja de servicio"
          subtitle="Registro de ingreso de motocicleta al taller."
        />
        <Panel
          title={`Hoja de servicio ${guardada.id} registrada`}
          actions={<StatusTag label={guardada.estado} />}
        >
          <p className="text-[13px] text-foreground-100">
            La orden quedó registrada para{" "}
            <span className="font-medium">{guardada.propietario}</span> · {guardada.marca}{" "}
            {guardada.modelo} · Placa <span className="font-mono">{guardada.placa}</span>.
          </p>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-background-800 pt-3 text-[12px] sm:grid-cols-2">
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-500">Número de orden</dt>
              <dd className="font-mono text-foreground-200">{guardada.id}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-500">Mecánico asignado</dt>
              <dd className="text-foreground-200">{guardada.mecanico}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-500">Tipo de atención</dt>
              <dd className="text-foreground-200">{guardada.tipoAtencion || "Sin especificar"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-500">Recepción</dt>
              <dd className="font-mono text-foreground-200">{formatDate(guardada.fechaIngreso)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-500">Entrega estimada</dt>
              <dd className="font-mono text-foreground-200">{formatDate(guardada.fechaEntrega)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-foreground-500">Fotografías</dt>
              <dd className="text-foreground-200">{guardada.fotos.length}</dd>
            </div>
          </dl>

          <p className="mt-3 border-t border-background-800 pt-3 text-[11px] leading-relaxed text-foreground-500">
            La recepción solo registra los datos del propietario, la motocicleta y la falla
            reportada. El diagnóstico se completa después, en la etapa <strong>En diagnóstico</strong>.
          </p>

          {guardada.estado === "Recibida" && (
            <div className="mt-3 border-t border-background-800 pt-3">
              <button type="button" onClick={iniciarDiagnostico} className={btn("secondary")}>
                <i className="ri-file-search-line text-[13px] leading-none" aria-hidden="true" />
                Iniciar etapa En diagnóstico
              </button>
              <p className="mt-1 text-[11px] text-foreground-500">
                Se registra un movimiento adicional sin borrar la recepción.
              </p>
            </div>
          )}

          {avisoDiagnostico && (
            <p className="mt-2 border border-primary-200 bg-primary-50 px-2 py-1.5 text-[11px] text-primary-800">
              {avisoDiagnostico}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Link to={`/taller/${guardada.id}`} className={btn("primary")}>
              <i className="ri-eye-line text-[13px] leading-none" aria-hidden="true" />
              Ver detalle de la orden
            </Link>
            {!esMecanico && (
              <Link to={`/cotizaciones/nueva?orden=${guardada.id}`} className={btn("secondary")}>
                <i className="ri-file-list-3-line text-[13px] leading-none" aria-hidden="true" />
                Crear cotización vinculada
              </Link>
            )}
            <Link
              to={esMecanico ? "/taller/mis-ordenes" : "/taller"}
              className={btn("secondary")}
            >
              {esMecanico ? "Ir a mis órdenes" : "Ir al listado de órdenes"}
            </Link>
            <button
              type="button"
              className={btn("ghost")}
              onClick={() => {
                setForm(valoresIniciales());
                setFotos([]);
                setErrores([]);
                setGuardada(null);
                setAvisoDiagnostico("");
              }}
            >
              Registrar otra hoja
            </button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Nueva hoja de servicio"
        actions={
          <Link
            to={esMecanico ? "/taller/mis-ordenes" : "/taller"}
            className={btn("secondary")}
          >
            <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
            {esMecanico ? "Mis órdenes" : "Volver al listado"}
          </Link>
        }
      />

      <form onSubmit={guardar} noValidate>
        <div className="space-y-3">
          <Panel title="A. Información de recepción">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Número de orden"
                htmlFor="numeroOrden"
                hint="Generado automáticamente por el sistema."
              >
                <input
                  id="numeroOrden"
                  name="numeroOrden"
                  readOnly
                  className="admin-field font-mono text-foreground-300"
                  value={numeroOrden}
                />
              </Field>
              <Field label="Fecha de recepción" htmlFor="fechaIngreso" required>
                <input
                  id="fechaIngreso"
                  name="fechaIngreso"
                  type="date"
                  className="admin-field"
                  value={form.fechaIngreso}
                  onChange={(e) => set("fechaIngreso", e.target.value)}
                />
              </Field>
              <Field label="Fecha estimada de entrega" htmlFor="fechaEntrega" required>
                <input
                  id="fechaEntrega"
                  name="fechaEntrega"
                  type="date"
                  className="admin-field"
                  value={form.fechaEntrega}
                  onChange={(e) => set("fechaEntrega", e.target.value)}
                />
              </Field>
              <Field
                label="Tipo de atención"
                htmlFor="tipoAtencion"
                required
                hint="Motivo general de la visita. Se puede ajustar en el diagnóstico."
              >
                <select
                  id="tipoAtencion"
                  name="tipoAtencion"
                  className="admin-field"
                  value={form.tipoAtencion}
                  onChange={(e) => set("tipoAtencion", e.target.value as TipoAtencion | "")}
                >
                  <option value="">Seleccione el tipo de atención</option>
                  {TIPOS_ATENCION.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Panel>

          <Panel title="B. Datos del propietario">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nombre completo" htmlFor="propietario" required>
                <input
                  id="propietario"
                  name="propietario"
                  className="admin-field"
                  value={form.propietario}
                  onChange={(e) => set("propietario", e.target.value)}
                  placeholder="Nombre y apellidos del propietario"
                />
              </Field>
              <Field label="Número de teléfono" htmlFor="telefono" required>
                <input
                  id="telefono"
                  name="telefono"
                  className="admin-field font-mono"
                  value={form.telefono}
                  onChange={(e) => set("telefono", e.target.value)}
                  placeholder="5512 4783"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="C. Datos de la motocicleta">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Marca" htmlFor="marca" required>
                <input
                  id="marca"
                  name="marca"
                  className="admin-field"
                  value={form.marca}
                  onChange={(e) => set("marca", e.target.value)}
                  placeholder="Suzuki"
                />
              </Field>
              <Field label="Modelo" htmlFor="modelo" required>
                <input
                  id="modelo"
                  name="modelo"
                  className="admin-field"
                  value={form.modelo}
                  onChange={(e) => set("modelo", e.target.value)}
                  placeholder="GN125"
                />
              </Field>
              <Field label="Año" htmlFor="anio">
                <input
                  id="anio"
                  name="anio"
                  className="admin-field font-mono"
                  value={form.anio}
                  onChange={(e) => set("anio", e.target.value)}
                  placeholder="2019"
                />
              </Field>
              <Field label="Número de placa" htmlFor="placa" required>
                <input
                  id="placa"
                  name="placa"
                  className="admin-field font-mono"
                  value={form.placa}
                  onChange={(e) => set("placa", e.target.value)}
                  placeholder="M-482ABC"
                />
              </Field>
              <Field label="Número de chasis" htmlFor="chasis" className="sm:col-span-2">
                <input
                  id="chasis"
                  name="chasis"
                  className="admin-field font-mono"
                  value={form.chasis}
                  onChange={(e) => set("chasis", e.target.value)}
                  placeholder="LC6PCKD482ABC00147"
                />
              </Field>
              <Field
                label="Características de la motocicleta"
                htmlFor="caracteristicas"
                className="sm:col-span-2"
              >
                <textarea
                  id="caracteristicas"
                  name="caracteristicas"
                  rows={2}
                  maxLength={300}
                  className="admin-field resize-y"
                  value={form.caracteristicas}
                  onChange={(e) => set("caracteristicas", e.target.value)}
                  placeholder="Color, accesorios instalados"
                />
              </Field>
              <div className="sm:col-span-2 lg:col-span-4">
                <p className="mb-1 block text-[11px] font-medium text-foreground-300">
                  Fotografías de recepción
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="fotos"
                      className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                    >
                      Seleccionar imágenes
                    </label>
                    <input
                      id="fotos"
                      name="fotos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={agregarFotos("archivo")}
                      className="admin-field cursor-pointer file:mr-2 file:cursor-pointer file:border-0 file:bg-background-200 file:px-2 file:py-0.5 file:text-[11px] file:text-foreground-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="fotos-camara"
                      className="mb-1 block text-[10px] uppercase tracking-[0.04em] text-foreground-500"
                    >
                      Tomar fotografía
                    </label>
                    <input
                      id="fotos-camara"
                      name="fotos-camara"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={agregarFotos("camara")}
                      className="admin-field cursor-pointer file:mr-2 file:cursor-pointer file:border-0 file:bg-background-200 file:px-2 file:py-0.5 file:text-[11px] file:text-foreground-200"
                    />
                  </div>
                </div>
                {fotos.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-foreground-500">
                    {seleccionadas > 0 &&
                      `${seleccionadas} ${seleccionadas === 1 ? "imagen seleccionada" : "imágenes seleccionadas"}`}
                    {seleccionadas > 0 && tomadas > 0 && " · "}
                    {tomadas > 0 &&
                      `${tomadas} ${tomadas === 1 ? "fotografía tomada" : "fotografías tomadas"}`}
                    {" · "}
                    {fotos.length}{" "}
                    {fotos.length === 1 ? "fotografía registrada" : "fotografías registradas"}
                  </p>
                )}
              </div>
            </div>

            {fotos.length > 0 && (
              <ul className="mt-2 grid grid-cols-2 gap-2 border-t border-background-800 pt-2 sm:grid-cols-3 lg:grid-cols-5">
                {fotos.map((foto, indice) => (
                  <li
                    key={`${indice}-${foto.nombre}`}
                    className="border border-background-700 bg-background-950 p-1"
                  >
                    <button
                      type="button"
                      onClick={() => setIndiceVisor(indice)}
                      aria-label={`Ampliar ${foto.nombre}`}
                      className="group relative block h-20 w-full cursor-pointer overflow-hidden bg-background-900"
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
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <span className="truncate text-[10px] text-foreground-500">{foto.nombre}</span>
                      <button
                        type="button"
                        onClick={() => quitarFoto(foto.url)}
                        aria-label={`Quitar ${foto.nombre}`}
                        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border border-background-700 text-foreground-400 hover:bg-background-800 hover:text-foreground-50"
                      >
                        <i className="ri-close-line text-[11px] leading-none" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="D. Falla reportada">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <Field label="Descripción de la falla" htmlFor="falla" required>
                <textarea
                  id="falla"
                  name="falla"
                  rows={3}
                  maxLength={500}
                  className="admin-field resize-y"
                  value={form.falla}
                  onChange={(e) => set("falla", e.target.value)}
                  placeholder="Falla indicada por el propietario"
                />
              </Field>
              <Field label="Desde cuándo presenta el problema" htmlFor="desdeCuando">
                <textarea
                  id="desdeCuando"
                  name="desdeCuando"
                  rows={3}
                  maxLength={200}
                  className="admin-field resize-y"
                  value={form.desdeCuando}
                  onChange={(e) => set("desdeCuando", e.target.value)}
                  placeholder="Ej. Hace 2 semanas"
                />
              </Field>
              <Field label="Observaciones iniciales" htmlFor="observacionesIniciales">
                <textarea
                  id="observacionesIniciales"
                  name="observacionesIniciales"
                  rows={3}
                  maxLength={500}
                  className="admin-field resize-y"
                  value={form.observacionesIniciales}
                  onChange={(e) => set("observacionesIniciales", e.target.value)}
                  placeholder="Indicaciones del propietario"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="E. Mecánico asignado">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Field label="Mecánico asignado" htmlFor="mecanico">
                <select
                  id="mecanico"
                  name="mecanico"
                  className="admin-field"
                  value={esMecanico ? mecanicoSesion : form.mecanico}
                  disabled={esMecanico}
                  onChange={(e) => set("mecanico", e.target.value)}
                >
                  {opcionesMecanico.map((mecanico) => (
                    <option key={mecanico} value={mecanico}>
                      {mecanico}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estado de la hoja" htmlFor="estado">
                <input
                  id="estado"
                  name="estado"
                  readOnly
                  className="admin-field font-medium text-foreground-300"
                  value="Recibida"
                />
              </Field>
            </div>
          </Panel>

          {errores.length > 0 && (
            <div className="border border-accent-700 bg-background-900 px-3 py-2 text-[12px] text-foreground-100">
              <p className="font-medium">Complete los campos obligatorios:</p>
              <ul className="mt-1 list-inside list-disc text-foreground-400">
                {errores.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <Panel title="F. Acciones">
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className={btn("primary")}>
                <i className="ri-save-line text-[13px] leading-none" aria-hidden="true" />
                Guardar hoja de servicio
              </button>
              <Link
                to={esMecanico ? "/taller/mis-ordenes" : "/taller"}
                className={btn("secondary")}
              >
                Cancelar
              </Link>
              {!esMecanico && (
                <button
                  type="button"
                  disabled
                  title="Guarde la hoja de servicio para crear la cotización vinculada"
                  className={`${btn("secondary")} cursor-not-allowed opacity-50`}
                >
                  <i className="ri-file-list-3-line text-[13px] leading-none" aria-hidden="true" />
                  Crear cotización vinculada
                </button>
              )}
              <button
                type="button"
                disabled
                title="Guarde la hoja de servicio para consultar el detalle"
                className={`${btn("secondary")} cursor-not-allowed opacity-50`}
              >
                <i className="ri-eye-line text-[13px] leading-none" aria-hidden="true" />
                Ver detalle de la orden
              </button>
            </div>
          </Panel>
        </div>
      </form>

      {indiceVisor !== null && fotos.length > 0 && (
        <PhotoViewer
          fotos={fotos.map((foto) => ({ url: foto.url, nombre: foto.nombre }))}
          indiceInicial={indiceVisor}
          titulo={`Recepción ${numeroOrden}`}
          onClose={() => setIndiceVisor(null)}
        />
      )}
    </div>
  );
}
import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import Field from "@/components/base/Field";
import { btn } from "@/components/base/buttonStyles";
import {
  guardarMecanico,
  obtenerMecanico,
  siguienteCodigoMecanico,
  useMecanicos,
} from "@/lib/mecanicosStore";
import type { Mecanico } from "@/types/admin";
import { renombrarMecanico } from "@/lib/ordenesStore";

export default function MecanicoFormPage() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const mecanicos = useMecanicos();
  const existente = codigo ? obtenerMecanico(codigo) : undefined;
  const esEdicion = Boolean(codigo);

  const codigoMecanico = useMemo(
    () => existente?.codigo || siguienteCodigoMecanico(),
    [existente],
  );

  const [form, setForm] = useState({
    nombre: existente?.nombre || "",
    telefono: existente?.telefono || "",
    usuario: existente?.usuario || "",
    contrasena: existente?.contrasena || "",
    activo: existente?.activo ?? true,
  });
  const [errores, setErrores] = useState<string[]>([]);

  if (esEdicion && !existente) {
    return (
      <div>
        <PageHeader title="Mecánico" subtitle="El registro solicitado no está disponible." />
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

  const guardar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const faltantes: string[] = [];
    if (!form.nombre.trim()) faltantes.push("Nombre completo");
    if (!form.telefono.trim()) faltantes.push("Teléfono");
    if (!form.usuario.trim()) faltantes.push("Usuario");
    if (!form.contrasena.trim()) faltantes.push("Contraseña");
    if (form.contrasena.trim() && form.contrasena.trim().length < 4) {
      faltantes.push("La contraseña debe tener al menos 4 caracteres");
    }

    const usuarioRepetido = mecanicos.some(
      (item) =>
        item.usuario.toLowerCase() === form.usuario.trim().toLowerCase() &&
        item.codigo !== codigoMecanico,
    );
    if (usuarioRepetido) faltantes.push("El usuario ya está asignado a otro mecánico");

    setErrores(faltantes);
    if (faltantes.length > 0) return;

    const mecanico: Mecanico = {
      codigo: codigoMecanico,
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim(),
      usuario: form.usuario.trim().toLowerCase(),
      contrasena: form.contrasena.trim(),
      activo: form.activo,
    };
    guardarMecanico(mecanico);
    if (existente && existente.nombre !== mecanico.nombre) {
      renombrarMecanico(existente.nombre, mecanico.nombre);
    }
    navigate(`/taller/mecanicos/${mecanico.codigo}`);
  };

  return (
    <div>
      <PageHeader
        title={esEdicion ? `Editar mecánico ${codigoMecanico}` : "Registrar mecánico"}
        subtitle="Datos de acceso y contacto del personal técnico del taller."
        actions={
          <Link to="/taller/mecanicos" className={btn("secondary")}>
            <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
            Volver al listado
          </Link>
        }
      />

      <form onSubmit={guardar} noValidate>
        <Panel title="Datos del mecánico">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nombre completo" htmlFor="mecanico-nombre" required>
              <input
                id="mecanico-nombre"
                className="admin-field"
                value={form.nombre}
                onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Carlos López"
              />
            </Field>
            <Field label="Teléfono" htmlFor="mecanico-telefono" required>
              <input
                id="mecanico-telefono"
                className="admin-field font-mono"
                value={form.telefono}
                onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
                placeholder="5789 1120"
              />
            </Field>
            <Field
              label="Código de mecánico"
              htmlFor="mecanico-codigo"
              hint="Generado automáticamente por el sistema."
            >
              <input
                id="mecanico-codigo"
                readOnly
                className="admin-field font-mono text-foreground-300"
                value={codigoMecanico}
              />
            </Field>
            <Field label="Estado" htmlFor="mecanico-estado">
              <select
                id="mecanico-estado"
                className="admin-field"
                value={form.activo ? "activo" : "inactivo"}
                onChange={(e) => setForm((prev) => ({ ...prev, activo: e.target.value === "activo" }))}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
            <Field
              label="Usuario"
              htmlFor="mecanico-usuario"
              required
              hint="Se usa para iniciar sesión. Sin espacios ni mayúsculas."
            >
              <input
                id="mecanico-usuario"
                className="admin-field font-mono"
                value={form.usuario}
                onChange={(e) => setForm((prev) => ({ ...prev, usuario: e.target.value }))}
                placeholder="clopez"
                autoComplete="off"
              />
            </Field>
            <Field label="Contraseña" htmlFor="mecanico-contrasena" required>
              <input
                id="mecanico-contrasena"
                className="admin-field font-mono"
                value={form.contrasena}
                onChange={(e) => setForm((prev) => ({ ...prev, contrasena: e.target.value }))}
                placeholder="Mínimo 4 caracteres"
                autoComplete="new-password"
              />
            </Field>
          </div>

          <p className="mt-3 border-t border-background-800 pt-2 text-[11px] leading-relaxed text-foreground-500">
            Prototipo: las contraseñas se guardan sin cifrar únicamente para demostrar el flujo de
            acceso. No se afirma que la autenticación sea segura.
          </p>

          {errores.length > 0 && (
            <div className="mt-3 border border-accent-300 bg-accent-50 px-3 py-2 text-[12px] text-accent-800">
              <p className="font-medium">Revise los siguientes datos:</p>
              <ul className="mt-1 list-inside list-disc">
                {errores.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 border-t border-background-800 pt-3">
            <button type="submit" className={btn("primary")}>
              <i className="ri-save-line text-[13px] leading-none" aria-hidden="true" />
              Guardar mecánico
            </button>
            <Link to="/taller/mecanicos" className={btn("secondary")}>
              Cancelar
            </Link>
          </div>
        </Panel>
      </form>
    </div>
  );
}
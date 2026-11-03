import { useState, type FormEvent } from "react";
import { btn } from "@/components/base/buttonStyles";
import Field from "@/components/base/Field";
import { guardarDiagnosticoOrden } from "@/lib/ordenesStore";
import { esEstadoCerrado, TIPOS_ATENCION, TIPOS_SERVICIO } from "@/lib/taller";
import { useSesion } from "@/lib/sesionStore";
import type { OrdenServicio, TipoAtencion, TipoServicio } from "@/types/admin";

type Props = {
  orden: OrdenServicio;
};

export default function DiagnosticoOrden({ orden }: Props) {
  const sesion = useSesion();
  const enEtapa = orden.estado === "En diagnóstico";
  const [editando, setEditando] = useState(enEtapa);
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico);
  const [tipoServicio, setTipoServicio] = useState<TipoServicio | "">(orden.tipoServicio || "");
  const [tipoAtencion, setTipoAtencion] = useState<TipoAtencion | "">(orden.tipoAtencion || "");
  const [trabajoRecomendado, setTrabajoRecomendado] = useState(orden.trabajoARealizar);
  const [repuestosNecesarios, setRepuestosNecesarios] = useState(orden.repuestosNecesarios || "");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const cerrada = esEstadoCerrado(orden.estado);

  const guardar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!diagnostico.trim()) {
      setError("Escriba el diagnóstico técnico antes de guardar.");
      return;
    }
    if (!tipoServicio) {
      setError("Seleccione la categoría o tipo de servicio que requiere la motocicleta.");
      return;
    }
    guardarDiagnosticoOrden(
      orden.id,
      {
        diagnostico: diagnostico.trim(),
        tipoServicio: tipoServicio as TipoServicio,
        tipoAtencion: tipoAtencion || undefined,
        trabajoARealizar: trabajoRecomendado.trim(),
        repuestosNecesarios: repuestosNecesarios.trim(),
      },
      sesion?.nombre || orden.mecanico,
    );
    setError("");
    setEditando(false);
    setAviso("Diagnóstico guardado. El cambio quedó registrado en el historial de la orden.");
  };

  if (!editando) {
    return (
      <div>
        <dl className="grid grid-cols-1 gap-3 text-[12px] sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-foreground-500">Diagnóstico técnico</dt>
            <dd className="mt-0.5 text-foreground-50">
              {orden.diagnostico || "Diagnóstico pendiente."}
            </dd>
          </div>
          <div>
            <dt className="text-foreground-500">Categoría o tipo de servicio</dt>
            <dd className="mt-0.5 text-foreground-200">{orden.tipoServicio || "Por definir."}</dd>
          </div>
          <div>
            <dt className="text-foreground-500">Tipo de atención</dt>
            <dd className="mt-0.5 text-foreground-200">{orden.tipoAtencion || "Sin especificar"}</dd>
          </div>
          <div>
            <dt className="text-foreground-500">Trabajo recomendado</dt>
            <dd className="mt-0.5 text-foreground-200">
              {orden.trabajoARealizar || "Por definir."}
            </dd>
          </div>
          <div>
            <dt className="text-foreground-500">Repuestos necesarios</dt>
            <dd className="mt-0.5 text-foreground-200">
              {orden.repuestosNecesarios || "Sin repuestos indicados."}
            </dd>
          </div>
        </dl>

        {!cerrada && (
          <button
            type="button"
            onClick={() => {
              setDiagnostico(orden.diagnostico);
              setTipoServicio(orden.tipoServicio || "");
              setTipoAtencion(orden.tipoAtencion || "");
              setTrabajoRecomendado(orden.trabajoARealizar);
              setRepuestosNecesarios(orden.repuestosNecesarios || "");
              setAviso("");
              setError("");
              setEditando(true);
            }}
            className={`${btn("secondary")} mt-2`}
          >
            <i className="ri-edit-line text-[13px] leading-none" aria-hidden="true" />
            Modificar diagnóstico
          </button>
        )}

        {aviso && <p className="mt-2 text-[11px] text-primary-700">{aviso}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={guardar}>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Field
          label="Diagnóstico técnico"
          htmlFor={`diagnostico-orden-${orden.id}`}
          required
          className="sm:col-span-2"
        >
          <textarea
            id={`diagnostico-orden-${orden.id}`}
            rows={3}
            maxLength={500}
            className="admin-field resize-y"
            value={diagnostico}
            onChange={(e) => {
              setDiagnostico(e.target.value);
              setError("");
            }}
            placeholder="Fallas encontradas y pruebas realizadas"
          />
        </Field>
        <Field
          label="Categoría o tipo de servicio"
          htmlFor={`tipo-servicio-${orden.id}`}
          required
          hint="El servicio lo define el mecánico."
        >
          <select
            id={`tipo-servicio-${orden.id}`}
            className="admin-field"
            value={tipoServicio}
            onChange={(e) => {
              setTipoServicio(e.target.value as TipoServicio | "");
              setError("");
            }}
          >
            <option value="">Seleccione el tipo de servicio</option>
            {TIPOS_SERVICIO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Trabajo recomendado" htmlFor={`trabajo-recomendado-${orden.id}`}>
          <textarea
            id={`trabajo-recomendado-${orden.id}`}
            rows={2}
            maxLength={400}
            className="admin-field resize-y"
            value={trabajoRecomendado}
            onChange={(e) => setTrabajoRecomendado(e.target.value)}
            placeholder="Ej. Cambio de kit de cilindro y pistón, ajuste de válvulas"
          />
        </Field>
        <Field label="Repuestos necesarios" htmlFor={`repuestos-necesarios-${orden.id}`}>
          <textarea
            id={`repuestos-necesarios-${orden.id}`}
            rows={2}
            maxLength={400}
            className="admin-field resize-y"
            value={repuestosNecesarios}
            onChange={(e) => setRepuestosNecesarios(e.target.value)}
            placeholder="Ej. Kit de cilindro REP-6002, empaque de culata REP-6001"
          />
        </Field>
        <Field
          label="Tipo de atención"
          htmlFor={`tipo-atencion-${orden.id}`}
          hint="Se carga el valor registrado en la recepción. Puede mantenerlo o cambiarlo."
        >
          <select
            id={`tipo-atencion-${orden.id}`}
            className="admin-field"
            value={tipoAtencion}
            onChange={(e) => setTipoAtencion(e.target.value as TipoAtencion | "")}
          >
            <option value="">Sin especificar</option>
            {TIPOS_ATENCION.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button type="submit" className={btn("primary")}>
          <i className="ri-save-line text-[13px] leading-none" aria-hidden="true" />
          Guardar diagnóstico
        </button>
        <button
          type="button"
          onClick={() => {
            setEditando(false);
            setError("");
            setAviso("");
          }}
          className={btn("secondary")}
        >
          Cancelar
        </button>
      </div>

      {error && (
        <p className="mt-2 border border-accent-300 bg-accent-50 px-2 py-1.5 text-[11px] text-accent-800">
          {error}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-foreground-500">
        El diagnóstico se completa en la etapa <strong>En diagnóstico</strong> y queda guardado en
        esta sección. No se vuelve a pedir en cada cambio de estado; cada modificación posterior
        queda en el historial.
      </p>
    </form>
  );
}
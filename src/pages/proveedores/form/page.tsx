import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import Field from "@/components/base/Field";
import { btn } from "@/components/base/buttonStyles";
import {
  guardarProveedor,
  obtenerProveedor,
  siguienteIdProveedor,
} from "@/lib/proveedoresStore";
import { useProductos, asignarProveedorAProductos } from "@/lib/inventarioStore";
import { formatMoney } from "@/lib/format";
import type { Proveedor } from "@/types/admin";

export default function ProveedorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productos = useProductos();
  const proveedorBase = id ? obtenerProveedor(id) : undefined;

  const [form, setForm] = useState({
    nombre: proveedorBase?.nombre || "",
    contacto: proveedorBase?.contacto || "",
    telefono: proveedorBase?.telefono || "",
    correo: proveedorBase?.correo || "",
    ciudad: proveedorBase?.ciudad || "",
    condiciones: proveedorBase?.condiciones || "Contado",
    ultimaCompra: proveedorBase?.ultimaCompra || "",
  });
  const [seleccionados, setSeleccionados] = useState<string[]>(
    proveedorBase
      ? productos.filter((producto) => producto.proveedorId === proveedorBase.id).map((p) => p.codigo)
      : [],
  );
  const [errores, setErrores] = useState<string[]>([]);

  const set = (campo: keyof typeof form, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const alternarProducto = (codigo: string) => {
    setSeleccionados((prev) =>
      prev.includes(codigo) ? prev.filter((item) => item !== codigo) : [...prev, codigo],
    );
  };

  const guardar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const faltantes: string[] = [];
    if (!form.nombre.trim()) faltantes.push("Nombre del proveedor");
    if (!form.telefono.trim()) faltantes.push("Teléfono");
    setErrores(faltantes);
    if (faltantes.length > 0) return;

    const proveedor: Proveedor = {
      id: proveedorBase?.id || siguienteIdProveedor(),
      nombre: form.nombre.trim(),
      contacto: form.contacto.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      ciudad: form.ciudad.trim(),
      condiciones: form.condiciones,
      ultimaCompra: form.ultimaCompra,
    };

    guardarProveedor(proveedor);
    asignarProveedorAProductos(proveedor.id, seleccionados);
    navigate("/proveedores");
  };

  return (
    <div>
      <PageHeader
        title={proveedorBase ? `Editar proveedor ${proveedorBase.id}` : "Nuevo proveedor"}
        subtitle="Datos de contacto y productos del inventario que atiende el proveedor."
        actions={
          <Link to="/proveedores" className={btn("secondary")}>
            <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
            Volver al listado
          </Link>
        }
      />

      <form onSubmit={guardar} noValidate>
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Panel title="Datos del proveedor">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nombre del proveedor" htmlFor="prov-nombre" required>
                  <input
                    id="prov-nombre"
                    className="admin-field"
                    value={form.nombre}
                    onChange={(e) => set("nombre", e.target.value)}
                    placeholder="Repuestos López"
                  />
                </Field>
                <Field label="Persona de contacto" htmlFor="prov-contacto">
                  <input
                    id="prov-contacto"
                    className="admin-field"
                    value={form.contacto}
                    onChange={(e) => set("contacto", e.target.value)}
                    placeholder="Pedro Ramírez"
                  />
                </Field>
                <Field label="Teléfono" htmlFor="prov-telefono" required>
                  <input
                    id="prov-telefono"
                    className="admin-field font-mono"
                    value={form.telefono}
                    onChange={(e) => set("telefono", e.target.value)}
                    placeholder="2458 3310"
                  />
                </Field>
                <Field label="Correo" htmlFor="prov-correo">
                  <input
                    id="prov-correo"
                    type="email"
                    className="admin-field"
                    value={form.correo}
                    onChange={(e) => set("correo", e.target.value)}
                    placeholder="ventas@repuestoslopez.gt"
                  />
                </Field>
                <Field label="Ciudad" htmlFor="prov-ciudad">
                  <input
                    id="prov-ciudad"
                    className="admin-field"
                    value={form.ciudad}
                    onChange={(e) => set("ciudad", e.target.value)}
                    placeholder="Guatemala"
                  />
                </Field>
                <Field label="Condiciones de pago" htmlFor="prov-condiciones">
                  <select
                    id="prov-condiciones"
                    className="admin-field"
                    value={form.condiciones}
                    onChange={(e) => set("condiciones", e.target.value)}
                  >
                    <option value="Contado">Contado</option>
                    <option value="Crédito 15 días">Crédito 15 días</option>
                    <option value="Crédito 30 días">Crédito 30 días</option>
                    <option value="Crédito 45 días">Crédito 45 días</option>
                  </select>
                </Field>
                <Field label="Última compra" htmlFor="prov-ultima">
                  <input
                    id="prov-ultima"
                    type="date"
                    className="admin-field"
                    value={form.ultimaCompra}
                    onChange={(e) => set("ultimaCompra", e.target.value)}
                  />
                </Field>
              </div>
            </Panel>
          </div>

          <div>
            <Panel
              title="Productos asociados"
              hint="Marca los productos que vende este proveedor."
              flush
            >
              <ul className="max-h-[420px] divide-y divide-background-700 overflow-y-auto">
                {productos.map((producto) => (
                  <li key={producto.codigo}>
                    <label className="flex cursor-pointer items-start gap-2 px-3 py-2 hover:bg-background-100">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-3.5 w-3.5 cursor-pointer"
                        checked={seleccionados.includes(producto.codigo)}
                        onChange={() => alternarProducto(producto.codigo)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] text-foreground-100">
                          {producto.nombre}
                        </span>
                        <span className="block font-mono text-[10px] text-foreground-500">
                          {producto.codigo} · {formatMoney(producto.precioMenor)} · existencia{" "}
                          {producto.existencia}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="border-t border-background-800 px-3 py-2 text-[11px] text-foreground-500">
                {seleccionados.length} productos seleccionados.
              </p>
            </Panel>
          </div>
        </div>

        {errores.length > 0 && (
          <div className="mt-3 border border-accent-300 bg-accent-50 px-3 py-2 text-[12px] text-accent-800">
            <p className="font-medium">Complete los campos obligatorios:</p>
            <ul className="mt-1 list-inside list-disc">
              {errores.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3">
          <Panel title="Acciones">
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className={btn("primary")}>
                <i className="ri-save-line text-[13px] leading-none" aria-hidden="true" />
                Guardar proveedor
              </button>
              <Link to="/proveedores" className={btn("secondary")}>
                Cancelar
              </Link>
            </div>
          </Panel>
        </div>
      </form>
    </div>
  );
}
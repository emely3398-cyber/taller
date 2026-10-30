import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/base/PageHeader";
import Panel from "@/components/base/Panel";
import Field from "@/components/base/Field";
import { btn } from "@/components/base/buttonStyles";
import { guardarProducto, obtenerProducto, siguienteCodigoProducto } from "@/lib/inventarioStore";
import { useProveedores } from "@/lib/proveedoresStore";
import { formatMoney, generarCodigoBarras } from "@/lib/format";
import { leerArchivosComoDataUrl } from "@/lib/imagenes";
import PhotoViewer from "@/components/base/PhotoViewer";
import type { Producto } from "@/types/admin";

const CATEGORIAS = [
  "Lubricantes",
  "Filtros",
  "Frenos",
  "Transmisión",
  "Motor",
  "Cables",
  "Encendido",
];

export default function ProductoFormPage() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const proveedores = useProveedores();
  const productoBase = codigo ? obtenerProducto(codigo) : undefined;
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    codigo: productoBase?.codigo || siguienteCodigoProducto(),
    codigoBarras: productoBase?.codigoBarras || "",
    nombre: productoBase?.nombre || "",
    descripcion: productoBase?.descripcion || "",
    categoria: productoBase?.categoria || "Lubricantes",
    marca: productoBase?.marca || "",
    marcaMoto: productoBase?.marcaMoto || "",
    modeloMoto: productoBase?.modeloMoto || "",
    anioCompatible: productoBase?.anioCompatible || "",
    numeroSerie: productoBase?.numeroSerie || "",
    proveedorId: productoBase?.proveedorId || proveedores[0]?.id || "",
    precioCompra: String(productoBase?.precioCompra ?? ""),
    precioMayor: String(productoBase?.precioMayor ?? ""),
    precioMenor: String(productoBase?.precioMenor ?? ""),
    existencia: String(productoBase?.existencia ?? "0"),
    stockMinimo: String(productoBase?.stockMinimo ?? "0"),
    ubicacion: productoBase?.ubicacion || "",
  });
  const [imagenes, setImagenes] = useState<string[]>(() =>
    Array.from(
      new Set(
        [productoBase?.imagen, ...(productoBase?.imagenes ?? [])].filter(
          (url): url is string => Boolean(url && url.trim()),
        ),
      ),
    ),
  );
  const [indiceVisor, setIndiceVisor] = useState<number | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);

  const set = (campo: keyof typeof form, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const cargaImagen = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(event.target.files || []);
    event.target.value = "";
    if (archivos.length === 0) return;
    const nuevas = await leerArchivosComoDataUrl(archivos);
    setImagenes((prev) => [...prev, ...nuevas.map((imagen) => imagen.url)]);
  };

  const quitarImagen = (indice: number) => {
    setImagenes((prev) => prev.filter((_, posicion) => posicion !== indice));
  };

  const guardar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const faltantes: string[] = [];
    if (!form.codigo.trim()) faltantes.push("Código del producto");
    if (!form.codigoBarras.trim()) faltantes.push("Código de barras");
    if (!form.nombre.trim()) faltantes.push("Nombre del producto");
    if (!form.marca.trim()) faltantes.push("Marca del producto");
    if (!form.proveedorId) faltantes.push("Proveedor");
    if (!form.precioMenor.trim()) faltantes.push("Precio por menor");
    if (!form.precioMayor.trim()) faltantes.push("Precio por mayor");
    if (!form.existencia.trim()) faltantes.push("Cantidad disponible");
    setErrores(faltantes);
    if (faltantes.length > 0) return;

    const producto: Producto = {
      codigo: form.codigo.trim().toUpperCase(),
      codigoBarras: form.codigoBarras.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      categoria: form.categoria,
      marca: form.marca.trim(),
      marcaMoto: form.marcaMoto.trim(),
      modeloMoto: form.modeloMoto.trim(),
      anioCompatible: form.anioCompatible.trim(),
      numeroSerie: form.numeroSerie.trim(),
      precioCompra: Number(form.precioCompra) || 0,
      precioMenor: Number(form.precioMenor) || 0,
      precioMayor: Number(form.precioMayor) || 0,
      existencia: Number(form.existencia) || 0,
      stockMinimo: Number(form.stockMinimo) || 0,
      proveedorId: form.proveedorId,
      ubicacion: form.ubicacion.trim() || "Sin ubicación",
      imagen: imagenes[0],
      imagenes: imagenes.length > 0 ? imagenes : undefined,
    };

    guardarProducto(producto);
    navigate("/inventario");
  };

  return (
    <div>
      <PageHeader
        title={productoBase ? `Editar producto ${productoBase.codigo}` : "Registrar producto"}
        subtitle="Inventario único compartido por el taller y el punto de venta."
        actions={
          <Link to="/inventario" className={btn("secondary")}>
            <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
            Volver al inventario
          </Link>
        }
      />

      <form onSubmit={guardar} noValidate>
        <div className="space-y-3">
          <Panel title="Identificación del producto">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Código del producto" htmlFor="inv-codigo" required>
                <input
                  id="inv-codigo"
                  className="admin-field font-mono"
                  value={form.codigo}
                  readOnly={Boolean(productoBase)}
                  onChange={(e) => set("codigo", e.target.value)}
                />
              </Field>
              <Field
                label="Código de barras"
                htmlFor="inv-barras"
                required
                className="lg:col-span-2"
              >
                <div className="flex flex-col gap-1.5 sm:flex-row">
                  <input
                    id="inv-barras"
                    ref={barcodeRef}
                    className="admin-field flex-1 font-mono"
                    value={form.codigoBarras}
                    onChange={(e) => {
                      set("codigoBarras", e.target.value);
                      setEscaneando(false);
                    }}
                    placeholder="7754123001001"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        set("codigoBarras", generarCodigoBarras());
                        setEscaneando(false);
                      }}
                      className={btn("secondary")}
                    >
                      <i className="ri-barcode-line text-[13px] leading-none" aria-hidden="true" />
                      Generar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        barcodeRef.current?.focus();
                        setEscaneando(true);
                      }}
                      className={btn("secondary")}
                    >
                      <i className="ri-scan-line text-[13px] leading-none" aria-hidden="true" />
                      Escanear
                    </button>
                  </div>
                </div>
                {escaneando && (
                  <p className="mt-1 border border-primary-200 bg-primary-50 px-2 py-1 text-[11px] text-primary-800">
                    Campo listo para el lector. Apunte al código de barras del producto; el valor se
                    cargará automáticamente.
                  </p>
                )}
              </Field>
              <Field label="Número de serie" htmlFor="inv-serie">
                <input
                  id="inv-serie"
                  className="admin-field font-mono"
                  value={form.numeroSerie}
                  onChange={(e) => set("numeroSerie", e.target.value)}
                />
              </Field>

              <Field label="Nombre del producto" htmlFor="inv-nombre" required className="lg:col-span-2">
                <input
                  id="inv-nombre"
                  className="admin-field"
                  value={form.nombre}
                  onChange={(e) => set("nombre", e.target.value)}
                  placeholder="Ej. Cadena de transmisión 428H x 118 eslabones"
                />
              </Field>
              <Field label="Categoría" htmlFor="inv-cat" required>
                <select
                  id="inv-cat"
                  className="admin-field"
                  value={form.categoria}
                  onChange={(e) => set("categoria", e.target.value)}
                >
                  {CATEGORIAS.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Marca del producto" htmlFor="inv-marca" required>
                <input
                  id="inv-marca"
                  className="admin-field"
                  value={form.marca}
                  onChange={(e) => set("marca", e.target.value)}
                  placeholder="Suzuki, NGK, Genérico"
                />
              </Field>

              <Field label="Descripción" htmlFor="inv-desc" className="sm:col-span-2 lg:col-span-4">
                <textarea
                  id="inv-desc"
                  rows={2}
                  maxLength={300}
                  className="admin-field resize-y"
                  value={form.descripcion}
                  onChange={(e) => set("descripcion", e.target.value)}
                  placeholder="Detalle técnico, medidas, material o presentación"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Compatibilidad con motocicletas">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Marca de motocicleta" htmlFor="inv-marca-moto">
                <input
                  id="inv-marca-moto"
                  className="admin-field"
                  value={form.marcaMoto}
                  onChange={(e) => set("marcaMoto", e.target.value)}
                  placeholder="Suzuki, Honda, Universal"
                />
              </Field>
              <Field label="Modelo de motocicleta" htmlFor="inv-modelo-moto">
                <input
                  id="inv-modelo-moto"
                  className="admin-field"
                  value={form.modeloMoto}
                  onChange={(e) => set("modeloMoto", e.target.value)}
                  placeholder="GN125, EN125, Gixxer 150"
                />
              </Field>
              <Field label="Año de motocicletas compatibles" htmlFor="inv-anio">
                <input
                  id="inv-anio"
                  className="admin-field"
                  value={form.anioCompatible}
                  onChange={(e) => set("anioCompatible", e.target.value)}
                  placeholder="2018-2024 o Todas"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Fotografía, proveedor y precios">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Fotografía del producto"
                htmlFor="inv-foto"
                required={false}
                className="sm:col-span-2"
              >
                <input
                  id="inv-foto"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={cargaImagen}
                  className="admin-field cursor-pointer file:mr-2 file:cursor-pointer file:border-0 file:bg-background-200 file:px-2 file:py-0.5 file:text-[11px] file:text-foreground-200"
                />
                {imagenes.length > 0 && (
                  <div className="mt-2">
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {imagenes.map((url, indice) => (
                        <li
                          key={`${indice}-${url.length}-${url.slice(-24)}`}
                          className="border border-background-800 bg-background-100 p-1"
                        >
                          <button
                            type="button"
                            onClick={() => setIndiceVisor(indice)}
                            aria-label={`Ampliar fotografía ${indice + 1} del producto`}
                            className="group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden bg-background-200"
                          >
                            <img
                              src={url}
                              alt={form.nombre || "Producto"}
                              title={form.nombre}
                              className="h-full w-full object-cover object-top"
                            />
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                              <i
                                className="ri-zoom-in-line text-[15px] leading-none text-white opacity-0 transition-opacity group-hover:opacity-100"
                                aria-hidden="true"
                              />
                            </span>
                          </button>
                          <div className="mt-1 flex items-center justify-between gap-1">
                            <span className="truncate text-[10px] text-foreground-500">
                              {indice === 0 ? "Foto principal" : `Foto ${indice + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => quitarImagen(indice)}
                              aria-label={`Quitar fotografía ${indice + 1}`}
                              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center border border-background-800 text-foreground-400 hover:bg-background-200 hover:text-accent-700"
                            >
                              <i className="ri-close-line text-[11px] leading-none" aria-hidden="true" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-[11px] text-foreground-500">
                      {imagenes.length} {imagenes.length === 1 ? "fotografía guardada" : "fotografías guardadas"} · toque una imagen para verla ampliada.
                    </p>
                  </div>
                )}
              </Field>

              <Field label="Proveedor" htmlFor="inv-proveedor" required>
                <select
                  id="inv-proveedor"
                  className="admin-field"
                  value={form.proveedorId}
                  onChange={(e) => set("proveedorId", e.target.value)}
                >
                  <option value="">Seleccione un proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>
                      {proveedor.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ubicación en almacén" htmlFor="inv-ubicacion">
                <input
                  id="inv-ubicacion"
                  className="admin-field font-mono"
                  value={form.ubicacion}
                  onChange={(e) => set("ubicacion", e.target.value)}
                  placeholder="A-01"
                />
              </Field>

              <Field label="Precio de compra" htmlFor="inv-compra">
                <input
                  id="inv-compra"
                  className="admin-field text-right font-mono"
                  value={form.precioCompra}
                  inputMode="decimal"
                  onChange={(e) => set("precioCompra", e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Precio por mayor" htmlFor="inv-mayor" required>
                <input
                  id="inv-mayor"
                  className="admin-field text-right font-mono"
                  value={form.precioMayor}
                  inputMode="decimal"
                  onChange={(e) => set("precioMayor", e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Precio por menor" htmlFor="inv-menor" required>
                <input
                  id="inv-menor"
                  className="admin-field text-right font-mono"
                  value={form.precioMenor}
                  inputMode="decimal"
                  onChange={(e) => set("precioMenor", e.target.value)}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Cantidad disponible" htmlFor="inv-existencia" required>
                <input
                  id="inv-existencia"
                  className="admin-field text-right font-mono"
                  value={form.existencia}
                  inputMode="numeric"
                  onChange={(e) => set("existencia", e.target.value)}
                />
              </Field>
              <Field label="Stock mínimo" htmlFor="inv-minimo">
                <input
                  id="inv-minimo"
                  className="admin-field text-right font-mono"
                  value={form.stockMinimo}
                  inputMode="numeric"
                  onChange={(e) => set("stockMinimo", e.target.value)}
                />
              </Field>
            </div>
          </Panel>

          {errores.length > 0 && (
            <div className="border border-accent-300 bg-accent-50 px-3 py-2 text-[12px] text-accent-800">
              <p className="font-medium">Complete los campos obligatorios:</p>
              <ul className="mt-1 list-inside list-disc">
                {errores.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <Panel title="Acciones">
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className={btn("primary")}>
                <i className="ri-save-line text-[13px] leading-none" aria-hidden="true" />
                Guardar producto
              </button>
              <Link to="/inventario" className={btn("secondary")}>
                Cancelar
              </Link>
              {productoBase && (
                <span className="text-[11px] text-foreground-500">
                  Existencias actuales: {productoBase.existencia} · Precio menor{" "}
                  {formatMoney(productoBase.precioMenor)}
                </span>
              )}
            </div>
          </Panel>
        </div>
      </form>

      {indiceVisor !== null && imagenes.length > 0 && (
        <PhotoViewer
          fotos={imagenes.map((url, indice) => ({
            url,
            nombre: indice === 0 ? "Foto principal" : `Foto ${indice + 1}`,
            pie: form.nombre || form.codigo,
          }))}
          indiceInicial={indiceVisor}
          titulo={form.nombre || "Fotografía del producto"}
          onClose={() => setIndiceVisor(null)}
        />
      )}
    </div>
  );
}
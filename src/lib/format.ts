export function formatMoney(value: number) {
  const numero = value.toLocaleString("es-GT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Q ${numero}`;
}

export function formatDate(value: string) {
  if (!value) return "—";
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

export function formatDateTime(value: string) {
  if (!value) return "—";
  const [fecha, hora] = value.split("T");
  const base = formatDate(fecha);
  if (!hora) return base;
  return `${base} · ${hora.slice(0, 5)}`;
}

export function ahoraISO() {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset() * 60000;
  return new Date(ahora.getTime() - offset).toISOString().slice(0, 16);
}

export function stockEstado(existencia: number, minimo: number) {
  if (existencia === 0) return "Sin stock";
  if (existencia <= minimo) return "Stock bajo";
  return "Disponible";
}

export function compatibilidadTexto(producto: {
  marcaMoto: string;
  modeloMoto: string;
  anioCompatible: string;
}) {
  const base = [producto.marcaMoto, producto.modeloMoto].filter(Boolean).join(" ").trim();
  if (!base) return "No aplica";
  return producto.anioCompatible ? `${base} · ${producto.anioCompatible}` : base;
}

export function generarCodigoBarras() {
  const base = `775${String(Date.now()).slice(-9)}`;
  return base.slice(0, 13).padEnd(13, "0");
}
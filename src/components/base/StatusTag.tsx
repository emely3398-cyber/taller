type StatusTagProps = {
  label: string;
  className?: string;
};

const tones: Record<string, string> = {
  Recibida: "border-background-800 bg-background-200 text-foreground-300",
  "En diagnóstico": "border-primary-200 bg-primary-50 text-primary-700",
  Cotizada: "border-secondary-300 bg-secondary-100 text-secondary-800",
  "En reparación": "border-primary-300 bg-primary-100 text-primary-800",
  "En espera de repuesto": "border-accent-300 bg-accent-50 text-accent-800",
  "Reparación finalizada": "border-primary-600 bg-primary-500 text-background-50",
  Entregada: "border-foreground-200 bg-foreground-100 text-background-50",
  "Servicio cancelado": "border-background-800 bg-background-200 text-foreground-400",
  Pendiente: "border-background-800 bg-background-200 text-foreground-400",
  "Enviada al cliente": "border-accent-300 bg-accent-50 text-accent-800",
  Aprobada: "border-primary-600 bg-primary-500 text-background-50",
  Rechazada: "border-background-800 bg-background-100 text-foreground-500",
  Taller: "border-primary-200 bg-primary-50 text-primary-700",
  "Punto de venta": "border-secondary-300 bg-secondary-100 text-secondary-800",
  Disponible: "border-primary-200 bg-primary-50 text-primary-700",
  "Stock bajo": "border-accent-300 bg-accent-50 text-accent-800",
  "Sin stock": "border-background-800 bg-background-200 text-foreground-500",
  Entrada: "border-primary-200 bg-primary-50 text-primary-700",
  Salida: "border-accent-300 bg-accent-50 text-accent-800",
  Activo: "border-primary-200 bg-primary-50 text-primary-700",
  Inactivo: "border-background-800 bg-background-200 text-foreground-400",
};

export default function StatusTag({ label, className = "" }: StatusTagProps) {
  const tone = tones[label] || "border-background-800 bg-background-200 text-foreground-300";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-[2px] border px-1.5 py-0.5 text-[11px] leading-4 ${tone} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
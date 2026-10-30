import { Link, useLocation } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="border border-background-800 bg-background-900 p-6">
      <h1 className="text-base font-semibold text-foreground-50">Módulo no disponible</h1>
      <p className="mt-2 text-[13px] text-foreground-300">
        La ruta solicitada no pertenece al sistema administrativo.
      </p>
      <p className="mt-1 font-mono text-[12px] text-foreground-500">{location.pathname}</p>
      <Link
        to="/inicio"
        className="mt-4 inline-flex cursor-pointer items-center gap-1.5 border border-primary-600 bg-primary-500 px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-primary-600"
      >
        <i className="ri-arrow-left-line text-[13px] leading-none" aria-hidden="true" />
        Volver al inicio
      </Link>
    </div>
  );
}
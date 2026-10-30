import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import SidebarNav from "@/components/feature/SidebarNav";
import { useSesion } from "@/lib/sesionStore";

function rutaPermitidaMecanico(pathname: string, codigo: string) {
  if (pathname === "/taller/mis-ordenes") return true;
  if (pathname === "/taller/nueva") return true;
  if (pathname === `/taller/mecanicos/${codigo}`) return true;
  if (pathname.startsWith("/taller/OS-")) return true;
  return false;
}

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const sesion = useSesion();

  const esMecanico = sesion?.tipo === "Mecánico";
  const permitida =
    !esMecanico || rutaPermitidaMecanico(pathname, sesion?.mecanicoCodigo || "");

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (esMecanico && !permitida) {
      navigate("/taller/mis-ordenes", { replace: true });
    }
  }, [esMecanico, permitida, navigate]);

  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[214px] lg:block">
        <SidebarNav />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full cursor-pointer bg-black/50"
          />
          <div className="absolute inset-y-0 left-0 w-[248px] shadow-lg">
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:pl-[214px]">
        <header className="sticky top-0 z-30 border-b border-background-800 bg-background-900">
          <div className="flex h-12 items-center justify-between gap-3 px-3 md:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Abrir menú"
                className="flex h-7 w-7 cursor-pointer items-center justify-center border border-background-800 text-foreground-300 hover:bg-background-200 lg:hidden"
              >
                <i className="ri-menu-line text-[16px] leading-none" aria-hidden="true" />
              </button>
              <h1 className="truncate text-[12px] font-semibold text-foreground-100 md:text-[13px]">
                Sistema de Taller y Punto de Venta
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[11px] text-foreground-400">
              <span className="hidden items-center gap-1.5 border border-background-800 px-2 py-1 sm:inline-flex">
                <i className="ri-user-line text-[12px] leading-none" aria-hidden="true" />
                {sesion.nombre}
                <span className="text-foreground-500">· {sesion.tipo}</span>
              </span>
              <span className="hidden font-mono text-[11px] text-foreground-500 md:inline">
                29/10/2026
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 py-4 md:px-5 md:py-5">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cerrarSesion, useSesion } from "@/lib/sesionStore";

const itemsAdmin = [
  { to: "/inicio", label: "Inicio", icon: "ri-home-5-line" },
  { to: "/taller", label: "Taller", icon: "ri-tools-line" },
  { to: "/cotizaciones", label: "Cotizaciones", icon: "ri-file-list-3-line" },
  { to: "/punto-venta", label: "Punto de venta", icon: "ri-shopping-cart-2-line" },
  { to: "/inventario", label: "Inventario", icon: "ri-archive-2-line" },
  { to: "/proveedores", label: "Proveedores", icon: "ri-truck-line" },
];

type SidebarNavProps = {
  onNavigate?: () => void;
};

export default function SidebarNav({ onNavigate }: SidebarNavProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const sesion = useSesion();
  const esMecanico = sesion?.tipo === "Mecánico";

  const items = esMecanico
    ? [
        { to: "/taller/mis-ordenes", label: "Mis órdenes", icon: "ri-tools-line" },
        { to: "/taller/nueva", label: "Nueva hoja de servicio", icon: "ri-add-circle-line" },
        {
          to: `/taller/mecanicos/${sesion?.mecanicoCodigo || ""}`,
          label: "Mi perfil",
          icon: "ri-user-line",
        },
      ]
    : itemsAdmin;

  const isActive = (to: string) =>
    to === "/taller/mis-ordenes" || to === "/taller/nueva"
      ? pathname === to
      : pathname === to || pathname.startsWith(`${to}/`);

  const salir = () => {
    onNavigate?.();
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-sidebar flex h-full w-full flex-col border-r border-black/20">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sidebar-divider">
        <div className="flex h-7 w-7 items-center justify-center border border-white/20 bg-white/10 font-mono text-[10px] font-medium text-white">
          TP
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-white">Gestión interna</p>
          <p className="sidebar-muted truncate text-[10px]">Taller y punto de venta</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-label="Módulos del sistema">
        <p className="sidebar-title px-3 pb-1 text-[10px] font-medium uppercase tracking-[0.08em]">
          {esMecanico ? "Mi trabajo" : "Módulos"}
        </p>
        <ul>
          {items.map((item) => {
            const active = isActive(item.to);
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className="sidebar-link"
                >
                  <span className="flex h-4 w-4 items-center justify-center">
                    <i className={`${item.icon} text-[15px] leading-none`} aria-hidden="true" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-divider shrink-0 border-t px-3 py-2.5">
        {sesion && (
          <div className="mb-2">
            <p className="truncate text-[11px] font-medium text-white">{sesion.nombre}</p>
            <p className="sidebar-muted truncate text-[10px]">
              {sesion.tipo} · {sesion.usuario}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={salir}
          className="flex w-full cursor-pointer items-center gap-1.5 border border-white/20 px-2 py-1 text-[11px] text-white/90 hover:bg-white/10"
        >
          <i className="ri-logout-box-r-line text-[12px] leading-none" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
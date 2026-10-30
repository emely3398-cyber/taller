import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/taller", label: "Órdenes de servicio" },
  { to: "/taller/mecanicos", label: "Mecánicos" },
];

export default function TallerTabs() {
  const { pathname } = useLocation();

  return (
    <div className="mb-3 inline-flex w-fit flex-wrap items-center gap-1 border border-background-800 bg-background-100 p-1">
      {tabs.map((tab) => {
        const activo =
          tab.to === "/taller" ? !pathname.startsWith("/taller/mecanicos") : pathname.startsWith(tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            aria-current={activo ? "page" : undefined}
            className={`cursor-pointer whitespace-nowrap rounded-[2px] px-2.5 py-1 text-[12px] transition-colors ${
              activo
                ? "bg-primary-500 text-background-50"
                : "text-foreground-400 hover:bg-background-200 hover:text-foreground-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
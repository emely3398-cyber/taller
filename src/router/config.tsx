import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import AdminLayout from "@/components/feature/AdminLayout";
import LoginPage from "@/pages/login/page";
import InicioPage from "@/pages/inicio/page";
import TallerPage from "@/pages/taller/page";
import NuevaHojaPage from "@/pages/taller/nueva/page";
import MisOrdenesPage from "@/pages/taller/mis-ordenes/page";
import MecanicosPage from "@/pages/taller/mecanicos/page";
import MecanicoFormPage from "@/pages/taller/mecanicos/form/page";
import MecanicoDetallePage from "@/pages/taller/mecanicos/detalle/page";
import OrdenDetallePage from "@/pages/taller/detalle/page";
import CotizacionesPage from "@/pages/cotizaciones/page";
import NuevaCotizacionPage from "@/pages/cotizaciones/nueva/page";
import CotizacionDetallePage from "@/pages/cotizaciones/detalle/page";
import PuntoVentaPage from "@/pages/punto-venta/page";
import HistorialVentasPage from "@/pages/punto-venta/historial/page";
import InventarioPage from "@/pages/inventario/page";
import ProductoFormPage from "@/pages/inventario/form/page";
import MovimientosPage from "@/pages/inventario/movimientos/page";
import ProveedoresPage from "@/pages/proveedores/page";
import ProveedorFormPage from "@/pages/proveedores/form/page";
import NotFound from "@/pages/NotFound";

const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  {
    element: <AdminLayout />,
    children: [
      { path: "/", element: <Navigate to="/inicio" replace /> },
      { path: "/inicio", element: <InicioPage /> },
      { path: "/taller", element: <TallerPage /> },
      { path: "/taller/nueva", element: <NuevaHojaPage /> },
      { path: "/taller/mis-ordenes", element: <MisOrdenesPage /> },
      { path: "/taller/mecanicos", element: <MecanicosPage /> },
      { path: "/taller/mecanicos/nuevo", element: <MecanicoFormPage /> },
      { path: "/taller/mecanicos/editar/:codigo", element: <MecanicoFormPage /> },
      { path: "/taller/mecanicos/:codigo", element: <MecanicoDetallePage /> },
      { path: "/taller/:id", element: <OrdenDetallePage /> },
      { path: "/cotizaciones", element: <CotizacionesPage /> },
      { path: "/cotizaciones/nueva", element: <NuevaCotizacionPage /> },
      { path: "/cotizaciones/:id", element: <CotizacionDetallePage /> },
      { path: "/punto-venta", element: <PuntoVentaPage /> },
      { path: "/punto-venta/historial", element: <HistorialVentasPage /> },
      { path: "/inventario", element: <InventarioPage /> },
      { path: "/inventario/nuevo", element: <ProductoFormPage /> },
      { path: "/inventario/editar/:codigo", element: <ProductoFormPage /> },
      { path: "/inventario/movimientos", element: <MovimientosPage /> },
      { path: "/proveedores", element: <ProveedoresPage /> },
      { path: "/proveedores/nuevo", element: <ProveedorFormPage /> },
      { path: "/proveedores/editar/:id", element: <ProveedorFormPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export default routes;
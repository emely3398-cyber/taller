import { useSyncExternalStore } from "react";
import { obtenerOrdenes, suscribirOrdenes } from "@/lib/ordenesStore";

export function useOrdenes() {
  return useSyncExternalStore(suscribirOrdenes, obtenerOrdenes, obtenerOrdenes);
}
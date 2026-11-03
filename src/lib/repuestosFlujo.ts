import type { Cotizacion, MaterialOrden, OrdenServicio, Producto } from "@/types/admin";

/**
 * Flujo obligatorio de los repuestos de una hoja de servicio:
 * solicitado → incorporado a la cotización → autorizado por el cliente →
 * despachado por administración → utilizado por el mecánico.
 *
 * El estado se calcula siempre desde los registros compartidos (materiales,
 * cotizaciones vinculadas, despachos y utilizaciones); nunca se guarda una
 * copia por perfil.
 */

export type EtapaRepuesto =
  | "Requerido"
  | "Pendiente de incorporación"
  | "Pendiente de autorización"
  | "Autorizado"
  | "Despachado"
  | "Utilizado";

export type SituacionRepuesto = {
  etapa: EtapaRepuesto;
  solicitada: number;
  autorizada: number;
  despachada: number;
  utilizada: number;
  pendienteDespacho: number;
  maxUtilizable: number;
  puedeUtilizar: boolean;
  motivoBloqueo: string;
};

export type CantidadesRepuesto = {
  solicitada: number;
  autorizada: number;
  despachada: number;
  utilizada: number;
};

export function cotizacionesDeOrden(ordenId: string, cotizaciones: Cotizacion[]) {
  return cotizaciones.filter(
    (cotizacion) => cotizacion.tipo === "Taller" && cotizacion.referencia === ordenId,
  );
}

/** Suma de cantidades solicitadas, autorizadas, despachadas y utilizadas por código. */
export function cantidadesPorCodigo(
  orden: OrdenServicio,
  codigo: string,
  cotizaciones: Cotizacion[],
): CantidadesRepuesto {
  const materiales = (orden.materiales ?? []).filter((material) => material.codigo === codigo);
  const solicitada = materiales.reduce((total, material) => total + material.cantidad, 0);

  const autorizada = cotizacionesDeOrden(orden.id, cotizaciones)
    .filter((cotizacion) => cotizacion.estado === "Aprobada")
    .reduce(
      (total, cotizacion) =>
        total +
        cotizacion.lineas
          .filter((linea) => linea.codigo === codigo)
          .reduce((suma, linea) => suma + linea.cantidad, 0),
      0,
    );

  const despachada = orden.repuestosDespachados
    .filter((repuesto) => repuesto.codigo === codigo)
    .reduce((total, repuesto) => total + repuesto.cantidad, 0);

  const utilizaciones = (orden.utilizaciones ?? []).filter(
    (utilizacion) => utilizacion.codigo === codigo,
  );
  const utilizadaRegistrada = utilizaciones.reduce(
    (total, utilizacion) => total + utilizacion.cantidad,
    0,
  );
  // Compatibilidad: antes de existir el registro de utilizaciones, la marca
  // «Utilizado» del material era la única referencia de instalación.
  const utilizadaLegado =
    utilizaciones.length > 0
      ? 0
      : materiales
          .filter((material) => material.estado === "Utilizado")
          .reduce((total, material) => total + material.cantidad, 0);

  return {
    solicitada,
    autorizada,
    despachada,
    utilizada: utilizadaRegistrada + utilizadaLegado,
  };
}

export function calcularSituacionMaterial(
  orden: OrdenServicio,
  material: MaterialOrden,
  cotizaciones: Cotizacion[],
): SituacionRepuesto {
  const vinculadas = cotizacionesDeOrden(orden.id, cotizaciones).filter(
    (cotizacion) => cotizacion.estado !== "Rechazada",
  );
  const aprobadas = vinculadas.filter((cotizacion) => cotizacion.estado === "Aprobada");
  const cantidades = cantidadesPorCodigo(orden, material.codigo, cotizaciones);

  const pendienteDespacho = Math.max(0, cantidades.autorizada - cantidades.despachada);
  const maxUtilizable = Math.max(
    0,
    Math.min(cantidades.despachada, cantidades.autorizada) - cantidades.utilizada,
  );

  let etapa: EtapaRepuesto;
  if (
    cantidades.utilizada > 0 &&
    (cantidades.despachada === 0 || cantidades.utilizada >= cantidades.despachada)
  ) {
    etapa = "Utilizado";
  } else if (cantidades.despachada > 0) {
    etapa = "Despachado";
  } else if (cantidades.autorizada > 0) {
    etapa = "Autorizado";
  } else if (aprobadas.length > 0) {
    etapa = "Pendiente de autorización";
  } else if (vinculadas.length > 0) {
    const incluido = vinculadas.some((cotizacion) =>
      cotizacion.lineas.some((linea) => linea.codigo === material.codigo && linea.cantidad > 0),
    );
    etapa = incluido ? "Pendiente de autorización" : "Pendiente de incorporación";
  } else {
    etapa = "Requerido";
  }

  let motivoBloqueo = "";
  if (maxUtilizable <= 0) {
    if (cantidades.utilizada > 0 && cantidades.utilizada >= cantidades.despachada) {
      motivoBloqueo = "Todas las unidades despachadas ya se utilizaron.";
    } else if (vinculadas.length === 0) {
      motivoBloqueo = "Requiere cotización de taller aprobada.";
    } else if (etapa === "Pendiente de incorporación") {
      motivoBloqueo = "Falta incorporarlo a la cotización.";
    } else if (etapa === "Pendiente de autorización") {
      motivoBloqueo = "Pendiente de autorización del cliente.";
    } else if (etapa === "Autorizado") {
      motivoBloqueo = "Pendiente de despacho por administración.";
    } else if (cantidades.autorizada === 0) {
      motivoBloqueo = "No está incluido en la cotización aprobada.";
    } else {
      motivoBloqueo = "Sin unidades despachadas.";
    }
  }

  return {
    etapa,
    solicitada: cantidades.solicitada,
    autorizada: cantidades.autorizada,
    despachada: cantidades.despachada,
    utilizada: cantidades.utilizada,
    pendienteDespacho,
    maxUtilizable,
    puedeUtilizar: maxUtilizable > 0,
    motivoBloqueo,
  };
}

export type RepuestoDespachable = {
  codigo: string;
  nombre: string;
  autorizada: number;
  despachada: number;
  pendiente: number;
  existencia: number;
};

/**
 * Repuestos de la propia orden que están en una cotización aprobada y todavía
 * tienen unidades autorizadas pendientes de despacho.
 */
export function repuestosDespachables(
  orden: OrdenServicio,
  cotizaciones: Cotizacion[],
  productos: Producto[],
): RepuestoDespachable[] {
  const codigos = new Set<string>();
  (orden.materiales ?? []).forEach((material) => codigos.add(material.codigo));

  const lista: RepuestoDespachable[] = [];
  codigos.forEach((codigo) => {
    const cantidades = cantidadesPorCodigo(orden, codigo, cotizaciones);
    const pendiente = Math.max(0, cantidades.autorizada - cantidades.despachada);
    if (pendiente <= 0) return;

    const producto = productos.find((item) => item.codigo === codigo);
    const material = (orden.materiales ?? []).find((item) => item.codigo === codigo);
    lista.push({
      codigo,
      nombre: producto?.nombre || material?.nombre || codigo,
      autorizada: cantidades.autorizada,
      despachada: cantidades.despachada,
      pendiente,
      existencia: producto?.existencia ?? 0,
    });
  });

  return lista;
}
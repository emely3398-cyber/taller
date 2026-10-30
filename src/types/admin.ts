export type EstadoOrden =
  | "Recibida"
  | "En diagnóstico"
  | "Cotizada"
  | "En reparación"
  | "En espera de repuesto"
  | "Reparación finalizada"
  | "Entregada"
  | "Servicio cancelado";

export type Mecanico = {
  codigo: string;
  nombre: string;
  telefono: string;
  usuario: string;
  contrasena: string;
  activo: boolean;
};

export type TipoServicio =
  | "Mantenimiento preventivo"
  | "Reparación de motor"
  | "Sistema de frenos"
  | "Sistema eléctrico"
  | "Transmisión y arrastre"
  | "Suspensión y dirección"
  | "Diagnóstico general"
  | "Otro";

export type FotoOrden = {
  nombre: string;
  url: string;
  origen?: "archivo" | "camara";
};

export type RegistroSeguimiento = {
  fecha: string;
  estadoAnterior: EstadoOrden | null;
  estadoNuevo: EstadoOrden;
  observacion: string;
  mecanico: string;
  fotos: FotoOrden[];
  cambioServicio?: string;
};

export type EstadoMaterialOrden = "Requerido" | "Pendiente" | "Utilizado";

export type MaterialOrden = {
  id: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  estado: EstadoMaterialOrden;
  fecha: string;
  registradoPor: string;
  observacion?: string;
};

export type RepuestoDespachado = {
  codigo: string;
  descripcion: string;
  cantidad: number;
  fecha: string;
};

export type OrdenServicio = {
  id: string;
  fechaIngreso: string;
  fechaEntrega: string;
  propietario: string;
  telefono: string;
  marca: string;
  modelo: string;
  anio: string;
  placa: string;
  chasis: string;
  caracteristicas: string;
  fotos: FotoOrden[];
  falla: string;
  desdeCuando: string;
  observacionesIniciales: string;
  diagnostico: string;
  tipoServicio?: TipoServicio;
  trabajoARealizar: string;
  trabajoRealizado: string;
  mecanico: string;
  estado: EstadoOrden;
  motivoCancelacion?: string;
  repuestoFaltante?: string;
  repuestosDespachados: RepuestoDespachado[];
  materiales?: MaterialOrden[];
  repuestosNecesarios?: string;
  seguimiento: RegistroSeguimiento[];
};

export type TipoCotizacion = "Taller" | "Punto de venta";

export type ManoObraTipo = "Fijo" | "Variable";

export type LineaCotizacion = {
  id: string;
  codigo?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
};

export type ReajusteCotizacion = {
  fecha: string;
  elemento: string;
  valorAnterior: string;
  valorNuevo: string;
  motivo: string;
};

export type EstadoCotizacion = "Pendiente" | "Enviada al cliente" | "Aprobada" | "Rechazada";

export type Cotizacion = {
  id: string;
  tipo: TipoCotizacion;
  referencia: string;
  cliente: string;
  propietario: string;
  motocicleta: string;
  mecanico: string;
  fecha: string;
  lineas: LineaCotizacion[];
  manoObraTipo: ManoObraTipo;
  manoObraValor: number;
  manoObraHoras: number;
  observaciones: string;
  estado: EstadoCotizacion;
  reajustes: ReajusteCotizacion[];
};

export type Producto = {
  codigo: string;
  codigoBarras: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  marca: string;
  marcaMoto: string;
  modeloMoto: string;
  anioCompatible: string;
  numeroSerie: string;
  precioCompra: number;
  precioMenor: number;
  precioMayor: number;
  existencia: number;
  stockMinimo: number;
  proveedorId: string;
  ubicacion: string;
  imagen?: string;
  imagenes?: string[];
};

export type Proveedor = {
  id: string;
  nombre: string;
  contacto: string;
  telefono: string;
  correo: string;
  ciudad: string;
  condiciones: string;
  ultimaCompra: string;
};

export type VentaLinea = {
  codigo: string;
  nombre: string;
  cantidad: number;
  precio: number;
  tipoPrecio: "Menor" | "Mayor";
};

export type Venta = {
  id: string;
  fecha: string;
  cliente: string;
  lineas: VentaLinea[];
  total: number;
  medioPago: "Efectivo" | "Tarjeta" | "Transferencia";
};

export type MovimientoInventario = {
  id: string;
  fecha: string;
  tipo: "Entrada" | "Salida";
  codigo: string;
  nombre: string;
  cantidad: number;
  motivo: string;
  proveedorId?: string;
  referencia?: string;
};
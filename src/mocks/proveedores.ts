import type { Proveedor } from '@/types/admin';

export const proveedores: Proveedor[] = [
  {
    id: 'PRV-001',
    nombre: 'Repuestos López',
    contacto: 'Pedro Ramírez',
    telefono: '2458 3310',
    correo: 'ventas@repuestoslopez.gt',
    ciudad: 'Guatemala',
    condiciones: 'Crédito 30 días',
    ultimaCompra: '2026-10-22',
  },
  {
    id: 'PRV-002',
    nombre: 'Distribuidora García',
    contacto: 'Ana García',
    telefono: '2334 7781',
    correo: 'pedidos@distribuidoragarcia.gt',
    ciudad: 'Mixco',
    condiciones: 'Contado',
    ultimaCompra: '2026-10-20',
  },
  {
    id: 'PRV-003',
    nombre: 'Moto Repuestos Pérez',
    contacto: 'Juan Pérez',
    telefono: '5789 2244',
    correo: 'ventas@motorepuestosperez.gt',
    ciudad: 'Villa Nueva',
    condiciones: 'Crédito 15 días',
    ultimaCompra: '2026-10-18',
  },
];
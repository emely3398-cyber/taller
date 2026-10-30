import type { Venta } from '@/types/admin';

export const ventasRecientes: Venta[] = [
  {
    id: 'V-0003',
    fecha: '2026-10-28 09:20',
    cliente: 'Cliente mostrador',
    lineas: [
      { codigo: 'REP-1002', nombre: 'Filtro de aceite Suzuki GN125 / EN125', cantidad: 1, precio: 35, tipoPrecio: 'Menor' },
      { codigo: 'REP-5002', nombre: 'Cable de embrague Suzuki EN125', cantidad: 1, precio: 36, tipoPrecio: 'Menor' },
    ],
    total: 71,
    medioPago: 'Efectivo',
  },
  {
    id: 'V-0002',
    fecha: '2026-10-27 16:40',
    cliente: 'Moto Servicio El Progreso',
    lineas: [
      { codigo: 'REP-1001', nombre: 'Aceite de motor 20W-50 1L', cantidad: 4, precio: 36, tipoPrecio: 'Mayor' },
      { codigo: 'REP-2001', nombre: 'Bujía NGK C7HSA', cantidad: 4, precio: 17, tipoPrecio: 'Mayor' },
    ],
    total: 212,
    medioPago: 'Transferencia',
  },
  {
    id: 'V-0001',
    fecha: '2026-10-26 10:15',
    cliente: 'Cliente mostrador',
    lineas: [
      { codigo: 'REP-3003', nombre: 'Zapatas de freno traseras Suzuki AX100', cantidad: 1, precio: 52, tipoPrecio: 'Menor' },
    ],
    total: 52,
    medioPago: 'Efectivo',
  },
];
import type { Mecanico } from "@/types/admin";

export const mecanicos: Mecanico[] = [
  {
    codigo: "MEC-001",
    nombre: "Carlos López",
    telefono: "5789 1120",
    usuario: "clopez",
    contrasena: "1234",
    activo: true,
  },
  {
    codigo: "MEC-002",
    nombre: "Diego Morales",
    telefono: "5512 4783",
    usuario: "dmorales",
    contrasena: "1234",
    activo: true,
  },
  {
    codigo: "MEC-003",
    nombre: "José Ramírez",
    telefono: "4238 9015",
    usuario: "jramirez",
    contrasena: "1234",
    activo: true,
  },
  {
    codigo: "MEC-004",
    nombre: "Pedro Ramírez",
    telefono: "3120 7788",
    usuario: "pramirez",
    contrasena: "1234",
    activo: false,
  },
];
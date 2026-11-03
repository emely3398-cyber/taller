import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { btn } from "@/components/base/buttonStyles";
import { useSesion, iniciarSesion } from "@/lib/sesionStore";

export default function LoginPage() {
  const sesion = useSesion();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  if (sesion) {
    return (
      <Navigate to={sesion.tipo === "Mecánico" ? "/taller/mis-ordenes" : "/inicio"} replace />
    );
  }

  const enviar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const resultado = iniciarSesion(usuario, contrasena);
    if (resultado.error) {
      setError(resultado.error);
      return;
    }
    setError("");
    const esMecanico = usuario.trim().toLowerCase() !== "admin";
    navigate(esMecanico ? "/taller/mis-ordenes" : "/inicio", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-950 px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center border border-background-800 bg-background-900 font-mono text-[10px] font-medium text-foreground-300">
            TP
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground-50">
              Gestión interna
            </p>
            <p className="truncate text-[11px] text-foreground-500">Taller y punto de venta</p>
          </div>
        </div>

        <div className="border border-background-800 bg-background-900">
          <div className="border-b border-background-800 px-4 py-3">
            <h1 className="text-[15px] font-semibold text-foreground-50">Iniciar sesión</h1>
            <p className="mt-1 text-[12px] text-foreground-400">
              Ingrese con su usuario para acceder a los módulos del sistema.
            </p>
          </div>

          <form onSubmit={enviar} className="px-4 py-3" noValidate>
            <div className="mb-2.5">
              <label
                htmlFor="login-usuario"
                className="mb-1 block text-[11px] font-medium uppercase tracking-[0.04em] text-foreground-400"
              >
                Usuario
              </label>
              <input
                id="login-usuario"
                name="usuario"
                className="admin-field"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value);
                  setError("");
                }}
                placeholder="admin"
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>

            <div className="mb-3">
              <label
                htmlFor="login-contrasena"
                className="mb-1 block text-[11px] font-medium uppercase tracking-[0.04em] text-foreground-400"
              >
                Contraseña
              </label>
              <input
                id="login-contrasena"
                name="contrasena"
                type="password"
                className="admin-field"
                value={contrasena}
                onChange={(e) => {
                  setContrasena(e.target.value);
                  setError("");
                }}
                placeholder="Contraseña"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="mb-2.5 border border-accent-300 bg-accent-50 px-2 py-1.5 text-[11px] text-accent-800">
                {error}
              </p>
            )}

            <button type="submit" className={`${btn("primary")} w-full`}>
              <i className="ri-login-box-line text-[13px] leading-none" aria-hidden="true" />
              Iniciar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
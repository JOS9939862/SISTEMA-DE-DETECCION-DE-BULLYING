"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
ArrowLeft,
Eye,
EyeOff,
LockKeyhole,
LogIn,
ShieldCheck,
UserRound,
} from "lucide-react";

import { login, setToken } from "@/lib/api";

export default function LoginPage() {
const router = useRouter();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [cargando, setCargando] = useState(false);
const [mostrarPassword, setMostrarPassword] = useState(false);

async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
e.preventDefault();

setError("");
setCargando(true);

try {
  const r = await login(email.trim(), password);

  setToken(r.access_token);
  router.push("/panel");
} catch (err) {
  setError(
    err instanceof Error
      ? err.message
      : "No se pudo iniciar sesión. Inténtalo nuevamente."
  );
} finally {
  setCargando(false);
}

}

return ( <main className="min-h-screen bg-[#f6f8fc] text-slate-900"> <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-5 sm:p-8"> <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[1.05fr_0.95fr]">

      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#172554] via-[#1d4ed8] to-[#2563eb] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <ShieldCheck size={25} />
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
            Sistema institucional
          </p>

          <h1 className="mt-3 max-w-md text-3xl font-bold leading-tight">
            Detección, orientación y seguimiento de casos
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-blue-100">
            Plataforma de apoyo para la gestión y seguimiento de
            situaciones relacionadas con bullying y ciberbullying.
          </p>
        </div>

        <div className="relative z-10 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <LockKeyhole
              size={18}
              className="mt-0.5 shrink-0 text-blue-200"
            />

            <div>
              <p className="text-sm font-semibold">
                Acceso restringido
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-100">
                El panel de gestión está destinado exclusivamente a
                personal autorizado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="p-6 sm:p-10 lg:p-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <div className="mx-auto mt-10 max-w-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <UserRound size={23} />
          </div>

          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Área de personal
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Iniciar sesión
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ingresa tus credenciales para acceder al panel de gestión.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Correo electrónico
              </label>

              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="correo@institucion.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Contraseña
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword((actual) => !actual)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label={
                    mostrarPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {mostrarPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm font-medium leading-5 text-rose-700">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Ingresar al panel
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-slate-500"
            />

            <p className="text-xs leading-5 text-slate-500">
              El acceso está protegido mediante autenticación y
              permisos según el rol del personal.
            </p>
          </div>
        </div>
      </section>
    </div>

    <div className="fixed bottom-4 left-0 right-0 px-5 text-center text-xs text-slate-400">
      Sistema de detección, orientación y seguimiento de casos de
      bullying y ciberbullying
    </div>
  </div>
</main>

);
}

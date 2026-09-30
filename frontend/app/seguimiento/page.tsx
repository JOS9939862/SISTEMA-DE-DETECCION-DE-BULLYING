"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  FileCheck2,
  HeartHandshake,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { consultarSeguimiento, type Seguimiento } from "@/lib/api";

const ESTADOS = [
  {
    key: "nuevo",
    etiqueta: "Recibida",
    descripcion: "Tu denuncia fue registrada.",
    icon: FileCheck2,
  },
  {
    key: "en_revision",
    etiqueta: "En revisión",
    descripcion: "El equipo está revisando el caso.",
    icon: Clipboard,
  },
  {
    key: "en_intervencion",
    etiqueta: "En intervención",
    descripcion: "Se están realizando acciones de seguimiento.",
    icon: HeartHandshake,
  },
  {
    key: "cerrado",
    etiqueta: "Cerrada",
    descripcion: "El proceso de seguimiento fue finalizado.",
    icon: CheckCircle2,
  },
];

export default function SeguimientoPage() {
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Seguimiento | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const codigoLimpio = codigo.trim().toUpperCase();

    if (!codigoLimpio) return;

    setError("");
    setResultado(null);
    setCargando(true);

    try {
      setResultado(await consultarSeguimiento(codigoLimpio));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos consultar el seguimiento."
      );
    } finally {
      setCargando(false);
    }
  }

  const estadoActual = resultado?.estado ?? null;

  const indiceActual = estadoActual
    ? ESTADOS.findIndex((estado) => estado.key === estadoActual)
    : -1;

  const estadoEncontrado =
    ESTADOS.find((estado) => estado.key === estadoActual) ?? null;

  const IconoEstado = estadoEncontrado?.icon ?? Clipboard;

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <div className="mx-auto max-w-5xl p-5 sm:p-8">
        {/* Navegación */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        {/* Encabezado */}
        <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#172554] via-[#1d4ed8] to-[#2563eb] p-6 text-white shadow-xl shadow-blue-900/10 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Clipboard size={24} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                Seguimiento de denuncia
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Consulta el estado de tu caso
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                Introduce el código que recibiste después de enviar tu
                denuncia para conocer el estado actual del proceso.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Contenido principal */}
          <section className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Código de seguimiento
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Ingresa el código exactamente como aparece en tu
                  comprobante.
                </p>
              </div>

              <form onSubmit={onSubmit}>
                <label
                  htmlFor="codigo"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Código
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="codigo"
                      value={codigo}
                      onChange={(e) =>
                        setCodigo(e.target.value.toUpperCase())
                      }
                      placeholder="BLY-XXXX-XXXX"
                      maxLength={13}
                      autoComplete="off"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 font-mono text-sm tracking-wider text-slate-800 outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={cargando}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cargando ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search size={17} />
                        Consultar
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Error */}
              {error && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <AlertCircle
                    size={19}
                    className="mt-0.5 shrink-0 text-rose-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-rose-900">
                      No encontramos la denuncia
                    </p>

                    <p className="mt-1 text-xs leading-5 text-rose-700">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Resultado */}
              {resultado && estadoEncontrado && (
                <div className="mt-8">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Estado actual
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {estadoEncontrado.etiqueta}
                      </h2>
                    </div>

                    <div className="rounded-xl bg-blue-50 px-3 py-2 text-blue-700">
                      <IconoEstado size={21} />
                    </div>
                  </div>

                  {/* Línea de progreso */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                    <div className="space-y-0">
                      {ESTADOS.map((estado, index) => {
                        const Icon = estado.icon;
                        const completado = index <= indiceActual;
                        const actual = index === indiceActual;
                        const ultimo = index === ESTADOS.length - 1;

                        return (
                          <div
                            key={estado.key}
                            className="relative flex gap-4"
                          >
                            {!ultimo && (
                              <div
                                className={`absolute left-[17px] top-9 h-[calc(100%-18px)] w-0.5 ${
                                  index < indiceActual
                                    ? "bg-blue-500"
                                    : "bg-slate-200"
                                }`}
                              />
                            )}

                            <div
                              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                                completado
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 bg-white text-slate-400"
                              } ${
                                actual ? "ring-4 ring-blue-100" : ""
                              }`}
                            >
                              {completado && index < indiceActual ? (
                                <Check size={16} strokeWidth={3} />
                              ) : (
                                <Icon size={16} />
                              )}
                            </div>

                            <div
                              className={`pb-7 ${
                                ultimo ? "pb-0" : ""
                              }`}
                            >
                              <p
                                className={`text-sm font-semibold ${
                                  actual
                                    ? "text-blue-700"
                                    : completado
                                      ? "text-slate-800"
                                      : "text-slate-400"
                                }`}
                              >
                                {estado.etiqueta}

                                {actual && (
                                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                                    Actual
                                  </span>
                                )}
                              </p>

                              <p
                                className={`mt-1 text-xs leading-5 ${
                                  completado
                                    ? "text-slate-500"
                                    : "text-slate-400"
                                }`}
                              >
                                {estado.descripcion}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Clock3 size={17} />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Denuncia recibida
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                        {new Date(resultado.creado_en).toLocaleString(
                          "es-BO",
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Código encontrado pero estado desconocido */}
              {resultado && !estadoEncontrado && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Estado registrado
                      </p>

                      <p className="mt-1 text-sm text-amber-800">
                        Estado actual:{" "}
                        <span className="font-semibold">
                          {resultado.estado}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Panel lateral */}
          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck size={21} />
              </div>

              <h2 className="mt-5 font-bold text-slate-900">
                Sobre tu seguimiento
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                El código permite consultar el estado de tu denuncia sin
                necesidad de proporcionar nuevamente tus datos.
              </p>

              <div className="mt-5 space-y-4">
                <Info
                  icon={Clipboard}
                  title="Consulta pública"
                  text="No necesitas iniciar sesión para consultar tu código."
                />

                <Info
                  icon={ShieldCheck}
                  title="Código personal"
                  text="Conserva tu código y evita compartirlo innecesariamente."
                />

                <Info
                  icon={Sparkles}
                  title="Proceso de apoyo"
                  text="La información del sistema sirve como apoyo para el seguimiento del caso."
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                ¿Aún no realizaste una denuncia?
              </p>

              <p className="mt-2 text-sm leading-5 text-slate-600">
                Puedes utilizar el formulario para reportar una situación.
              </p>

              <Link
                href="/denunciar"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Realizar una denuncia
              </Link>
            </div>
          </aside>
        </div>

        <footer className="py-8 text-center text-xs text-slate-400">
          Sistema de detección, orientación y seguimiento de casos de bullying
          y ciberbullying
        </footer>
      </div>
    </main>
  );
}

function Info({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={15} />
      </div>

      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  );
}
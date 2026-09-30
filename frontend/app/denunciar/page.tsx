"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clipboard,
  FileText,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { crearDenuncia, type DenunciaCreada } from "@/lib/api";

export default function DenunciarPage() {
  const [esAnonima, setEsAnonima] = useState(true);
  const [texto, setTexto] = useState("");
  const [lugar, setLugar] = useState("");
  const [curso, setCurso] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<DenunciaCreada | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setEnviando(true);

    try {
      const res = await crearDenuncia({
        texto: texto.trim(),
        es_anonima: esAnonima,
        lugar: lugar.trim() || undefined,
        curso: curso.trim() || undefined,
        denunciante_nombre: esAnonima ? undefined : nombre.trim() || undefined,
        denunciante_contacto:
          esAnonima ? undefined : contacto.trim() || undefined,
      });

      setResultado(res);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos enviar la denuncia. Inténtalo nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function copiarCodigo() {
    if (!resultado) return;

    try {
      await navigator.clipboard.writeText(resultado.codigo_seguimiento);
      setCopiado(true);

      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch {
      setError("No se pudo copiar el código automáticamente.");
    }
  }

  /*
   * Pantalla posterior al envío.
   */
  if (resultado) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-5 sm:p-8">
          <div className="w-full">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Volver al inicio
            </Link>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-8 text-white sm:px-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <CheckCircle2 size={30} />
                </div>

                <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                  Denuncia recibida
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50">
                  Tu reporte fue registrado correctamente. Un miembro del
                  equipo podrá revisarlo y darle seguimiento.
                </p>
              </div>

              <div className="p-6 sm:p-10">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white p-2.5 text-blue-600 shadow-sm">
                      <Clipboard size={19} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        Guarda tu código de seguimiento
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-700">
                        Necesitarás este código para consultar posteriormente
                        el estado de tu denuncia. Por privacidad, no podremos
                        recuperarlo si lo pierdes.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <div className="flex flex-1 items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-3.5">
                      <span className="font-mono text-xl font-bold tracking-[0.18em] text-slate-900 sm:text-2xl">
                        {resultado.codigo_seguimiento}
                      </span>
                    </div>

                    <button
                      onClick={copiarCodigo}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      {copiado ? <Check size={17} /> : <Clipboard size={17} />}
                      {copiado ? "¡Copiado!" : "Copiar código"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <p className="text-sm leading-6 text-amber-900">
                    Si estás en peligro inmediato o existe riesgo de que
                    alguien pueda hacerse daño, busca ayuda de un adulto de
                    confianza o de los servicios de emergencia de tu
                    localidad. No esperes al seguimiento de esta denuncia.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/seguimiento"
                    className="flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Consultar seguimiento
                  </Link>

                  <Link
                    href="/"
                    className="flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Volver al inicio
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Formulario */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="border-b border-slate-100 px-6 py-7 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <MessageSquareText size={23} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                    Reporte seguro
                  </p>

                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Cuéntanos qué ocurrió
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Comparte la situación con el mayor detalle posible. La
                    información será revisada por el equipo responsable.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6 p-6 sm:p-8">
              {/* Anonimato */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2.5 text-blue-600 shadow-sm">
                    <LockKeyhole size={18} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      ¿Quieres realizar la denuncia de forma anónima?
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Puedes decidir si deseas proporcionar tus datos de
                      contacto.
                    </p>

                    <label className="mt-4 flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={esAnonima}
                        onChange={(e) => setEsAnonima(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />

                      <span className="text-sm font-medium text-slate-700">
                        Mantener mi denuncia anónima
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Datos personales */}
              {!esAnonima && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <UserRound size={17} className="text-slate-500" />

                    <h2 className="text-sm font-semibold text-slate-800">
                      Información de contacto
                    </h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Nombre"
                      placeholder="Tu nombre"
                      value={nombre}
                      onChange={setNombre}
                      maxLength={120}
                    />

                    <Field
                      label="Contacto"
                      placeholder="Teléfono o correo"
                      value={contacto}
                      onChange={setContacto}
                      maxLength={120}
                    />
                  </div>
                </div>
              )}

              {/* Descripción */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="descripcion"
                    className="text-sm font-semibold text-slate-800"
                  >
                    ¿Qué ocurrió?
                  </label>

                  <span className="text-xs text-slate-400">
                    {texto.length}/5000
                  </span>
                </div>

                <textarea
                  id="descripcion"
                  className="min-h-[190px] w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Describe lo que ocurrió, cuándo sucedió, con qué frecuencia, dónde ocurrió y cualquier otro detalle que consideres importante..."
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  minLength={10}
                  maxLength={5000}
                  required
                />

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  No necesitas utilizar términos técnicos. Describe la
                  situación con tus propias palabras.
                </p>
              </div>

              {/* Datos del contexto */}
              <div>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Información adicional
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Estos campos son opcionales, pero pueden ayudar a
                    comprender mejor la situación.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Lugar"
                    placeholder="Ej. aula, patio, redes sociales..."
                    value={lugar}
                    onChange={setLugar}
                    maxLength={120}
                  />

                  <Field
                    label="Curso"
                    placeholder="Ej. 3ro. Secundaria"
                    value={curso}
                    onChange={setCurso}
                    maxLength={60}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                  <AlertTriangle
                    size={18}
                    className="mt-0.5 shrink-0 text-rose-600"
                  />

                  <div>
                    <p className="text-sm font-semibold">
                      No se pudo enviar la denuncia
                    </p>

                    <p className="mt-1 text-xs leading-5 text-rose-700">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Botón */}
              <div className="border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Enviando denuncia...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Enviar denuncia de forma segura
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                  Al enviar, recibirás un código único para consultar el
                  seguimiento de tu denuncia.
                </p>
              </div>
            </form>
          </section>

          {/* Panel lateral */}
          <aside className="space-y-5">
            <div className="rounded-3xl bg-gradient-to-br from-[#172554] to-[#2563eb] p-6 text-white shadow-xl shadow-blue-900/10">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck size={22} />
              </div>

              <h2 className="mt-5 text-lg font-bold">
                Tu seguridad es importante
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                El sistema está diseñado para recibir reportes y facilitar su
                seguimiento por parte del equipo responsable.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Antes de enviar
              </h2>

              <div className="mt-5 space-y-4">
                <InfoCard
                  icon={LockKeyhole}
                  titulo="Puedes denunciar anónimamente"
                  texto="Si eliges esta opción, no se envían tu nombre ni tu contacto."
                />

                <InfoCard
                  icon={Sparkles}
                  titulo="Análisis como apoyo"
                  texto="La inteligencia artificial ayuda a organizar y analizar la información, pero no reemplaza al profesional."
                />

                <InfoCard
                  icon={FileText}
                  titulo="Guarda tu código"
                  texto="El código de seguimiento se muestra una sola vez después de enviar la denuncia."
                />
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <div>
                  <h3 className="text-sm font-semibold text-amber-900">
                    ¿Existe peligro inmediato?
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Busca inmediatamente a un adulto de confianza o contacta
                    con los servicios de emergencia de tu localidad.
                  </p>
                </div>
              </div>
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

function Field({
  label,
  placeholder,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
      />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  titulo,
  texto,
}: {
  icon: typeof LockKeyhole;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon size={16} />
      </div>

      <div>
        <p className="text-sm font-medium text-slate-800">{titulo}</p>

        <p className="mt-1 text-xs leading-5 text-slate-500">{texto}</p>
      </div>
    </div>
  );
}
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileText,
  HelpCircle,
  Info,
  Lightbulb,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
  agregarNota,
  cambiarEstado,
  getToken,
  obtenerCaso,
  reanalizarCaso,
  SesionError,
  type CasoDetalle,
  type Estado,
} from "@/lib/api";

import {
  ETIQUETAS_CLASIFICACION,
  ETIQUETAS_ESTADO,
  ETIQUETAS_TIPO,
  SeveridadBadge,
  formatearFecha,
} from "@/components/panel/badges";

function SectionHeader({
  icon: Icon,
  titulo,
  descripcion,
}: {
  icon: ElementType;
  titulo: string;
  descripcion?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Icon size={19} />
      </div>

      <div>
        <h2 className="font-semibold tracking-tight text-slate-900">
          {titulo}
        </h2>

        {descripcion && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {descripcion}
          </p>
        )}
      </div>
    </div>
  );
}

function ListaAnalisis({
  titulo,
  items,
  icon: Icon,
  variant = "default",
}: {
  titulo: string;
  items: string[];
  icon: ElementType;
  variant?: "default" | "warning" | "success" | "info";
}) {
  if (items.length === 0) return null;

  const estilos = {
    default: {
      contenedor: "bg-slate-50 border-slate-100",
      icono: "bg-white text-slate-500",
    },
    warning: {
      contenedor: "bg-amber-50/70 border-amber-100",
      icono: "bg-white text-amber-600",
    },
    success: {
      contenedor: "bg-emerald-50/70 border-emerald-100",
      icono: "bg-white text-emerald-600",
    },
    info: {
      contenedor: "bg-blue-50/70 border-blue-100",
      icono: "bg-white text-blue-600",
    },
  };

  const estilo = estilos[variant];

  return (
    <div className={`rounded-2xl border p-4 ${estilo.contenedor}`}>
      <div className="mb-3 flex items-center gap-2">
        <div className={`rounded-lg p-1.5 ${estilo.icono}`}>
          <Icon size={15} />
        </div>

        <h3 className="text-sm font-semibold text-slate-800">{titulo}</h3>
      </div>

      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex gap-2.5 text-sm leading-6 text-slate-700"
          >
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoItem({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {titulo}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">{valor}</p>
    </div>
  );
}

export default function CasoPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [caso, setCaso] = useState<CasoDetalle | null>(null);
  const [error, setError] = useState("");
  const [nota, setNota] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [reanalizando, setReanalizando] = useState(false);

  const activo = useRef(true);

  useEffect(() => {
    activo.current = true;

    return () => {
      activo.current = false;
    };
  }, []);

  const manejarError = useCallback(
    (err: unknown) => {
      if (err instanceof SesionError) {
        router.replace("/login");
        return;
      }

      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    },
    [router]
  );

  const cargar = useCallback(async () => {
    try {
      const resultado = await obtenerCaso(id);

      if (activo.current) {
        setCaso(resultado);
        setError("");
      }
    } catch (err) {
      manejarError(err);
    }
  }, [id, manejarError]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    cargar();
  }, [cargar, router]);

  /*
   * Mientras no exista análisis IA o solamente exista el análisis
   * de respaldo basado en reglas, consultamos periódicamente.
   */
  const sinIA =
    caso !== null &&
    (caso.analisis === null || caso.analisis.es_respaldo);

  useEffect(() => {
    if (!sinIA) return;

    const intervalo = setInterval(cargar, 8000);

    return () => clearInterval(intervalo);
  }, [sinIA, cargar]);

  async function reanalizar() {
    setReanalizando(true);
    setError("");

    try {
      const previo = caso?.analisis?.creado_en ?? null;

      await reanalizarCaso(id);

      const limite = Date.now() + 10 * 60 * 1000;

      while (activo.current && Date.now() < limite) {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        if (!activo.current) break;

        const actualizado = await obtenerCaso(id);

        if (!activo.current) break;

        setCaso(actualizado);

        if ((actualizado.analisis?.creado_en ?? null) !== previo) {
          break;
        }
      }
    } catch (err) {
      manejarError(err);
    } finally {
      if (activo.current) {
        setReanalizando(false);
      }
    }
  }

  async function accion(fn: () => Promise<CasoDetalle>) {
    setOcupado(true);
    setError("");

    try {
      const resultado = await fn();

      if (activo.current) {
        setCaso(resultado);
      }
    } catch (err) {
      manejarError(err);
    } finally {
      if (activo.current) {
        setOcupado(false);
      }
    }
  }

  /*
   * Estado de carga inicial.
   */
  if (!caso) {
    return (
      <main className="min-h-screen bg-[#f6f8fc]">
        <div className="mx-auto max-w-5xl p-5 sm:p-8">
          <Link
            href="/panel"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Volver al panel
          </Link>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
            <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
              <div className="mb-5 rounded-2xl bg-blue-50 p-4 text-blue-600">
                <LoaderCircle size={30} className="animate-spin" />
              </div>

              <h1 className="text-lg font-semibold text-slate-800">
                Cargando caso
              </h1>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Estamos recuperando la información del caso y su análisis.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const a = caso.analisis;

  const clasificacion =
    a?.clasificacion
      ? ETIQUETAS_CLASIFICACION[a.clasificacion] ?? a.clasificacion
      : "Pendiente de análisis";

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <div className="mx-auto max-w-[1400px] p-5 sm:p-8">
        {/* Navegación */}
        <div className="mb-6">
          <Link
            href="/panel"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Volver al panel
          </Link>
        </div>

        {/* Encabezado */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                  caso.riesgo_critico
                    ? "bg-rose-100 text-rose-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {caso.riesgo_critico ? (
                  <ShieldAlert size={27} />
                ) : (
                  <FileText size={27} />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Caso #{caso.id}
                  </span>

                  {caso.es_anonima && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      Reporte anónimo
                    </span>
                  )}
                </div>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Detalle del caso
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Registrado el {formatearFecha(caso.creado_en)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SeveridadBadge severidad={a?.severidad ?? null} />

              <select
                value={caso.estado}
                disabled={ocupado}
                onChange={(e) =>
                  accion(
                    () =>
                      cambiarEstado(
                        id,
                        e.target.value as Estado
                      )
                  )
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
              >
                {Object.entries(ETIQUETAS_ESTADO).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Información rápida */}
          <div className="mt-7 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <InfoItem
              titulo="Estado"
              valor={ETIQUETAS_ESTADO[caso.estado] ?? caso.estado}
            />

            <InfoItem
              titulo="Clasificación"
              valor={clasificacion}
            />

            <InfoItem
              titulo="Lugar"
              valor={caso.lugar || "No especificado"}
            />

            <InfoItem
              titulo="Curso"
              valor={caso.curso || "No especificado"}
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
            <AlertTriangle className="mt-0.5 shrink-0" size={19} />

            <div>
              <p className="text-sm font-semibold">
                No se pudo completar la operación
              </p>

              <p className="mt-1 text-sm leading-6 text-rose-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Riesgo crítico */}
        {caso.riesgo_critico && (
          <section className="mb-6 overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 shadow-sm">
            <div className="flex gap-4 border-l-4 border-rose-500 p-5 sm:p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h2 className="font-bold text-rose-900">
                  Señal de riesgo crítico detectada
                </h2>

                <p className="mt-1 max-w-4xl text-sm leading-6 text-rose-800">
                  Este caso contiene señales que requieren atención prioritaria
                  por parte de una persona capacitada. El sistema no sustituye
                  la valoración profesional ni determina por sí mismo una
                  situación clínica.
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            {/* Denuncia original */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={MessageSquareText}
                titulo="Denuncia recibida"
                descripcion="Contenido original proporcionado en el reporte."
              />

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {caso.texto}
                </p>
              </div>

              <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <InfoItem
                  titulo="Fecha de recepción"
                  valor={formatearFecha(caso.creado_en)}
                />

                <InfoItem
                  titulo="Identidad"
                  valor={
                    caso.es_anonima
                      ? "Denuncia anónima"
                      : caso.denunciante_nombre || "No especificada"
                  }
                />

                {!caso.es_anonima && (
                  <>
                    <InfoItem
                      titulo="Nombre del denunciante"
                      valor={caso.denunciante_nombre || "No especificado"}
                    />

                    <InfoItem
                      titulo="Contacto"
                      valor={caso.denunciante_contacto || "No especificado"}
                    />
                  </>
                )}
              </div>
            </section>

            {/* Análisis IA */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <SectionHeader
                    icon={BrainCircuit}
                    titulo="Análisis de apoyo con IA"
                    descripcion="Resultado automático generado como apoyo para la valoración profesional."
                  />

                  <button
                    disabled={reanalizando}
                    onClick={reanalizar}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      size={16}
                      className={reanalizando ? "animate-spin" : ""}
                    />

                    {reanalizando
                      ? "Analizando..."
                      : "Volver a analizar"}
                  </button>
                </div>

                <div className="mt-2 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800">
                  <Info size={15} className="mt-0.5 shrink-0" />

                  <p>
                    La IA funciona como herramienta de apoyo. No realiza
                    diagnósticos ni sustituye la valoración, entrevista o
                    decisión del equipo profesional.
                  </p>
                </div>
              </div>

              {!a && (
                <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 rounded-2xl bg-blue-50 p-4 text-blue-600">
                    <BrainCircuit size={30} />
                  </div>

                  <h3 className="font-semibold text-slate-800">
                    Análisis en proceso
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    El sistema está procesando la denuncia. Esta pantalla se
                    actualizará automáticamente cuando exista un resultado.
                  </p>

                  <LoaderCircle
                    size={20}
                    className="mt-5 animate-spin text-blue-600"
                  />
                </div>
              )}

              {a && (
                <div className="space-y-6 p-6 sm:p-7">
                  {a.es_respaldo && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <Clock3
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />

                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          Análisis preliminar disponible
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Actualmente se muestra un análisis básico basado en
                          reglas. Si la IA está activa, el resultado se
                          actualizará automáticamente cuando finalice.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Clasificación */}
                  <div>
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Clasificación detectada
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                        {clasificacion}
                      </span>

                      {a.tipos.map((tipo) => (
                        <span
                          key={tipo}
                          className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600"
                        >
                          {ETIQUETAS_TIPO[tipo] ?? tipo}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles size={17} className="text-blue-600" />

                      <h3 className="text-sm font-semibold text-slate-800">
                        Resumen del análisis
                      </h3>
                    </div>

                    <p className="text-sm leading-7 text-slate-700">
                      {a.resumen}
                    </p>
                  </div>

                  {/* Indicadores */}
                  <ListaAnalisis
                    titulo="Indicadores de riesgo"
                    items={a.indicadores_riesgo}
                    icon={ShieldAlert}
                    variant={
                      a.indicadores_riesgo.length > 0
                        ? "warning"
                        : "default"
                    }
                  />

                  {/* Impacto emocional */}
                  <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <BrainCircuit size={17} className="text-violet-600" />

                      <h3 className="text-sm font-semibold text-slate-800">
                        Posible impacto emocional
                      </h3>
                    </div>

                    <p className="text-sm leading-7 text-slate-700">
                      {a.impacto_emocional}
                    </p>
                  </div>

                  {/* Recomendaciones */}
                  <ListaAnalisis
                    titulo="Acciones recomendadas"
                    items={a.recomendaciones}
                    icon={Lightbulb}
                    variant="success"
                  />

                  {/* Preguntas */}
                  <ListaAnalisis
                    titulo="Preguntas para la entrevista"
                    items={a.preguntas_seguimiento}
                    icon={HelpCircle}
                    variant="info"
                  />

                  {/* Fuentes */}
                  <ListaAnalisis
                    titulo="Fuentes de la base de conocimiento"
                    items={a.fuentes}
                    icon={FileText}
                  />

                  {/* Metadata */}
                  <div className="border-t border-slate-100 pt-5">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                      {a.modelo && (
                        <span>
                          <strong className="font-medium text-slate-500">
                            Modelo:
                          </strong>{" "}
                          {a.modelo}
                        </span>
                      )}

                      <span>
                        <strong className="font-medium text-slate-500">
                          Analizado:
                        </strong>{" "}
                        {formatearFecha(a.creado_en)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Columna lateral */}
          <aside className="space-y-6">
            {/* Estado */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={CheckCircle2}
                titulo="Seguimiento"
                descripcion="Control del estado actual del caso."
              />

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Estado actual
                </p>

                <div className="mt-3">
                  <span className="inline-flex rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                    {ETIQUETAS_ESTADO[caso.estado] ?? caso.estado}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold text-slate-500">
                  Cambiar estado
                </label>

                <select
                  value={caso.estado}
                  disabled={ocupado}
                  onChange={(e) =>
                    accion(
                      () =>
                        cambiarEstado(
                          id,
                          e.target.value as Estado
                        )
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                >
                  {Object.entries(ETIQUETAS_ESTADO).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Información del reporte */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={UserRound}
                titulo="Información del reporte"
              />

              <div className="space-y-4">
                <InfoItem
                  titulo="Modalidad"
                  valor={
                    caso.es_anonima
                      ? "Reporte anónimo"
                      : "Reporte identificado"
                  }
                />

                <InfoItem
                  titulo="Lugar"
                  valor={caso.lugar || "No especificado"}
                />

                <InfoItem
                  titulo="Curso"
                  valor={caso.curso || "No especificado"}
                />

                {!caso.es_anonima && (
                  <>
                    <InfoItem
                      titulo="Denunciante"
                      valor={caso.denunciante_nombre || "No especificado"}
                    />

                    <InfoItem
                      titulo="Contacto"
                      valor={
                        caso.denunciante_contacto || "No especificado"
                      }
                    />
                  </>
                )}
              </div>
            </section>

            {/* Notas */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={MessageSquareText}
                titulo="Notas profesionales"
                descripcion="Registra entrevistas, acciones y acuerdos."
              />

              <div className="space-y-3">
                {caso.notas.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <MessageSquareText
                      size={20}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Aún no hay notas registradas.
                    </p>
                  </div>
                ) : (
                  caso.notas.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {n.texto}
                      </p>

                      <div className="mt-3 flex items-center gap-2 border-t border-slate-200/70 pt-3 text-[11px] text-slate-400">
                        <span className="font-medium text-slate-500">
                          {n.autor}
                        </span>

                        <span>•</span>

                        <span>{formatearFecha(n.creado_en)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                className="mt-5"
                onSubmit={async (e) => {
                  e.preventDefault();

                  if (!nota.trim()) return;

                  await accion(() => agregarNota(id, nota));
                  setNota("");
                }}
              >
                <textarea
                  className="min-h-[110px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Agregar una nota sobre la intervención, entrevista, seguimiento o acuerdo..."
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  maxLength={3000}
                />

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    {nota.length}/3000
                  </span>

                  <button
                    type="submit"
                    disabled={ocupado || !nota.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={15} />
                    Guardar nota
                  </button>
                </div>
              </form>
            </section>
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
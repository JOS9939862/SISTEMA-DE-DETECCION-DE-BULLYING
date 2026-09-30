"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import {
  clearToken,
  getToken,
  listarCasos,
  obtenerEstadisticas,
  SesionError,
  type CasoResumen,
  type Estadisticas,
} from "@/lib/api";

import {
  ETIQUETAS_ESTADO,
  ETIQUETAS_TIPO,
  EstadoBadge,
  SeveridadBadge,
  formatearFecha,
} from "@/components/panel/badges";

export default function PanelPage() {
  const router = useRouter();

  const [casos, setCasos] = useState<CasoResumen[]>([]);
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cargar = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setActualizando(true);
        }

        const [c, s] = await Promise.all([
          listarCasos(filtro || undefined),
          obtenerEstadisticas(),
        ]);

        setCasos(c);
        setStats(s);
        setError("");
      } catch (err) {
        if (err instanceof SesionError) {
          router.replace("/login");
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "No se pudo actualizar la información."
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [filtro, router]
  );

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    cargar();

    const intervalo = setInterval(() => {
      cargar();
    }, 30000);

    return () => clearInterval(intervalo);
  }, [cargar, router]);

  function salir() {
    clearToken();
    router.replace("/login");
  }

  const total = stats?.total ?? 0;
  const nuevos = stats?.por_estado?.nuevo ?? 0;
  const enRevision = stats?.por_estado?.en_revision ?? 0;
  const enIntervencion = stats?.por_estado?.en_intervencion ?? 0;
  const cerrados = stats?.por_estado?.cerrado ?? 0;
  const criticos = stats?.criticos_abiertos ?? 0;

  const severidades = useMemo(() => {
    const valores = stats?.por_severidad ?? {};

    return [
      {
        nombre: "Baja",
        valor: valores.baja ?? 0,
        clase: "bg-emerald-500",
        fondo: "bg-emerald-50",
        texto: "text-emerald-700",
      },
      {
        nombre: "Media",
        valor: valores.media ?? 0,
        clase: "bg-amber-500",
        fondo: "bg-amber-50",
        texto: "text-amber-700",
      },
      {
        nombre: "Alta",
        valor: valores.alta ?? 0,
        clase: "bg-orange-500",
        fondo: "bg-orange-50",
        texto: "text-orange-700",
      },
      {
        nombre: "Crítica",
        valor: valores.critica ?? 0,
        clase: "bg-rose-500",
        fondo: "bg-rose-50",
        texto: "text-rose-700",
      },
    ];
  }, [stats]);

  const estados = [
    {
      nombre: "Nuevos",
      valor: nuevos,
      icono: FileText,
      clase: "text-blue-600",
      fondo: "bg-blue-50",
    },
    {
      nombre: "En revisión",
      valor: enRevision,
      icono: Clock3,
      clase: "text-violet-600",
      fondo: "bg-violet-50",
    },
    {
      nombre: "En intervención",
      valor: enIntervencion,
      icono: Users,
      clase: "text-amber-600",
      fondo: "bg-amber-50",
    },
    {
      nombre: "Cerrados",
      valor: cerrados,
      icono: CheckCircle2,
      clase: "text-emerald-600",
      fondo: "bg-emerald-50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">
      {/* Sidebar móvil */}
      {menuAbierto && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#111827] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <ShieldAlert size={22} />
            </div>

            <div>
              <p className="text-sm font-bold tracking-wide">SISTEMA</p>
              <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400">
                ANTI-BULLYING
              </p>
            </div>
          </div>

          <button
            onClick={() => setMenuAbierto(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Principal
          </p>

          <Link
            href="/panel"
            className="flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-3 text-sm font-medium shadow-lg shadow-blue-600/20"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </Link>

          <p className="mb-3 mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Gestión
          </p>

          <Link
            href="/panel"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <FileText size={19} />
            Casos
          </Link>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-300">
                O
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  Personal autorizado
                </p>
                <p className="text-xs text-slate-400">Panel de orientación</p>
              </div>
            </div>
          </div>

          <button
            onClick={salir}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <div className="lg:pl-[260px]">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuAbierto(true)}
                className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-xs font-medium text-slate-400">
                  Plataforma de seguimiento
                </p>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Panel de casos
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => cargar(true)}
                disabled={actualizando}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={actualizando ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50">
                <Bell size={18} />
                {criticos > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">
          {/* Bienvenida */}
          <section className="mb-8">
            <div className="rounded-2xl bg-gradient-to-br from-[#172554] via-[#1e3a8a] to-[#2563eb] p-6 text-white shadow-xl shadow-blue-900/10 sm:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-blue-200">
                    <BarChart3 size={17} />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                      Resumen operativo
                    </span>
                  </div>

                  <h2 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
                    Monitorea y da seguimiento a los casos reportados.
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                    Revisa las situaciones pendientes, identifica señales
                    críticas y consulta el análisis generado como apoyo a la
                    intervención profesional.
                  </p>
                </div>

                <div className="hidden h-24 w-24 items-center justify-center rounded-2xl border border-white/15 bg-white/10 md:flex">
                  <ShieldAlert size={42} className="text-blue-100" />
                </div>
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
              <AlertTriangle className="mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-sm font-semibold">No se pudo actualizar</p>
                <p className="mt-1 text-sm text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* Métricas */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              titulo="Total de casos"
              valor={total}
              descripcion="Casos registrados"
              icono={FileText}
              iconClass="bg-blue-50 text-blue-600"
            />

            <MetricCard
              titulo="Casos nuevos"
              valor={nuevos}
              descripcion="Pendientes de revisión"
              icono={Clock3}
              iconClass="bg-violet-50 text-violet-600"
            />

            <MetricCard
              titulo="En intervención"
              valor={enIntervencion}
              descripcion="Casos en seguimiento"
              icono={Users}
              iconClass="bg-amber-50 text-amber-600"
            />

            <MetricCard
              titulo="Riesgo crítico"
              valor={criticos}
              descripcion={
                criticos > 0
                  ? "Requieren atención prioritaria"
                  : "Sin casos críticos abiertos"
              }
              icono={criticos > 0 ? AlertTriangle : CheckCircle2}
              iconClass={
                criticos > 0
                  ? "bg-rose-50 text-rose-600"
                  : "bg-emerald-50 text-emerald-600"
              }
              destacado={criticos > 0}
            />
          </section>

          {/* Gráficos */}
          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            {/* Estados */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Estado de los casos
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Distribución actual por etapa de atención
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 text-slate-500">
                  <BarChart3 size={18} />
                </div>
              </div>

              <div className="space-y-5">
                {estados.map((estado) => {
                  const Icon = estado.icono;
                  const porcentaje =
                    total > 0 ? Math.round((estado.valor / total) * 100) : 0;

                  return (
                    <div key={estado.nombre}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`rounded-lg p-1.5 ${estado.fondo} ${estado.clase}`}
                          >
                            <Icon size={15} />
                          </div>

                          <span className="text-sm font-medium text-slate-700">
                            {estado.nombre}
                          </span>
                        </div>

                        <span className="text-sm font-semibold text-slate-900">
                          {estado.valor}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${estado.clase.replace(
                            "text-",
                            "bg-"
                          )}`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Severidad */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Nivel de severidad
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Distribución según el análisis de los casos
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 text-slate-500">
                  <ShieldAlert size={18} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {severidades.map((item) => {
                  const porcentaje =
                    total > 0 ? Math.round((item.valor / total) * 100) : 0;

                  return (
                    <div
                      key={item.nombre}
                      className={`rounded-2xl border border-slate-100 p-4 ${item.fondo}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${item.texto}`}>
                          {item.nombre}
                        </span>

                        <span
                          className={`h-2.5 w-2.5 rounded-full ${item.clase}`}
                        />
                      </div>

                      <p className="mt-3 text-2xl font-bold text-slate-900">
                        {item.valor}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {porcentaje}% del total
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Casos */}
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Casos registrados
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Consulta y seguimiento de las situaciones reportadas.
                </p>
              </div>

              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <option value="">Todos los estados</option>

                {Object.entries(ETIQUETAS_ESTADO).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {cargando ? (
              <div className="flex min-h-[240px] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw
                    size={24}
                    className="animate-spin text-blue-600"
                  />
                  <p className="text-sm text-slate-500">
                    Cargando casos...
                  </p>
                </div>
              </div>
            ) : casos.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
                  <FileText size={28} />
                </div>

                <h4 className="font-semibold text-slate-800">
                  No hay casos para mostrar
                </h4>

                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  No existen casos que coincidan con el filtro seleccionado.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Prioridad
                      </th>
                      <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Caso
                      </th>
                      <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Tipo
                      </th>
                      <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Ubicación
                      </th>
                      <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Fecha
                      </th>
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>

                  <tbody>
                    {casos.map((caso) => (
                      <tr
                        key={caso.id}
                        className={`group border-b border-slate-100 transition hover:bg-slate-50/80 ${
                          caso.riesgo_critico ? "bg-rose-50/40" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {caso.riesgo_critico && (
                              <span
                                title="Riesgo crítico"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600"
                              >
                                <AlertTriangle size={15} />
                              </span>
                            )}

                            <SeveridadBadge severidad={caso.severidad} />
                          </div>
                        </td>

                        <td className="max-w-[300px] px-6 py-4">
                          <div>
                            <p className="truncate text-sm font-medium text-slate-800">
                              {caso.extracto}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Caso #{caso.id}
                              {caso.es_anonima && " · Reporte anónimo"}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex max-w-[180px] flex-wrap gap-1.5">
                            {caso.tipos.length > 0 ? (
                              caso.tipos.slice(0, 2).map((tipo) => (
                                <span
                                  key={tipo}
                                  className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                                >
                                  {ETIQUETAS_TIPO[tipo] ?? tipo}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="max-w-[170px]">
                            <p className="truncate text-sm text-slate-600">
                              {caso.lugar || "Sin ubicación"}
                            </p>

                            {caso.curso && (
                              <p className="mt-1 truncate text-xs text-slate-400">
                                {caso.curso}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <EstadoBadge estado={caso.estado} />
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                          {formatearFecha(caso.creado_en)}
                        </td>

                        <td className="px-6 py-4">
                          <Link
                            href={`/panel/casos/${caso.id}`}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Ver caso"
                          >
                            <ChevronRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="py-8 text-center text-xs text-slate-400">
            Sistema de detección, orientación y seguimiento de casos de
            bullying y ciberbullying
          </footer>
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  titulo,
  valor,
  descripcion,
  icono: Icon,
  iconClass,
  destacado = false,
}: {
  titulo: string;
  valor: number;
  descripcion: string;
  icono: React.ElementType;
  iconClass: string;
  destacado?: boolean;
}) {
  return (
    <div
      className={`group rounded-2xl border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        destacado
          ? "border-rose-200 ring-1 ring-rose-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {valor}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon size={20} />
        </div>
      </div>

      <p
        className={`mt-4 text-xs ${
          destacado ? "font-medium text-rose-600" : "text-slate-400"
        }`}
      >
        {descripcion}
      </p>
    </div>
  );
}
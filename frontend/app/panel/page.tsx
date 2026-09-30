"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  const cargar = useCallback(async () => {
    try {
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
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }, [filtro, router]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    cargar();
    const t = setInterval(cargar, 30000); // refresca cada 30 s
    return () => clearInterval(t);
  }, [cargar, router]);

  function salir() {
    clearToken();
    router.replace("/login");
  }

  const tarjetas = [
    { titulo: "Total de casos", valor: stats?.total ?? 0, alerta: false },
    { titulo: "Críticos abiertos", valor: stats?.criticos_abiertos ?? 0, alerta: true },
    { titulo: "Nuevos", valor: stats?.por_estado?.nuevo ?? 0, alerta: false },
    { titulo: "En revisión", valor: stats?.por_estado?.en_revision ?? 0, alerta: false },
  ];

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Panel de casos</h1>
        <button onClick={salir} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100">
          Cerrar sesión
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tarjetas.map((t) => (
          <div
            key={t.titulo}
            className={`rounded-lg border p-4 ${
              t.alerta && t.valor > 0 ? "border-red-500 bg-red-50" : ""
            }`}
          >
            <p className="text-sm text-gray-600">{t.titulo}</p>
            <p className="text-3xl font-semibold">{t.valor}</p>
          </div>
        ))}
      </div>

      {stats && Object.keys(stats.por_tipo).length > 0 && (
        <p className="mt-4 text-sm text-gray-600">
          <span className="font-medium">Por tipo: </span>
          {Object.entries(stats.por_tipo)
            .map(([k, v]) => `${ETIQUETAS_TIPO[k] ?? k} (${v})`)
            .join(" · ")}
          {Object.keys(stats.por_lugar).length > 0 && (
            <>
              {" "}
              <span className="font-medium">| Lugares frecuentes: </span>
              {Object.entries(stats.por_lugar)
                .map(([k, v]) => `${k} (${v})`)
                .join(" · ")}
            </>
          )}
        </p>
      )}

      <div className="mt-6 flex items-center gap-2">
        <label className="text-sm">Estado:</label>
        <select
          className="rounded-md border p-1 text-sm"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="">Todos</option>
          {Object.entries(ETIQUETAS_ESTADO).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {cargando && <p className="mt-4 text-sm text-gray-600">Cargando…</p>}

      <div className="mt-3 overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3">Prioridad</th>
              <th className="p-3">Resumen</th>
              <th className="p-3">Tipos</th>
              <th className="p-3">Lugar / Curso</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Fecha</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {casos.length === 0 && !cargando && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No hay casos para mostrar.
                </td>
              </tr>
            )}
            {casos.map((c) => (
              <tr key={c.id} className={`border-t ${c.riesgo_critico ? "bg-red-50" : ""}`}>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {c.riesgo_critico && <span title="Riesgo crítico">⚠️</span>}
                    <SeveridadBadge severidad={c.severidad} />
                  </div>
                </td>
                <td className="max-w-xs p-3">{c.extracto}</td>
                <td className="p-3">
                  {c.tipos.map((t) => ETIQUETAS_TIPO[t] ?? t).join(", ") || "—"}
                </td>
                <td className="p-3">
                  {[c.lugar, c.curso].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="p-3">
                  <EstadoBadge estado={c.estado} />
                </td>
                <td className="whitespace-nowrap p-3">{formatearFecha(c.creado_en)}</td>
                <td className="p-3">
                  <Link href={`/panel/casos/${c.id}`} className="underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
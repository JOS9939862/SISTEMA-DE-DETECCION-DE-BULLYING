"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

function Lista({ titulo, items }: { titulo: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="font-medium">{titulo}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
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
      setError(err instanceof Error ? err.message : "Error inesperado");
    },
    [router]
  );

  const cargar = useCallback(async () => {
    try {
      setCaso(await obtenerCaso(id));
      setError("");
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

  // Mientras falte el análisis o solo exista el preliminar por reglas, consulta cada 8 s
  const sinIA = caso !== null && (caso.analisis === null || caso.analisis.es_respaldo);
  useEffect(() => {
    if (!sinIA) return;
    const t = setInterval(cargar, 8000);
    return () => clearInterval(t);
  }, [sinIA, cargar]);

  // El re-análisis corre en segundo plano (puede tardar minutos con un modelo local):
  // se consulta hasta que cambie la fecha del análisis o pasen 10 minutos.
  async function reanalizar() {
    setReanalizando(true);
    try {
      const previo = caso?.analisis?.creado_en ?? null;
      await reanalizarCaso(id);
      const limite = Date.now() + 10 * 60 * 1000;
      while (activo.current && Date.now() < limite) {
        await new Promise((r) => setTimeout(r, 5000));
        if (!activo.current) break;
        const c = await obtenerCaso(id);
        setCaso(c);
        if ((c.analisis?.creado_en ?? null) !== previo) break;
      }
    } catch (err) {
      manejarError(err);
    } finally {
      if (activo.current) setReanalizando(false);
    }
  }

  async function accion(fn: () => Promise<CasoDetalle>) {
    setOcupado(true);
    try {
      setCaso(await fn());
      setError("");
    } catch (err) {
      manejarError(err);
    } finally {
      setOcupado(false);
    }
  }

  if (!caso) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <Link href="/panel" className="text-sm underline">
          ← Volver al panel
        </Link>
        <p className="mt-4 text-sm">{error || "Cargando…"}</p>
      </main>
    );
  }

  const a = caso.analisis;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/panel" className="text-sm underline">
        ← Volver al panel
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Caso #{caso.id}</h1>
          {caso.riesgo_critico && <span title="Riesgo crítico">⚠️</span>}
          <SeveridadBadge severidad={a?.severidad ?? null} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Estado:</label>
          <select
            className="rounded-md border p-1 text-sm"
            value={caso.estado}
            disabled={ocupado}
            onChange={(e) => accion(() => cambiarEstado(id, e.target.value as Estado))}
          >
            {Object.entries(ETIQUETAS_ESTADO).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {caso.riesgo_critico && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-sm">
          <strong>Riesgo crítico detectado.</strong> Este caso requiere atención inmediata de una
          persona capacitada. No esperes al seguimiento habitual.
        </div>
      )}

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Denuncia</h2>
        <p className="mt-1 text-xs text-gray-600">
          Recibida el {formatearFecha(caso.creado_en)}
          {caso.lugar ? ` · Lugar: ${caso.lugar}` : ""}
          {caso.curso ? ` · Curso: ${caso.curso}` : ""}
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm">{caso.texto}</p>
        <p className="mt-3 text-sm text-gray-700">
          {caso.es_anonima
            ? "Denuncia anónima: no existe información de identidad."
            : `Denunciante: ${caso.denunciante_nombre ?? "—"} · Contacto: ${
                caso.denunciante_contacto ?? "—"
              }`}
        </p>
      </section>

      <section className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Análisis de apoyo con IA</h2>
          <button
            disabled={reanalizando}
            onClick={reanalizar}
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            {reanalizando ? "Analizando con IA…" : "Volver a analizar"}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-600">
          Es una ayuda automática, no un diagnóstico. La valoración y las decisiones
          corresponden al equipo profesional.
        </p>

        {!a && <p className="mt-4 text-sm">Analizando la denuncia…</p>}

        {a && (
          <>
            {a.es_respaldo && (
              <p className="mt-3 rounded-md bg-yellow-50 p-2 text-xs">
                Se muestra un análisis básico por reglas. Si la IA está activa, se actualizará
                automáticamente cuando termine (puede tardar unos minutos).
              </p>
            )}
            <p className="mt-3 text-sm">
              <span className="font-medium">Clasificación: </span>
              {ETIQUETAS_CLASIFICACION[a.clasificacion] ?? a.clasificacion}
              {a.tipos.length > 0 && (
                <>
                  {" · "}
                  <span className="font-medium">Tipos: </span>
                  {a.tipos.map((t) => ETIQUETAS_TIPO[t] ?? t).join(", ")}
                </>
              )}
            </p>
            <div className="mt-3">
              <h3 className="font-medium">Resumen</h3>
              <p className="mt-1 text-sm">{a.resumen}</p>
            </div>
            <Lista titulo="Indicadores de riesgo" items={a.indicadores_riesgo} />
            <div className="mt-4">
              <h3 className="font-medium">Posible impacto emocional</h3>
              <p className="mt-1 text-sm">{a.impacto_emocional}</p>
            </div>
            <Lista titulo="Acciones recomendadas" items={a.recomendaciones} />
            <Lista titulo="Preguntas para la entrevista" items={a.preguntas_seguimiento} />
            <Lista titulo="Fuentes de la base de conocimiento" items={a.fuentes} />
            <p className="mt-4 text-xs text-gray-500">
              {a.modelo ? `Modelo: ${a.modelo} · ` : ""}Analizado el {formatearFecha(a.creado_en)}
            </p>
          </>
        )}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-medium">Notas del caso</h2>
        <div className="mt-3 space-y-3">
          {caso.notas.length === 0 && (
            <p className="text-sm text-gray-500">Aún no hay notas.</p>
          )}
          {caso.notas.map((n) => (
            <div key={n.id} className="rounded-md bg-gray-50 p-3 text-sm">
              <p className="whitespace-pre-wrap">{n.texto}</p>
              <p className="mt-1 text-xs text-gray-500">
                {n.autor} · {formatearFecha(n.creado_en)}
              </p>
            </div>
          ))}
        </div>
        <form
          className="mt-4 space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!nota.trim()) return;
            await accion(() => agregarNota(id, nota));
            setNota("");
          }}
        >
          <textarea
            className="min-h-20 w-full rounded-md border p-2 text-sm"
            placeholder="Agregar una nota (entrevistas, acciones, acuerdos...)"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={3000}
          />
          <button
            type="submit"
            disabled={ocupado || !nota.trim()}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Guardar nota
          </button>
        </form>
      </section>
    </main>
  );
}
"use client";

import { useState } from "react";
import { consultarSeguimiento, type Seguimiento } from "@/lib/api";

const ETIQUETAS: Record<string, string> = {
  nuevo: "Recibida",
  en_revision: "En revisión",
  en_intervencion: "En intervención",
  cerrado: "Cerrada",
};

export default function SeguimientoPage() {
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Seguimiento | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResultado(null);
    setCargando(true);
    try {
      setResultado(await consultarSeguimiento(codigo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Consultar seguimiento</h1>
      <p className="mt-1 text-sm text-gray-600">
        Ingresa el código que recibiste al hacer tu denuncia.
      </p>

      <form onSubmit={onSubmit} className="mt-6 flex gap-2">
        <input
          className="flex-1 rounded-md border p-2 font-mono uppercase"
          placeholder="BLY-XXXX-XXXX"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={cargando}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {cargando ? "Buscando..." : "Consultar"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {resultado && (
        <div className="mt-6 rounded-lg border p-4">
          <p className="text-sm text-gray-600">Estado actual</p>
          <p className="text-xl font-semibold">
            {ETIQUETAS[resultado.estado] ?? resultado.estado}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Recibida el {new Date(resultado.creado_en).toLocaleString("es-BO")}
          </p>
        </div>
      )}
    </main>
  );
}
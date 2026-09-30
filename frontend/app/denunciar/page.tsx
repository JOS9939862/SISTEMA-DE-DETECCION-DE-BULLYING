"use client";

import { useState } from "react";
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
        texto,
        es_anonima: esAnonima,
        lugar: lugar || undefined,
        curso: curso || undefined,
        denunciante_nombre: esAnonima ? undefined : nombre || undefined,
        denunciante_contacto: esAnonima ? undefined : contacto || undefined,
      });
      setResultado(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setEnviando(false);
    }
  }

  async function copiarCodigo() {
    if (!resultado) return;
    await navigator.clipboard.writeText(resultado.codigo_seguimiento);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (resultado) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <div className="rounded-lg border p-6">
          <h1 className="text-2xl font-semibold">Denuncia recibida</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gracias por tu valentía. Un orientador revisará tu caso. Guarda este código para consultar
            el estado más adelante: no podremos recuperarlo si lo pierdes.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-md bg-gray-100 p-4">
            <span className="font-mono text-xl tracking-wider">{resultado.codigo_seguimiento}</span>
            <button
              onClick={copiarCodigo}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-200"
            >
              {copiado ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
          <p className="mt-4 text-sm">
            Si estás en peligro o alguien puede hacerse daño ahora mismo, avisa de inmediato a un adulto
            de confianza.
          </p>
          <a href="/seguimiento" className="mt-4 inline-block text-sm underline">
            Ir a consultar seguimiento
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">Hacer una denuncia</h1>
      <p className="mt-1 text-sm text-gray-600">
        Cuéntanos qué pasó. Puedes hacerlo de forma anónima o dejando tus datos.
      </p>

      <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <p className="font-medium">Antes de enviar</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>
            Si tu denuncia es anónima, no guardamos tu nombre ni tu contacto. Recibirás un código
            para consultar el estado.
          </li>
          <li>
            El texto se analiza con inteligencia artificial de apoyo, pero siempre lo revisa una
            persona del equipo de orientación.
          </li>
          <li>
            Si estás en peligro inmediato, avisa ahora a un adulto de confianza o a los servicios de
            emergencia de tu localidad.
          </li>
        </ul>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={esAnonima}
            onChange={(e) => setEsAnonima(e.target.checked)}
          />
          Quiero que mi denuncia sea anónima
        </label>

        {!esAnonima && (
          <div className="space-y-3 rounded-md border p-4">
            <input
              className="w-full rounded-md border p-2"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={120}
            />
            <input
              className="w-full rounded-md border p-2"
              placeholder="Teléfono o correo de contacto"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              maxLength={120}
            />
          </div>
        )}

        <textarea
          className="min-h-40 w-full rounded-md border p-2"
          placeholder="Describe lo que ocurrió: qué pasó, con qué frecuencia, quiénes estuvieron involucrados..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          minLength={10}
          maxLength={5000}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-md border p-2"
            placeholder="Lugar (opcional)"
            value={lugar}
            onChange={(e) => setLugar(e.target.value)}
            maxLength={120}
          />
          <input
            className="rounded-md border p-2"
            placeholder="Curso (opcional)"
            value={curso}
            onChange={(e) => setCurso(e.target.value)}
            maxLength={60}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar denuncia"}
        </button>
      </form>
    </main>
  );
}
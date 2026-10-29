import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6 py-12">
      <h1 className="text-3xl font-bold">Sistema de detección de bullying</h1>
      <p className="mt-3 text-gray-600">
        Un espacio seguro para reportar situaciones de acoso escolar, de forma anónima o
        identificada. Cada denuncia es revisada por el equipo de orientación con apoyo de
        inteligencia artificial.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/denunciar" className="rounded-lg border p-6 hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Hacer una denuncia</h2>
          <p className="mt-1 text-sm text-gray-600">
            Cuéntanos qué está pasando. Puedes hacerlo sin dar tu nombre.
          </p>
        </Link>
        <Link href="/seguimiento" className="rounded-lg border p-6 hover:bg-gray-50">
          <h2 className="text-xl font-semibold">Consultar seguimiento</h2>
          <p className="mt-1 text-sm text-gray-600">
            Revisa el estado de tu denuncia con el código que recibiste.
          </p>
        </Link>
      </div>

      <div className="mt-8 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">
        Si estás en peligro inmediato o alguien puede hacerse daño ahora mismo, avisa a un adulto de
        confianza o a los servicios de emergencia de tu localidad.
      </div>

      <p className="mt-10 text-sm text-gray-500">
        <Link href="/login" className="underline">
          Acceso del personal
        </Link>
      </p>
    </main>
  );
}
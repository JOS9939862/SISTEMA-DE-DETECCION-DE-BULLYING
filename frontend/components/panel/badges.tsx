import type { Severidad } from "@/lib/api";

export const ETIQUETAS_ESTADO: Record<string, string> = {
  nuevo: "Nuevo",
  en_revision: "En revisión",
  en_intervencion: "En intervención",
  cerrado: "Cerrado",
};

export const ETIQUETAS_TIPO: Record<string, string> = {
  fisico: "Físico",
  verbal: "Verbal",
  psicologico: "Psicológico",
  exclusion_social: "Exclusión social",
  ciberbullying: "Ciberbullying",
  sexual: "Sexual",
  otro: "Otro",
};

export const ETIQUETAS_CLASIFICACION: Record<string, string> = {
  bullying: "Bullying",
  posible_bullying: "Posible bullying",
  conflicto_puntual: "Conflicto puntual",
  otra_violencia: "Otra forma de violencia",
  no_determinado: "No determinado",
};

const COLOR_SEVERIDAD: Record<Severidad, string> = {
  critica: "bg-red-600 text-white",
  alta: "bg-orange-500 text-white",
  media: "bg-yellow-300 text-black",
  baja: "bg-green-500 text-white",
};

export function SeveridadBadge({ severidad }: { severidad: Severidad | null }) {
  if (!severidad) {
    return (
      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
        Analizando…
      </span>
    );
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${COLOR_SEVERIDAD[severidad]}`}
    >
      {severidad === "critica" ? "Crítica" : severidad}
    </span>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs">
      {ETIQUETAS_ESTADO[estado] ?? estado}
    </span>
  );
}

export function formatearFecha(iso: string): string {
  const conZona = /(Z|[+-]\d{2}:\d{2})$/.test(iso) ? iso : `${iso}Z`;
  return new Date(conZona).toLocaleString("es-BO");
}
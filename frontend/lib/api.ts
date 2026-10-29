const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ---------------------------- Tipos ---------------------------- */
export type Severidad = "baja" | "media" | "alta" | "critica";
export type Estado = "nuevo" | "en_revision" | "en_intervencion" | "cerrado";

export type DenunciaInput = {
  texto: string;
  es_anonima: boolean;
  lugar?: string;
  curso?: string;
  denunciante_nombre?: string;
  denunciante_contacto?: string;
};

export type DenunciaCreada = {
  id: number;
  codigo_seguimiento: string;
  mensaje: string;
};

export type Seguimiento = {
  estado: string;
  creado_en: string;
};

export type CasoResumen = {
  id: number;
  creado_en: string;
  estado: Estado;
  riesgo_critico: boolean;
  es_anonima: boolean;
  lugar: string | null;
  curso: string | null;
  extracto: string;
  severidad: Severidad | null;
  tipos: string[];
  clasificacion: string | null;
};

export type Analisis = {
  clasificacion: string;
  tipos: string[];
  severidad: Severidad;
  riesgo_critico: boolean;
  indicadores_riesgo: string[];
  resumen: string;
  impacto_emocional: string;
  recomendaciones: string[];
  preguntas_seguimiento: string[];
  fuentes: string[];
  modelo: string | null;
  es_respaldo: boolean;
  creado_en: string;
};

export type Nota = { id: number; autor: string; texto: string; creado_en: string };

export type CasoDetalle = {
  id: number;
  creado_en: string;
  estado: Estado;
  riesgo_critico: boolean;
  alerta_descartada: boolean;
  ia_activa: boolean;
  es_anonima: boolean;
  lugar: string | null;
  curso: string | null;
  texto: string;
  denunciante_nombre: string | null;
  denunciante_contacto: string | null;
  analisis: Analisis | null;
  notas: Nota[];
};

export type Estadisticas = {
  total: number;
  criticos_abiertos: number;
  por_estado: Record<string, number>;
  por_severidad: Record<string, number>;
  por_tipo: Record<string, number>;
  por_lugar: Record<string, number>;
};

/* ------------------- Sesión del personal (JWT) ------------------- */
const TOKEN_KEY = "bullying_token";

export const getToken = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class SesionError extends Error {
  constructor() {
    super("Sesión expirada");
  }
}

async function apiAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new SesionError();
  }
  if (!res.ok) {
    let detalle = "Error en la solicitud";
    try {
      const j = await res.json();
      if (typeof j.detail === "string") detalle = j.detail;
    } catch {}
    throw new Error(detalle);
  }
  return res.json();
}

export async function login(
  email: string,
  password: string
): Promise<{ access_token: string; nombre: string; rol: string }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) throw new Error("Correo o contraseña incorrectos");
  if (!res.ok) throw new Error("No se pudo iniciar sesión");
  return res.json();
}

/* ------------------------ Denuncias (público) ------------------------ */
export async function crearDenuncia(datos: DenunciaInput): Promise<DenunciaCreada> {
  const res = await fetch(`${API_URL}/api/denuncias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!res.ok) {
    throw new Error("No se pudo enviar la denuncia. Revisa los datos e inténtalo de nuevo.");
  }
  return res.json();
}

export async function consultarSeguimiento(codigo: string): Promise<Seguimiento> {
  const res = await fetch(
    `${API_URL}/api/seguimiento/${encodeURIComponent(codigo.trim())}`
  );
  if (res.status === 404) {
    throw new Error("No encontramos ese código. Verifícalo e inténtalo otra vez.");
  }
  if (!res.ok) {
    throw new Error("Error al consultar el seguimiento.");
  }
  return res.json();
}

/* ---------------------- Panel del personal ---------------------- */
// Debe coincidir con LIMITE_CASOS en backend/routers/casos.py
export const LIMITE_CASOS = 500;

export const listarCasos = (estado?: string) =>
  apiAuth<CasoResumen[]>(`/api/casos${estado ? `?estado=${encodeURIComponent(estado)}` : ""}`);

export const obtenerEstadisticas = () => apiAuth<Estadisticas>("/api/casos/estadisticas");

export const obtenerCaso = (id: number | string) => apiAuth<CasoDetalle>(`/api/casos/${id}`);

export const cambiarEstado = (id: number | string, estado: Estado) =>
  apiAuth<CasoDetalle>(`/api/casos/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });

export const agregarNota = (id: number | string, texto: string) =>
  apiAuth<CasoDetalle>(`/api/casos/${id}/notas`, {
    method: "POST",
    body: JSON.stringify({ texto }),
  });

export const reanalizarCaso = (id: number | string) =>
  apiAuth<CasoDetalle>(`/api/casos/${id}/analizar`, { method: "POST" });

export const descartarAlerta = (id: number | string, motivo: string) =>
  apiAuth<CasoDetalle>(`/api/casos/${id}/descartar-alerta`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
'use client'

import axios from 'axios'
import { useState } from 'react'
import { AlertTriangle, BarChart3, CheckCircle2, FileText, LockKeyhole, MessageSquareText, ShieldCheck, Sparkles, Users } from 'lucide-react'

type Result = {
  label: string
  confidence: number
  category: string
  explanation: string
}

const examples = [
  { text: 'No estoy de acuerdo contigo, pero podemos hablarlo con respeto.', result: 'Seguro', tone: 'safe' },
  { text: 'Eres un inútil, nadie te quiere en este grupo.', result: 'Riesgo alto', tone: 'danger' },
  { text: 'Deja de publicar fotos de otras personas sin permiso.', result: 'Revisar', tone: 'review' },
]

export default function Page() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function analyzeText() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await axios.post(`${apiUrl}/predict`, { text: text.trim() })
      const data = response.data
      setResult({
        label: data.label || data.prediction || 'Revisar',
        confidence: Math.round((data.confidence ?? data.probability ?? 0) * (data.confidence > 1 ? 1 : 100)),
        category: data.category || 'Contenido analizado',
        explanation: data.explanation || 'La API procesó el contenido correctamente.',
      })
    } catch {
      setError('No pudimos conectar con FastAPI. Verifica que el servidor esté activo y que NEXT_PUBLIC_API_URL apunte a su dirección.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#14213d]">
      <header className="border-b border-[#e5eaf2] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d4ed8] text-white shadow-sm"><ShieldCheck size={22} /></div>
            <div><p className="text-sm font-semibold tracking-wide text-[#1d4ed8]">CLARO</p><p className="text-xs text-[#718096]">Detección responsable</p></div>
          </div>
          <div className="hidden items-center gap-2 rounded-full bg-[#eef7f3] px-3 py-2 text-xs font-medium text-[#167c5a] sm:flex"><LockKeyhole size={14} /> Tus datos se procesan de forma segura</div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#e8f0ff] px-3 py-1.5 text-xs font-semibold text-[#1d4ed8]"><Sparkles size={13} /> Panel de análisis</p><h1 className="text-3xl font-bold tracking-tight text-[#14213d] sm:text-4xl">Detecta. Comprende. Actúa.</h1><p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#64748b]">Identifica señales de bullying y ciberbullying en mensajes para promover espacios digitales más seguros.</p></div>
          <div className="flex gap-3"><div className="rounded-2xl border border-[#e5eaf2] bg-white px-4 py-3"><p className="text-xs text-[#718096]">Analizados hoy</p><p className="mt-1 text-xl font-bold">128</p></div><div className="rounded-2xl border border-[#e5eaf2] bg-white px-4 py-3"><p className="text-xs text-[#718096]">Precisión</p><p className="mt-1 text-xl font-bold text-[#167c5a]">94.6%</p></div></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-2xl border border-[#e5eaf2] bg-white p-5 shadow-[0_8px_30px_rgba(31,57,91,.04)] sm:p-7">
            <div className="mb-5 flex items-start justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold"><MessageSquareText className="text-[#1d4ed8]" size={20} /> Analizar contenido</h2><p className="mt-1 text-sm text-[#718096]">Pega un mensaje para evaluar posibles señales.</p></div><span className="rounded-lg bg-[#f3f6fb] px-2.5 py-1 text-xs font-medium text-[#64748b]">POST /predict</span></div>
            <label htmlFor="message" className="mb-2 block text-sm font-semibold text-[#334155]">Mensaje a revisar</label>
            <textarea id="message" value={text} onChange={(event) => setText(event.target.value)} placeholder="Escribe o pega aquí el mensaje que deseas analizar..." maxLength={1000} className="min-h-48 w-full resize-y rounded-xl border border-[#dbe3ef] bg-[#fbfcfe] p-4 text-sm leading-6 outline-none transition placeholder:text-[#a0aec0] focus:border-[#6d97ed] focus:ring-4 focus:ring-[#dce8ff]" />
            <div className="mt-2 flex items-center justify-between text-xs text-[#94a3b8]"><span>La herramienta es de apoyo, no reemplaza el criterio humano.</span><span>{text.length}/1000</span></div>
            {error && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-[#f6caca] bg-[#fff5f5] p-3 text-sm text-[#b42318]"><AlertTriangle size={18} className="mt-0.5 shrink-0" />{error}</div>}
            <button onClick={analyzeText} disabled={!text.trim() || loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Analizando...' : <><BarChart3 size={18} /> Analizar mensaje</>}</button>
          </div>

          <div className="rounded-2xl border border-[#e5eaf2] bg-white p-5 shadow-[0_8px_30px_rgba(31,57,91,.04)] sm:p-7"><div className="mb-5 flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold"><FileText className="text-[#1d4ed8]" size={20} /> Resultado</h2><p className="mt-1 text-sm text-[#718096]">La respuesta de tu modelo aparecerá aquí.</p></div></div>{result ? <ResultCard result={result} /> : <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#dbe3ef] bg-[#fbfcfe] px-6 text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f0ff] text-[#1d4ed8]"><ShieldCheck size={28} /></div><p className="font-semibold">Listo para analizar</p><p className="mt-1 max-w-xs text-sm leading-5 text-[#718096]">Ingresa un mensaje y conecta tu API de FastAPI para ver la clasificación.</p></div>}</div>
        </section>

        <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-bold">Ejemplos de clasificación</h2><p className="mt-1 text-sm text-[#718096]">Prueba rápidamente distintos tipos de mensajes.</p></div><span className="hidden text-xs text-[#94a3b8] sm:block">Datos ilustrativos</span></div><div className="grid gap-3 md:grid-cols-3">{examples.map((example) => <button key={example.text} onClick={() => setText(example.text)} className="rounded-xl border border-[#e5eaf2] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#a9c2f5] hover:shadow-sm"><p className="line-clamp-2 text-sm leading-5 text-[#475569]">“{example.text}”</p><span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${example.tone === 'safe' ? 'bg-[#e8f7f0] text-[#167c5a]' : example.tone === 'danger' ? 'bg-[#fff0ef] text-[#b42318]' : 'bg-[#fff7e6] text-[#a15c00]'}`}>{example.result}</span></button>)}</div></section>

        <footer className="mt-10 flex flex-col gap-3 border-t border-[#e5eaf2] pt-5 text-xs text-[#718096] sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2"><Users size={15} /> Diseñado para equipos educativos y comunidades digitales</p><p>La detección automática puede requerir revisión humana.</p></footer>
      </div>
    </main>
  )
}

function ResultCard({ result }: { result: Result }) {
  const isDanger = result.label.toLowerCase().includes('alto') || result.label.toLowerCase().includes('bully')
  return <div className="space-y-5"><div className={`rounded-xl border p-5 ${isDanger ? 'border-[#f6caca] bg-[#fff5f5]' : 'border-[#bce6d4] bg-[#f1fbf6]'}`}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`flex h-11 w-11 items-center justify-center rounded-full ${isDanger ? 'bg-[#fee2e2] text-[#b42318]' : 'bg-[#d8f3e5] text-[#167c5a]'}`}>{isDanger ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}</div><div><p className="text-xs font-medium text-[#718096]">Clasificación</p><p className={`text-xl font-bold ${isDanger ? 'text-[#b42318]' : 'text-[#167c5a]'}`}>{result.label}</p></div></div><span className="text-2xl font-bold">{result.confidence}%<span className="text-xs font-normal text-[#718096]"> confianza</span></span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80"><div className={`h-full rounded-full ${isDanger ? 'bg-[#e45756]' : 'bg-[#26a269]'}`} style={{ width: `${Math.min(result.confidence, 100)}%` }} /></div></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">Detalle del análisis</p><p className="text-sm leading-6 text-[#475569]">{result.explanation}</p><span className="mt-3 inline-block rounded-md bg-[#f3f6fb] px-2.5 py-1 text-xs font-medium text-[#64748b]">Categoría: {result.category}</span></div></div>
}

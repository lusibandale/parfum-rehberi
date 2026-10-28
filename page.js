'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Guide() {
  const [cats, setCats] = useState([])
  const [perfumes, setPerfumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [sel, setSel] = useState({})
  const [ban, setBan] = useState([])
  const [txt, setTxt] = useState('')

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('categories').select('*, options(*)').order('position')
      const { data: p } = await supabase.from('perfumes').select('*, perfume_options(option_id)')
      setCats((c || []).map(x => ({ ...x, options: [...x.options].sort((a, b) => a.position - b.position) })))
      setPerfumes(p || [])
      setLoading(false)
    })()
  }, [])

  const total = cats.length + 1 // sorular + kara liste
  const toggle = (cid, oid) => setSel(s => {
    const cur = s[cid] || []
    return { ...s, [cid]: cur.includes(oid) ? cur.filter(i => i !== oid) : [...cur, oid] }
  })
  const addBan = () => {
    const v = txt.trim()
    if (v && !ban.some(b => b.toLowerCase() === v.toLowerCase())) setBan([...ban, v])
    setTxt('')
  }

  // EŞLEŞTİRME: kategori içinde VEYA, kategoriler arasında VE; kara liste = çıkar
  const results = perfumes.filter(p => {
    const ids = new Set((p.perfume_options || []).map(o => o.option_id))
    for (const cid in sel) if (sel[cid].length && !sel[cid].some(id => ids.has(id))) return false
    const notes = (p.notes || []).map(n => n.toLowerCase())
    return !ban.some(b => notes.some(n => n.includes(b.toLowerCase())))
  })

  const Nav = ({ next = 'Devam' }) => (
    <div className="mt-14 flex items-center justify-between text-sm">
      {step > 0 ? <button onClick={() => setStep(step - 1)} className="border-b border-ink pb-0.5">Geri</button> : <span />}
      <button onClick={() => setStep(step + 1)} className="border-b border-ink pb-0.5">{next}</button>
    </div>
  )

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 pb-24 pt-8 md:px-10">
      <header className="flex items-baseline justify-between border-b border-ink/20 pb-4">
        <span className="font-serif text-lg italic">Parfüm Rehberi</span>
        <span className="text-xs tabular-nums text-ink/60">{step < total ? `${step + 1} / ${total}` : 'Sonuç'}</span>
      </header>

      {loading && <p className="mt-24 font-serif text-2xl text-ink/60">Yükleniyor…</p>}

      {!loading && step < cats.length && (() => {
        const c = cats[step]
        return (
          <section className="mt-16">
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">{c.name}</h1>
            <p className="mt-4 text-sm text-ink/60">Birden fazla seçebilirsin. Boş bırakırsan fark etmez.</p>
            <ul className="mt-10 border-b border-ink/20">
              {c.options.map(o => {
                const on = (sel[c.id] || []).includes(o.id)
                return (
                  <li key={o.id}>
                    <button onClick={() => toggle(c.id, o.id)} aria-pressed={on}
                      className={`flex w-full items-center justify-between border-t border-ink/20 px-3 py-5 text-left font-serif text-2xl transition-colors md:text-3xl ${on ? 'bg-ink text-paper' : 'hover:bg-ink/[0.04]'}`}>
                      <span>{o.label}</span>
                      <span className={`h-3.5 w-3.5 border ${on ? 'border-paper bg-paper' : 'border-ink/50'}`} />
                    </button>
                  </li>
                )
              })}
            </ul>
            <Nav />
          </section>
        )
      })()}

      {!loading && step === cats.length && (
        <section className="mt-16">
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">Asla olmasın</h1>
          <p className="mt-4 max-w-md text-sm text-ink/60">Sevmediğin ya da tahammül edemediğin notaları yaz. Bu notaları içeren parfümleri göstermeyeceğiz.</p>
          <div className="mt-10 flex items-end gap-6">
            <input value={txt} onChange={e => setTxt(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBan()}
              placeholder="örn. oud, vanilya, misk" className="w-full border-b border-ink/30 bg-transparent py-3 font-serif text-2xl outline-none placeholder:text-ink/30 focus:border-ink" />
            <button onClick={addBan} className="border-b border-ink pb-1 text-sm">Ekle</button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {ban.map(b => (
              <button key={b} onClick={() => setBan(ban.filter(x => x !== b))} className="border border-ink px-3 py-1 text-sm line-through decoration-1 hover:bg-ink hover:text-paper">{b}</button>
            ))}
          </div>
          <Nav next="Önerileri gör" />
        </section>
      )}

      {!loading && step > cats.length && (
        <section className="mt-16">
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
            {results.length ? `${results.length} parfüm sana uyuyor` : 'Eşleşme bulamadık'}
          </h1>
          {!results.length && <p className="mt-4 text-sm text-ink/60">Seçimlerini biraz gevşetip tekrar dene.</p>}
          <ul className="mt-12 border-b border-ink/20">
            {results.map(p => (
              <li key={p.id} className="grid grid-cols-[1fr] gap-6 border-t border-ink/20 py-8 md:grid-cols-[140px_1fr]">
                {p.image_url ? <img src={p.image_url} alt={p.name} className="aspect-[3/4] w-full object-cover" /> : <div className="hidden aspect-[3/4] border border-ink/15 md:block" />}
                <div>
                  <p className="text-xs text-ink/60">{p.brand}</p>
                  <h2 className="mt-1 font-serif text-3xl md:text-4xl">{p.name}</h2>
                  {p.notes?.length > 0 && <p className="mt-3 font-serif text-lg italic text-ink/70">{p.notes.join(', ')}</p>}
                  {p.description && <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/80">{p.description}</p>}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-sm"><button onClick={() => { setStep(0); setSel({}); setBan([]) }} className="border-b border-ink pb-0.5">Baştan başla</button></div>
        </section>
      )}
    </main>
  )
}

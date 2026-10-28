'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const inp = 'w-full border-b border-ink/25 bg-transparent py-2 outline-none focus:border-ink'
const lnk = 'border-b border-ink pb-0.5 text-sm hover:opacity-60'

export default function Admin() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: l } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => l.subscription.unsubscribe()
  }, [])
  if (!ready) return null
  return session ? <Panel /> : <Login />
}

function Login() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('')
  const go = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) setErr('E-posta veya şifre hatalı.')
  }
  return (
    <main className="mx-auto max-w-sm px-6 pt-32">
      <h1 className="font-serif text-5xl">Yönetim</h1>
      <div className="mt-10 space-y-6">
        <input className={inp} placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} />
        <input className={inp} type="password" placeholder="Şifre" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} />
        {err && <p className="text-sm">{err}</p>}
        <button onClick={go} className={lnk}>Giriş yap</button>
      </div>
    </main>
  )
}

function Panel() {
  const [tab, setTab] = useState('perfumes')
  const [cats, setCats] = useState([]); const [perfumes, setPerfumes] = useState([]); const [edit, setEdit] = useState(null)
  const load = useCallback(async () => {
    const { data: c } = await supabase.from('categories').select('*, options(*)').order('position')
    const { data: p } = await supabase.from('perfumes').select('*, perfume_options(option_id)').order('created_at', { ascending: false })
    setCats((c || []).map(x => ({ ...x, options: [...x.options].sort((a, b) => a.position - b.position) }))); setPerfumes(p || [])
  }, [])
  useEffect(() => { load() }, [load])

  const blank = { name: '', brand: '', description: '', image_url: '', notes: '', opts: [] }
  const startEdit = p => setEdit(p ? { id: p.id, name: p.name, brand: p.brand || '', description: p.description || '', image_url: p.image_url || '', notes: (p.notes || []).join(', '), opts: p.perfume_options.map(o => o.option_id) } : blank)

  const save = async f => {
    const row = { name: f.name, brand: f.brand, description: f.description, image_url: f.image_url, notes: f.notes.split(',').map(s => s.trim()).filter(Boolean) }
    let id = f.id
    if (id) await supabase.from('perfumes').update(row).eq('id', id)
    else { const { data } = await supabase.from('perfumes').insert(row).select().single(); id = data.id }
    await supabase.from('perfume_options').delete().eq('perfume_id', id)
    if (f.opts.length) await supabase.from('perfume_options').insert(f.opts.map(o => ({ perfume_id: id, option_id: o })))
    setEdit(null); load()
  }
  const delPerfume = async p => { if (confirm(`"${p.name}" silinsin mi?`)) { await supabase.from('perfumes').delete().eq('id', p.id); load() } }

  const addCat = async () => { const n = prompt('Yeni özellik adı (örn. Kalıcılık)'); if (n) { await supabase.from('categories').insert({ name: n, position: cats.length + 1 }); load() } }
  const renCat = async c => { const n = prompt('Yeni ad', c.name); if (n) { await supabase.from('categories').update({ name: n }).eq('id', c.id); load() } }
  const delCat = async c => { if (confirm(`"${c.name}" ve tüm seçenekleri silinsin mi?`)) { await supabase.from('categories').delete().eq('id', c.id); load() } }
  const addOpt = async c => { const n = prompt(`"${c.name}" için yeni seçenek`); if (n) { await supabase.from('options').insert({ category_id: c.id, label: n, position: c.options.length + 1 }); load() } }
  const renOpt = async o => { const n = prompt('Yeni ad', o.label); if (n) { await supabase.from('options').update({ label: n }).eq('id', o.id); load() } }
  const delOpt = async o => { if (confirm(`"${o.label}" silinsin mi?`)) { await supabase.from('options').delete().eq('id', o.id); load() } }

  return (
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-8 md:px-10">
      <header className="flex items-baseline justify-between border-b border-ink/20 pb-4">
        <span className="font-serif text-lg italic">Yönetim</span>
        <div className="flex gap-6">
          <button className={lnk} onClick={() => { setTab('perfumes'); setEdit(null) }}>Parfümler</button>
          <button className={lnk} onClick={() => setTab('cats')}>Özellikler</button>
          <button className="text-sm text-ink/60" onClick={() => supabase.auth.signOut()}>Çıkış</button>
        </div>
      </header>

      {tab === 'perfumes' && !edit && (
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <h1 className="font-serif text-5xl">Parfümler</h1>
            <button className={lnk} onClick={() => startEdit(null)}>Yeni parfüm ekle</button>
          </div>
          <ul className="mt-10 border-b border-ink/20">
            {perfumes.map(p => (
              <li key={p.id} className="flex items-center justify-between border-t border-ink/20 py-5">
                <div><p className="font-serif text-2xl">{p.name}</p><p className="text-xs text-ink/60">{p.brand}</p></div>
                <div className="flex gap-5"><button className={lnk} onClick={() => startEdit(p)}>Düzenle</button><button className="text-sm text-ink/60" onClick={() => delPerfume(p)}>Sil</button></div>
              </li>
            ))}
            {!perfumes.length && <li className="border-t border-ink/20 py-8 text-ink/60">Henüz parfüm yok. İlkini ekle.</li>}
          </ul>
        </section>
      )}

      {tab === 'perfumes' && edit && (
        <section className="mt-12 space-y-8">
          <h1 className="font-serif text-5xl">{edit.id ? 'Parfümü düzenle' : 'Yeni parfüm'}</h1>
          {[['name', 'Parfüm adı'], ['brand', 'Marka'], ['image_url', 'Görsel linki (isteğe bağlı)'], ['notes', 'Notalar (virgülle ayır: oud, vanilya, bergamot)'], ['description', 'Kısa açıklama']].map(([k, ph]) => (
            <input key={k} className={inp} placeholder={ph} value={edit[k]} onChange={e => setEdit({ ...edit, [k]: e.target.value })} />
          ))}
          {cats.map(c => (
            <div key={c.id}>
              <p className="mb-3 font-serif text-xl">{c.name}</p>
              <div className="flex flex-wrap gap-2">
                {c.options.map(o => {
                  const on = edit.opts.includes(o.id)
                  return <button key={o.id} aria-pressed={on} onClick={() => setEdit({ ...edit, opts: on ? edit.opts.filter(i => i !== o.id) : [...edit.opts, o.id] })}
                    className={`border border-ink px-3 py-1.5 text-sm transition-colors ${on ? 'bg-ink text-paper' : 'hover:bg-ink/[0.06]'}`}>{o.label}</button>
                })}
              </div>
            </div>
          ))}
          <div className="flex gap-8 pt-4"><button className={lnk} onClick={() => edit.name && save(edit)}>Kaydet</button><button className="text-sm text-ink/60" onClick={() => setEdit(null)}>Vazgeç</button></div>
        </section>
      )}

      {tab === 'cats' && (
        <section className="mt-12">
          <div className="flex items-end justify-between"><h1 className="font-serif text-5xl">Özellikler</h1><button className={lnk} onClick={addCat}>Yeni özellik</button></div>
          <div className="mt-10 border-b border-ink/20">
            {cats.map(c => (
              <div key={c.id} className="border-t border-ink/20 py-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-3xl">{c.name}</h2>
                  <div className="flex gap-5 text-sm"><button className={lnk} onClick={() => renCat(c)}>Adı değiştir</button><button className="text-ink/60" onClick={() => delCat(c)}>Sil</button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.options.map(o => (
                    <span key={o.id} className="flex items-center gap-2 border border-ink/40 px-3 py-1 text-sm">
                      <button onClick={() => renOpt(o)}>{o.label}</button><button className="text-ink/50" onClick={() => delOpt(o)} aria-label="Sil">×</button>
                    </span>
                  ))}
                  <button className={lnk + ' ml-2'} onClick={() => addOpt(c)}>Seçenek ekle</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

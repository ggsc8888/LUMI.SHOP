'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, Field, inputCls, Badge } from './ui';
import { ShopifySignInCard } from './ShopifySignInCard';

export function SettingsClient({ shopifyStatus }) {
  const [settings, setSettings] = useState(null), [ai, setAi] = useState(null), [saving, setSaving] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState(''), [ruler, setRuler] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/settings').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(j => {
      if (!active) return;
      setSettings(j.settings); setAi(j.ai);
      if (j.settings?.printScale !== 1) setRuler(String(Math.round(j.settings.printScale * 1000) / 10));
    }).catch(() => { if (active) setError('Could not load your settings. Please reload the page.'); });
    return () => { active = false; };
  }, []);
  const update = (key, value) => { setSettings(s => ({ ...s, [key]: value })); setSaved(false); };
  async function save(patch) {
    setSaving(true); setSaved(false); setError('');
    try {
      const r = await fetch('/api/settings', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) });
      if (!r.ok) throw new Error();
      const j = await r.json(); setSettings(j.settings); setSaved(true);
    } catch { setError('Could not save your settings. Please try again.'); }
    finally { setSaving(false); }
  }
  return <main className="mx-auto max-w-xl space-y-5 px-4 pb-24 pt-6">
    <h1 className="font-display text-3xl">Settings</h1>
    <p className="-mt-3 text-sm text-ink/50">Connect your store and set your listing preferences.</p>
    <ShopifySignInCard result={shopifyStatus} />
    {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
    <Card className="space-y-3">
      <h2 className="font-display text-xl">AI tools</h2>
      <div className="flex flex-wrap gap-2 text-sm"><Badge tone={ai?.text ? 'ok' : 'neutral'}>Listing assistant: {ai?.text ? 'Ready' : 'Not available yet'}</Badge><Badge tone={ai?.image ? 'ok' : 'neutral'}>Product images: {ai?.image ? 'Ready' : 'Not available yet'}</Badge></div>
    </Card>
    {settings && <>
      <Card className="space-y-4">
        <h2 className="font-display text-xl">Store defaults</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vendor / brand"><input className={inputCls} value={settings.vendor} onChange={e => update('vendor', e.target.value)} /></Field>
          <Field label="Currency"><input className={inputCls} value={settings.currency} maxLength={3} onChange={e => update('currency', e.target.value.toUpperCase())} /></Field>
          <Field label="Target margin %"><input type="number" min="0" max="95" className={inputCls} value={settings.targetMarginPct} onChange={e => update('targetMarginPct', Number(e.target.value))} /></Field>
          <Field label="Default quantity"><input type="number" min="0" step="1" className={inputCls} value={settings.defaultInventory} onChange={e => update('defaultInventory', Number(e.target.value))} /></Field>
        </div>
        <Field label="Default tags" hint="Comma separated"><input className={inputCls} value={settings.defaultTags.join(', ')} onChange={e => update('defaultTags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))} /></Field>
        <Field label="Pricing notes for the AI"><textarea rows={2} className={inputCls} value={settings.pricingNotes} onChange={e => update('pricingNotes', e.target.value)} /></Field>
        <Field label="Extra brand notes"><textarea rows={2} className={inputCls} value={settings.brandNotes} onChange={e => update('brandNotes', e.target.value)} /></Field>
        <Field label="Image style for AI shots"><input className={inputCls} value={settings.imageStyle} onChange={e => update('imageStyle', e.target.value)} /></Field>
        <div className="flex items-center gap-3"><Button loading={saving} onClick={() => save({ ...settings, printScale: undefined })}>Save defaults</Button>{saved && <span role="status" className="text-sm text-emerald-700">Saved</span>}</div>
      </Card>
      <Card className="space-y-3">
        <h2 className="font-display text-xl">Print check</h2>
        <p className="text-sm text-ink/60">Measure the “10 cm” line on your printed <Link href="/mat" className="underline">calibration mat</Link>. Enter the actual length to correct printer scaling.</p>
        <div className="flex items-end gap-3"><Field label="Measured length (mm)"><input inputMode="decimal" className={inputCls} placeholder="100.0" value={ruler} onChange={e => setRuler(e.target.value)} /></Field><Button variant="secondary" onClick={() => { const n = Number(ruler); if (n >= 80 && n <= 120) save({ printScale: n / 100 }); else setError('Enter a measured length between 80 and 120 mm.'); }}>Apply</Button></div>
        <p className="text-xs text-ink/50">Current scale factor: {settings.printScale.toFixed(3)}</p>
      </Card>
    </>}
  </main>;
}

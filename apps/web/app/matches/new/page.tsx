'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

const inputClass = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50';

export default function NewMatchPage() {
  const [form, setForm] = useState({
    league: '', country: '', homeTeam: '', awayTeam: '', date: new Date().toISOString().slice(0, 10),
    time: '18:00', status: 'Scheduled', matchType: 'unassigned', homeOdds: '', drawOdds: '', awayOdds: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const response = await fetch('/api/admin/matches/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          league: form.league, country: form.country, homeTeam: form.homeTeam, awayTeam: form.awayTeam,
          date: form.date, time: form.time, status: form.status, matchType: form.matchType,
          odds: { home: form.homeOdds, draw: form.drawOdds, away: form.awayOdds },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save the match.');
      setSaved(true);
      setForm((current) => ({ ...current, league: '', country: '', homeTeam: '', awayTeam: '', homeOdds: '', drawOdds: '', awayOdds: '' }));
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Could not save the match.');
    } finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Link href="/matches" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ArrowLeft size={20} /></Link>
        <div><h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Add Match</h1><p className="text-sm text-zinc-500">Create a match manually for the apps.</p></div>
      </div>
      <form onSubmit={submit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-500/10 dark:text-red-400">{error}</div>}
        {saved && <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-500/10 dark:text-green-400"><CheckCircle2 size={18} /> Match saved successfully.</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">League<input required value={form.league} onChange={(e) => update('league', e.target.value)} className={inputClass} placeholder="Premier League" /></label>
          <label className="space-y-1 text-sm font-medium">Country<input value={form.country} onChange={(e) => update('country', e.target.value)} className={inputClass} placeholder="England (optional)" /></label>
          <label className="space-y-1 text-sm font-medium">Home team<input required value={form.homeTeam} onChange={(e) => update('homeTeam', e.target.value)} className={inputClass} placeholder="Home team" /></label>
          <label className="space-y-1 text-sm font-medium">Away team<input required value={form.awayTeam} onChange={(e) => update('awayTeam', e.target.value)} className={inputClass} placeholder="Away team" /></label>
          <label className="space-y-1 text-sm font-medium">Date<input required type="date" value={form.date} onChange={(e) => update('date', e.target.value)} className={inputClass} /></label>
          <label className="space-y-1 text-sm font-medium">Kickoff time<input required type="time" value={form.time} onChange={(e) => update('time', e.target.value)} className={inputClass} /></label>
          <label className="space-y-1 text-sm font-medium">Status<select value={form.status} onChange={(e) => update('status', e.target.value)} className={inputClass}><option>Scheduled</option><option>Live</option><option>Finished</option><option>Postponed</option></select></label>
          <label className="space-y-1 text-sm font-medium">Tip category<select value={form.matchType} onChange={(e) => update('matchType', e.target.value)} className={inputClass}><option value="unassigned">Unassigned</option><option value="free">Free</option><option value="paid">Paid</option><option value="vip">VIP</option></select></label>
        </div>
        <div><h2 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">Odds (optional)</h2><div className="grid gap-4 md:grid-cols-3"><input value={form.homeOdds} onChange={(e) => update('homeOdds', e.target.value)} className={inputClass} placeholder="Home odds" /><input value={form.drawOdds} onChange={(e) => update('drawOdds', e.target.value)} className={inputClass} placeholder="Draw odds" /><input value={form.awayOdds} onChange={(e) => update('awayOdds', e.target.value)} className={inputClass} placeholder="Away odds" /></div></div>
        <button disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Saving...' : 'Save match'}</button>
      </form>
    </div>
  );
}

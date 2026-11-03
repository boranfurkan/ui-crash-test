import { useEffect, useState } from 'react';

type Scenario = { id: string; name: string; description: string; provenance: { kind: string }; latest: null | { id: string; outcome: string; summary: { passed: number; checked: number; failed: number; inconclusive: number }; createdAt: string } };
type Payload = { scenarios: Scenario[]; status: { state: string; events: string[]; error?: string } };
type Controls = { available: boolean; reportURL?: string; stale?: boolean; summary?: { checked: number; matched: number; limitations: number } };

export function ScenarioPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [controls, setControls] = useState<Controls | null>(null);
  const running = starting || data?.status.state === 'running';
  const load = async () => {
    const response = await fetch('/api/scenarios');
    if (!response.ok) throw new Error('Could not load external scenarios');
    const next = await response.json() as Payload;
    setData(next);
    const controlResponse = await fetch('/api/controls');
    if (controlResponse.ok) setControls(await controlResponse.json());
    if (next.status.state === 'error') setError(next.status.error ?? 'Scenario run stopped');
  };
  useEffect(() => { let active = true; const refresh = async () => { try { if (active) await load(); } catch (error) { if (active) setError(String(error)); } }; void refresh(); const timer = setInterval(() => void refresh(), 1500); return () => { active = false; clearInterval(timer); }; }, []);
  async function run(scenario: string) {
    setStarting(true); setError('');
    try {
      const response = await fetch('/api/scenarios/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario, seed: 42 }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Could not start scenarios');
      await load();
    } catch (error) { setError(String(error)); }
    finally { setStarting(false); }
  }
  return <section className="external-scenarios" aria-label="External component scenarios">
    <div className="section-heading"><div><span className="eyebrow">BEYOND THE REFERENCE DEMO</span><h2>Same runner. Different components.</h2></div><button className="secondary-button" onClick={() => void run('all')} disabled={running}>{running ? 'Testing components…' : `Run all ${data?.scenarios.length ?? 5} scenarios`}</button></div>
    <p className="muted">The complete maintained TodoMVC Vue app joins the shopping-app and Radix component fixtures. The shopping cart still tests a pinned 2021 revision; it is not a finding against the current deployed site.</p>
    {error && <p className="error-banner" role="alert">{error}</p>}
    <div className="scenario-grid">{data?.scenarios.map(scenario => <article key={scenario.id} className="scenario-card"><span className="eyebrow">{scenario.provenance.kind === 'complete-upstream-application' ? 'COMPLETE UPSTREAM APP' : scenario.provenance.kind === 'existing-app-component' ? 'EXISTING APP SOURCE' : 'LIBRARY IN A FIXTURE APP'}</span><h3>{scenario.name}</h3><p>{scenario.description}</p><div className="scenario-result">{scenario.latest ? <><span className={`status-pill ${scenario.latest.outcome === 'no-failure' ? 'pass' : scenario.latest.outcome === 'failure' ? 'fail' : ''}`}>{scenario.latest.outcome === 'no-failure' ? 'NO FAILURE FOUND' : scenario.latest.outcome.toUpperCase()}</span><small>{scenario.latest.summary.passed}/{scenario.latest.summary.checked} passed · {scenario.latest.summary.inconclusive} inconclusive</small></> : <span className="muted">Ready to test · 14 cases</span>}</div><footer><button className="text-link" disabled={running} onClick={() => void run(scenario.id)}>Run scenario ↗</button>{scenario.latest && <a className="text-link" href={`/artifacts/${scenario.latest.id}/report.html`} target="_blank" rel="noreferrer">View evidence ↗</a>}</footer></article>)}</div>
    {running && <p className="scenario-progress" role="status">{data?.status.events.at(-1) ?? 'Starting Chromium…'}</p>}
    <p className="scenario-scope">One action rule per scenario. A passing result covers that rule and the supplied cases. Reports include the exact source fingerprint and fixture values. <a className="text-link" href="/docs/evidence/cart/report.html" target="_blank" rel="noreferrer">Cart investigation: original and candidate ↗</a></p>
    {controls?.available && <aside className="rule-controls" aria-label="Measurement controls"><div><strong>{controls.stale ? 'Measurement controls need rerunning' : `${controls.summary?.matched}/${controls.summary?.checked} control outcomes matched`}</strong><p>Curated rule checks · {controls.summary?.limitations} documented limits · not an accuracy benchmark</p></div><a className="text-link" href={controls.reportURL} target="_blank" rel="noreferrer">Inspect controls ↗</a></aside>}
    <p className="scenario-scope"><a className="text-link" href="/docs/evidence/maintained-vue/report.html" target="_blank" rel="noreferrer">Maintained-app trial and setup notes ↗</a> · <a className="text-link" href="/docs/validation/worksheet.json" download>Self-guided trial worksheet ↓</a></p>
    <p className="scenario-scope"><a className="text-link" href="/docs/evidence/comparison/report.html" target="_blank" rel="noreferrer">Matched comparison: Playwright and renderlint ↗</a></p>
  </section>;
}

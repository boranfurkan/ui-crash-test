import { useEffect, useRef, useState } from 'react';
import { primaryMember } from '../shared/model.ts';
import type { CampaignReport, RunStatus } from '../shared/report.ts';
import { ScenarioPanel } from './ScenarioPanel.tsx';

function Icon({ kind, size = 18 }: { kind: 'arrow' | 'grid' | 'file' | 'code' | 'play' | 'check' | 'download' | 'external' | 'terminal' | 'bolt'; size?: number }) {
  const paths = {
    arrow: <><path d="m5 4 7 8-7 8M13 4l7 8-7 8"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></>,
    code: <><path d="m7 6-5 6 5 6m10-12 5 6-5 6m-4-15-2 18"/></>,
    play: <path d="m8 5 11 7-11 7z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></>,
    external: <><path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-6"/></>,
    terminal: <><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m6 9 3 3-3 3m6 0h5"/></>,
    bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

function LiveLab() {
  const [mode, setMode] = useState<'normal' | 'stress' | 'fixed'>('normal');
  const [width, setWidth] = useState(360);
  const url = `/fixture?profile=${mode === 'normal' ? 'baseline' : 'stress'}&layout=${mode === 'fixed' ? 'fixed' : 'broken'}&width=${width}`;
  return <section className="lab-panel">
    <div className="section-heading"><div><span className="eyebrow">THE TEST SURFACE</span><h2>A small row. A lot of assumptions.</h2></div><a className="text-link" href={url} target="_blank" rel="noreferrer">Open fixture <Icon kind="external" size={14}/></a></div>
    <div className="lab-toolbar"><div className="segmented" aria-label="Demo state">{(['normal', 'stress', 'fixed'] as const).map(value => <button key={value} aria-pressed={value === mode} className={value === mode ? 'selected' : ''} onClick={() => setMode(value)}>{value === 'normal' ? 'Normal data' : value === 'stress' ? 'Worst case' : 'Fixed layout'}</button>)}</div><label className="width-control">Container <input aria-label="Fixture container width" type="range" min="320" max="640" step="10" value={width} onChange={event => setWidth(Number(event.target.value))}/><span>{width}px</span></label></div>
    <div className="lab-canvas"><iframe title="Live member-list fixture" src={url} style={{ width: width + 56, height: 340 }}/></div>
    <div className="lab-note"><span className="tiny-square"/>Interactive preview. Run the campaign to collect measured evidence and a saved regression.</div>
  </section>;
}

function Evidence({ report }: { report: CampaignReport }) {
  const [view, setView] = useState<'reduced' | 'fixed' | 'baseline'>('reduced');
  if (!report.original || !report.reduced || !report.reduction) return <div className="empty-state"><Icon kind="check" size={32}/><h2>{report.outcome === 'inconclusive' ? 'Some cases were inconclusive.' : 'This campaign held up.'}</h2><p>{report.summary.checked} supplied cases were checked against the declared action rule. No confirmed failure was exported.</p></div>;
  const base = `/artifacts/${report.id}`;
  const before = new TextEncoder().encode(JSON.stringify(report.original.input)).length;
  const after = new TextEncoder().encode(JSON.stringify(report.reduced.input)).length;
  const cut = Math.round((1 - after / before) * 100);
  const originalName = primaryMember(report.original.input).name;
  const reducedName = primaryMember(report.reduced.input).name;
  return <>
    <div className="finding-banner"><div className="finding-icon">!</div><div><strong>The member action was pushed outside its row.</strong><p>{report.original.finding.reason} Confirmed in {report.confirmation?.failures}/{report.confirmation?.attempts} fresh contexts.</p></div><span className="rule-badge">ACTION REACHABILITY</span></div>
    <div className="section-heading evidence-heading"><div><span className="eyebrow">THE SAME FAILURE, LESS NOISE</span><h2>Keep the case. Lose the distraction.</h2></div><div className="segmented compact" aria-label="Evidence view">{(['reduced', 'fixed', 'baseline'] as const).map(value => <button key={value} aria-pressed={view === value} className={view === value ? 'selected' : ''} onClick={() => setView(value)}>{value === 'reduced' ? 'Reduced case' : value === 'fixed' ? 'Verify fix' : 'Control'}</button>)}</div></div>
    <div className="evidence-grid"><article className="evidence-card"><header><span><i className="dot fail"/>Original failure</span><span>{report.original.input.containerWidth}px</span></header><div className="evidence-image"><img src={`${base}/original.png`} alt="Original member-list failure captured in Chromium"/></div><footer><span>{report.original.input.members.length} members · {before} bytes</span><span className="status-pill fail">FAIL</span></footer></article>
      <article className={`evidence-card ${view === 'fixed' ? 'verified-card' : ''}`}><header><span><i className={`dot ${view === 'reduced' ? 'fail' : 'pass'}`}/>{view === 'reduced' ? 'Reduced failure' : view === 'fixed' ? 'Fixed layout · same input' : 'Normal-data control'}</span><span>{report.reduced.input.containerWidth}px</span></header><div className="evidence-image"><img src={`${base}/${view}.png`} alt={`${view} member-list evidence captured in Chromium`}/></div><footer><span>{view === 'baseline' ? 'Baseline data' : `${report.reduced.input.members.length} member · ${after} bytes`}</span><span className={`status-pill ${view === 'reduced' ? 'fail' : 'pass'}`}>{view === 'reduced' ? 'SAME FAILURE' : 'PASS'}</span></footer></article></div>
    <div className="reduction-strip"><div className="reduction-number">−{cut}<span>%</span></div><div><strong>Less fixture data. Same rule violation.</strong><p>{report.reduction.evaluations} reduction probes · all retained inputs valid · best found within the declared candidates</p></div><div className="small-comparison"><span>{report.original.input.members.length} members</span><span>→</span><strong>{report.reduced.input.members.length} member</strong></div></div>
    <details className="reduction-details"><summary>Inspect the reduction trail <span>{report.reduction.steps.filter(step => step.accepted).length} changes kept</span></summary><div className="trail">{report.reduction.steps.map((step, i) => <div key={i}><span className={`trail-mark ${step.accepted ? 'kept' : ''}`}>{step.accepted ? '✓' : '−'}</span><span>{step.label}</span><span>{step.accepted ? 'Same failure' : step.status === 'passed' ? 'Would pass' : 'Not retained'}</span></div>)}</div><p className="trail-foot">Name: {originalName} → {reducedName}. Container width stays unchanged. This is a bounded reduction, not a global minimum.</p></details>
  </>;
}

export function Dashboard() {
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [status, setStatus] = useState<RunStatus>({ state: 'idle', phase: 'Ready', events: [] });
  const [view, setView] = useState<'overview' | 'case' | 'test'>('overview');
  const [tab, setTab] = useState<'report' | 'lab'>('report');
  const [seed, setSeed] = useState('42');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());
  const running = status.state === 'running';

  const loadReport = async () => {
    const response = await fetch('/api/report');
    if (!response.ok) throw new Error('Could not read the saved report.');
    const data = await response.json();
    setReport(data.report);
  };
  useEffect(() => { void Promise.all([loadReport(), fetch('/api/status').then(response => response.json()).then(setStatus)]).catch(error => setError(String(error))); }, []);
  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt.current) / 1000));
      void fetch('/api/status').then(response => response.json()).then(async (next: RunStatus) => {
        if (cancelled) return;
        setStatus(next);
        if (next.state === 'completed') await loadReport();
        if (next.state === 'error') setError(next.error ?? 'The campaign could not finish.');
      }).catch(error => { if (!cancelled) setError(String(error)); });
    }, 700);
    return () => { cancelled = true; clearInterval(interval); };
  }, [running]);
  useEffect(() => {
    if (!report?.regression) { setCode(''); return; }
    let cancelled = false;
    void fetch(`/artifacts/${report.id}/regression.spec.ts`).then(response => { if (!response.ok) throw new Error('Could not read the exported test.'); return response.text(); }).then(text => { if (!cancelled) setCode(text); }).catch(error => { if (!cancelled) setError(String(error)); });
    return () => { cancelled = true; };
  }, [report?.id]);

  async function run() {
    if (!/^\d+$/.test(seed) || Number(seed) > 2147483647) { setError('Choose a whole-number seed from 0 to 2147483647.'); return; }
    setError(''); setView('overview'); setTab('report'); startedAt.current = Date.now(); setElapsed(0);
    try {
      const response = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed: Number(seed), width: 360 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Could not start the campaign.');
      setStatus({ state: 'running', phase: 'Control', events: [] });
    } catch (error) { setError(String(error)); }
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied('Copied'); setTimeout(() => setCopied(''), 1800); }
    catch { setError('Clipboard access was unavailable. You can select and copy the code directly.'); }
  }

  return <div className="workspace">
    <aside className="sidebar"><a href="/" className="brand"><span className="brand-icon"><Icon kind="arrow" size={24}/></span><span>UI Crash Test<span className="brand-version">EXPERIMENT 001</span></span></a>
      <div className="sidebar-label">WORKSPACE</div><nav aria-label="Workspace"><button className={view === 'overview' ? 'active' : ''} onClick={() => setView('overview')}><Icon kind="grid"/>Overview<span className="nav-key">01</span></button><button disabled={!report?.reduced} className={view === 'case' ? 'active' : ''} onClick={() => setView('case')}><Icon kind="file"/>Saved case{report?.reduced && <span className="nav-count">1</span>}</button><button disabled={!report?.regression} className={view === 'test' ? 'active' : ''} onClick={() => setView('test')}><Icon kind="code"/>Regression{report?.regression?.verified && <i className="nav-dot"/>}</button></nav>
      <div className="sidebar-fixture"><div className="sidebar-label">TEST SURFACE</div><span className="fixture-symbol">M</span><strong>Member list</strong><small>Browser-side JSON fixture</small><div className="sidebar-rule"><span>01</span> Action stays reachable</div></div>
      <div className="sidebar-bottom"><div><i className={`dot ${running ? 'busy' : 'pass'}`}/>{running ? 'Experiment running' : 'Local workspace'}</div><span>Chromium · no cloud service</span><div className="sidebar-command"><Icon kind="terminal" size={15}/><code>npm run crash</code></div><small>Local RC 0.2.0-rc.2</small></div>
    </aside>
    <div className="main-area"><header className="topbar"><div><span>Workspace</span><b>/</b>Member list</div><span className="topbar-status"><i className="dot pass"/>LOCAL EXPERIMENT</span></header>
      <main className="main-content"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-square"/> CONTENT RESILIENCE / 001</div><h1>{view === 'case' ? 'A case worth keeping.' : view === 'test' ? 'Make the fix stick.' : 'Find the breaking point.'}</h1><p>{view === 'case' ? 'The actual reduced input, ready to replay.' : view === 'test' ? 'One exported test. Verified against both layout variants.' : 'Realistic data. A real browser. A smaller example of what broke.'}</p></div><button className="primary-button" disabled={running} onClick={() => void run()}>{running ? <span className="spinner"/> : <Icon kind="play" size={16}/>} {running ? 'Running experiment' : report ? 'Run again' : 'Run crash test'}<span className="button-arrow">↗</span></button></div>
      {error && <div className="error-banner" role="alert"><strong>The experiment needs attention.</strong> {error}</div>}
      {running && <div className="running-banner" role="status"><span className="spinner"/><strong>{status.phase}</strong><span>{status.events.at(-1)?.message ?? 'Starting a fresh browser context…'}</span><time>{elapsed}s</time></div>}
      {report && running && <div className="last-run-note">Showing the last completed run while the new experiment runs.</div>}
      <section className="metrics" aria-label="Campaign results"><div className="metric"><span>CASES CHECKED</span><strong>{report?.summary.checked ?? '—'}<small>{report ? 'valid inputs' : '14 planned'}</small></strong><p>{report ? `${report.summary.passed} passed · ${report.summary.inconclusive} inconclusive` : 'Curated cases + seeded combinations'}</p></div><div className="metric"><span>FAILING CASES</span><strong className={report?.summary.failed ? 'amber-text' : ''}>{report?.summary.failed ?? '—'}<small>one declared rule</small></strong><p>Action containment + pointer hit test</p></div><div className="metric"><span>FAILURE CONFIRMED</span><strong>{report?.confirmation ? `${report.confirmation.failures}/${report.confirmation.attempts}` : '—'}<small>fresh contexts</small></strong><p>Original failure replayed independently</p></div><div className="metric"><span>EXPORTED REGRESSION</span><strong className={report?.regression?.verified ? 'green-text regression-metric' : ''}>{report?.regression?.verified ? 'RED → GREEN' : '—'}</strong><p>{report?.regression?.verified ? 'Same saved input · same assertion' : 'Verified after a failure is saved'}</p></div></section>
      {view === 'overview' && <><div className="content-tabs"><div><button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>Experiment report{report && <span className="tab-count">1</span>}</button><button className={tab === 'lab' ? 'active' : ''} onClick={() => setTab('lab')}>Fixture lab</button></div><span>{report ? `${new Date(report.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · ${(report.durationMs / 1000).toFixed(1)}s run` : 'NO CAMPAIGN RUN YET'}</span></div>
        {tab === 'lab' || !report ? <><LiveLab/>{!report && <div className="first-run-note"><Icon kind="bolt" size={20}/><div><strong>From a broken row to a reusable test.</strong><p>Run 14 valid cases at a 360px container, confirm a failure, reduce the fixture, and verify the exported test.</p></div></div>}</> : <Evidence key={report.id} report={report}/>}</>}
      {view === 'case' && report?.reduced && <section className="code-section"><div className="section-heading"><div><span className="eyebrow">EXACT INPUT / NO REGENERATION</span><h2>Reduced member fixture</h2></div><button className="secondary-button" onClick={() => void copy(JSON.stringify(report.reduced!.input, null, 2))}>{copied || 'Copy input'}</button></div><pre className="code-panel">{JSON.stringify(report.reduced.input, null, 2)}</pre><p className="muted">Seed {report.seed} is retained as provenance. Replay uses these saved values, so generator changes do not change this test.</p></section>}
      {view === 'test' && report?.regression && <section className="code-section"><div className="regression-proof"><span className="proof-red">Original layout <b>{report.regression.broken.failed} failed</b></span><span>→</span><span className="proof-green">Fixed layout <b>{report.regression.fixed.passed} passed</b></span><span className="proof-label">Executed with Playwright · no retries</span></div><div className="section-heading"><div><span className="eyebrow">GENERATED TEST</span><h2>A regression you can rerun.</h2></div><button className="secondary-button" onClick={() => void copy(code)} disabled={!code}>{copied || 'Copy test'}</button></div><pre className="code-panel">{code || 'Loading exported test…'}</pre><p className="muted">The bundle includes the exact measurement source, fixture, config, and test. Both demo variants are included; no source files were automatically patched.</p></section>}
      {report && <div className="artifact-bar"><div><Icon kind="file"/><span>Keep the evidence.<small>{report.id}</small></span></div><div><a className="text-link" href={`/artifacts/${report.id}/report.html`} target="_blank" rel="noreferrer">Standalone report <Icon kind="external" size={14}/></a>{report.regression && <a className="secondary-button" href={`/artifacts/${report.id}/replay-bundle.zip?download=1`}><Icon kind="download" size={15}/>Replay bundle</a>}</div></div>}
      {view === 'overview' && <ScenarioPanel/>}
      <section className="run-settings"><div><Icon kind="terminal" size={16}/><strong>Campaign settings</strong></div><label htmlFor="campaign-seed">Seed <input id="campaign-seed" value={seed} inputMode="numeric" disabled={running} onChange={event => setSeed(event.target.value)}/></label><span>Container <b>360px</b></span><span>Browser <b>Chromium</b></span><span className="settings-right">Curated + generated · 1 rule</span></section>
      {status.events.length > 0 && <details className="execution-log"><summary>Execution log <span>{status.events.length} events</span></summary><div>{status.events.map((event, index) => <p key={index}><time>{event.time.slice(11, 19)}</time><b>{event.phase}</b>{event.message}</p>)}</div></details>}
      <footer className="page-footer"><span><i className="dot"/>Local, inspectable, repeatable.</span><span>Configurable scenarios · one explicit rule per scenario · local RC 0.2.0-rc.2</span></footer>
      </main>
    </div>
  </div>;
}

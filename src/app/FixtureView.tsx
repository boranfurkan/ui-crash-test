import { useEffect, useState } from 'react';
import { assertValidInput, type CaseInput, type Layout } from "../demo/model.ts";
import { MemberList } from './MemberList.tsx';

export function FixtureView() {
  const params = new URLSearchParams(location.search);
  const layout: Layout = params.get('layout') === 'fixed' ? 'fixed' : 'broken';
  const width = Number(params.get('width') ?? 360);
  const profile = params.get('profile') === 'stress' ? 'stress' : 'baseline';
  const [input, setInput] = useState<CaseInput | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`/api/members?profile=${profile}`).then(async response => {
      if (!response.ok) throw new Error(`Fixture request failed (${response.status}).`);
      const value: unknown = await response.json();
      assertValidInput(value);
      const rendered = { ...value, containerWidth: width };
      assertValidInput(rendered);
      setInput(rendered);
    }).catch(error => setError(String(error)));
  }, [profile, width]);
  return <main className="fixture-page">
    {error ? <p role="alert">{error}</p> : input ? <section className="fixture-capture" data-fixture-stage data-ready="true" data-input={JSON.stringify(input)}>
      <div className="fixture-caption"><span>MEMBER LIST</span><span>{width}px container</span></div>
      <MemberList input={input} layout={layout}/>
      <div className="fixture-annotation"><span className={`fixture-dot ${layout}`}/>{layout === 'fixed' ? 'Fixed layout · identity can shrink' : 'Original layout · default flex minimum'}</div>
    </section> : <p className="fixture-loading">Loading fixture…</p>}
  </main>;
}

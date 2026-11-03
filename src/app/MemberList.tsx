import { useState } from 'react';
import type { CaseInput, Layout, Member } from '../shared/model.ts';

function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
  return [words[0], ...(words.length > 1 ? [words.at(-1)!] : [])].map(word => [...segmenter.segment(word)][0]?.segment ?? '').join('').toUpperCase();
}

function MemberRow({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);
  return <div className="member-row" data-member-id={member.id}>
    {member.avatar && <div className={`avatar ${member.avatar}`} aria-hidden="true">{initials(member.name)}</div>}
    <div className="member-identity">
      <div className="member-name" title={member.name}>{member.name}</div>
      <div className="member-email" title={member.email}>{member.email}</div>
    </div>
    {(member.status === 'invited' || member.role) && <span className={`member-badge ${member.status === 'invited' ? 'pending' : ''}`}>{member.status === 'invited' ? 'Invite pending' : member.role}</span>}
    <button className="member-action" data-action aria-label={`Actions for ${member.name}`} aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
    </button>
    {open && <div className="member-menu" role="menu"><button role="menuitem" onClick={() => setOpen(false)}>View member</button></div>}
  </div>;
}

export function MemberList({ input, layout }: { input: CaseInput; layout: Layout }) {
  return <div className="member-list" data-layout={layout} style={{ width: input.containerWidth }}>
    <div className="member-list-heading"><span>Workspace members</span><span className="member-count">{input.members.length}</span></div>
    {input.members.map(member => <MemberRow key={member.id} member={member}/>)}
    <div className="member-list-footer">Only workspace owners can manage members.</div>
  </div>;
}

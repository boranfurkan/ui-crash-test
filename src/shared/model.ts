export type Member = {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Member' | 'Viewer' | null;
  status: 'active' | 'invited';
  avatar: 'sage' | 'sand' | 'lilac' | null;
};

export type CaseInput = { containerWidth: number; members: Member[] };
export type Layout = 'broken' | 'fixed';
export const TARGET_ID = 'member-primary';
export const RULE = {
  id: 'action-reachable',
  target: '[data-member-id="member-primary"] [data-action]',
  boundary: '[data-member-id="member-primary"]',
  description: 'The member action stays inside its row and can receive pointer events.',
} as const;

export const BASELINE: CaseInput = {
  containerWidth: 360,
  members: [
    { id: TARGET_ID, name: 'Maya Chen', email: 'maya@orbit.test', role: 'Owner', status: 'active', avatar: 'sage' },
    { id: 'member-second', name: 'Alex Morgan', email: 'alex@orbit.test', role: 'Member', status: 'active', avatar: 'sand' },
    { id: 'member-third', name: 'Noor Ali', email: 'noor@orbit.test', role: 'Viewer', status: 'active', avatar: 'lilac' },
  ],
};

export const WORST_CASE: CaseInput = {
  containerWidth: 360,
  members: BASELINE.members.map((member, index) => index ? { ...member } : {
    ...member,
    name: 'Alexandria Konstantinopoulou-Wiśniewska',
    email: 'alexandria.konstantinopoulou@northwind.example.test',
    status: 'invited',
  }),
};

export function cloneInput(input: CaseInput): CaseInput {
  return structuredClone(input);
}

export function validateInput(value: unknown): string[] {
  if (!value || typeof value !== 'object') return ['Case must be an object.'];
  const input = value as Partial<CaseInput>;
  const errors: string[] = [];
  if (!Number.isInteger(input.containerWidth) || input.containerWidth! < 320 || input.containerWidth! > 640) {
    errors.push('Container width must be an integer from 320 to 640.');
  }
  if (!Array.isArray(input.members) || input.members.length < 1 || input.members.length > 5) {
    return [...errors, 'The fixture must contain 1–5 members.'];
  }
  const ids = new Set<string>();
  for (const member of input.members) {
    if (!member || typeof member !== 'object') { errors.push('Member must be an object.'); continue; }
    if (typeof member.id !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(member.id) || ids.has(member.id)) errors.push('Member IDs must be unique, stable identifiers.');
    ids.add(member.id);
    if (typeof member.name !== 'string' || !member.name.trim() || Array.from(member.name).length > 80) errors.push('Name must contain 1–80 Unicode code points.');
    if (typeof member.email !== 'string' || member.email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) errors.push('Email must be valid-shaped and at most 120 characters.');
    if (![null, 'Owner', 'Member', 'Viewer'].includes(member.role)) errors.push('Role must be an allowed value or null.');
    if (!['active', 'invited'].includes(member.status)) errors.push('Status must be active or invited.');
    if (![null, 'sage', 'sand', 'lilac'].includes(member.avatar)) errors.push('Avatar must be an allowed value or null.');
  }
  if (!ids.has(TARGET_ID)) errors.push('The declared target member must exist.');
  return errors;
}

export function assertValidInput(value: unknown): asserts value is CaseInput {
  const errors = validateInput(value);
  if (errors.length) throw new Error(`Invalid fixture: ${errors.join(' ')}`);
}

export function inputComplexity(input: CaseInput): number {
  return input.members.reduce((sum, member) => sum + 100 + Array.from(member.name).length + member.email.length + (member.role ? 10 : 0) + (member.avatar ? 10 : 0) + (member.status === 'invited' ? 10 : 0), 0);
}

export function primaryMember(input: CaseInput): Member {
  const member = input.members.find(member => member.id === TARGET_ID);
  if (!member) throw new Error('Target member is missing.');
  return member;
}

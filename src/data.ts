import type { Label, Member, Priority, Project, Status, Task } from './types';
import { addDays, startOfDay, toISO, uid } from './utils';

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=faces&w=160&h=160&q=80`;

export const MEMBERS: Member[] = [
  { id: 'm1', name: 'Maya Chen', role: 'Design lead', avatar: img('1699899657675-1003c7d28f2d') },
  { id: 'm2', name: 'Jonas Weber', role: 'Frontend engineer', avatar: img('1714750977930-e7a7f4611257') },
  { id: 'm3', name: 'Priya Raman', role: 'Product manager', avatar: img('1783598539449-36a8e3faef54') },
  { id: 'm4', name: 'Leo Martins', role: 'Backend engineer', avatar: img('1633625576932-348e73c45e82') },
  { id: 'm5', name: 'Sofia Alvarez', role: 'Marketing lead', avatar: img('1514960919797-5ff58c52e5ba') },
  { id: 'm6', name: 'Kwame Mensah', role: 'Mobile engineer', avatar: img('1748028313767-67d97c23a0d0') },
];
export const CURRENT_USER = 'm1';
export const MEMBER_MAP: Record<string, Member> = Object.fromEntries(MEMBERS.map((m) => [m.id, m]));

export const PROJECTS: Project[] = [
  { id: 'p1', name: 'Website relaunch', key: 'WEB', color: '#12a594' },
  { id: 'p2', name: 'Mobile app v2', key: 'MOB', color: '#8e4ec6' },
  { id: 'p3', name: 'Q3 marketing', key: 'MKT', color: '#f76b15' },
];
export const PROJECT_MAP: Record<string, Project> = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));

export const LABELS: Label[] = [
  { id: 'design', name: 'Design', color: '#d6409f' },
  { id: 'frontend', name: 'Frontend', color: '#3e63dd' },
  { id: 'backend', name: 'Backend', color: '#12a594' },
  { id: 'bug', name: 'Bug', color: '#e5484d' },
  { id: 'research', name: 'Research', color: '#e2a336' },
  { id: 'content', name: 'Content', color: '#8e4ec6' },
  { id: 'qa', name: 'QA', color: '#7c7c88' },
  { id: 'infra', name: 'Infra', color: '#978365' },
  { id: 'growth', name: 'Growth', color: '#f76b15' },
];
export const LABEL_MAP: Record<string, Label> = Object.fromEntries(LABELS.map((l) => [l.id, l]));

export const taskKey = (t: Task) => `${PROJECT_MAP[t.projectId]?.key ?? 'TSK'}-${t.number}`;

type Seed = [string, Status, string, string, number | null, Priority, string, string[], string?];

const SEEDS: Seed[] = [
  // Website relaunch
  ['p1', 'done', 'Audit current site analytics', 'm3', -12, 'medium', 'research', ['x Export GA4 top pages', 'x Identify drop-off pages', 'x Share summary in #web'], 'Pull 12 months of traffic data and flag the pages that matter most for the relaunch.'],
  ['p1', 'done', 'Define new information architecture', 'm3 m1', -8, 'high', 'design research', ['x Card sort with 12 users', 'x Draft sitemap', 'x Review with stakeholders']],
  ['p1', 'review', 'Homepage hero redesign', 'm1', 1, 'high', 'design', ['x Three layout explorations', 'x Pick direction with Priya', 'Final copy pass', 'Export assets'], 'Lead with the product, not the slogan. One clear CTA above the fold, a live product preview on the right.'],
  ['p1', 'progress', 'Build responsive navigation', 'm2', 3, 'high', 'frontend', ['x Desktop mega menu', 'Mobile drawer', 'Keyboard focus states', 'Reduced motion support'], 'Implement the new nav from the Figma file. Must work without JS for the top-level links.'],
  ['p1', 'progress', 'Migrate blog posts to new CMS', 'm4', 5, 'medium', 'backend content', ['x Write migration script', 'x Dry run on staging', 'Fix broken embeds', 'Redirect map']],
  ['p1', 'todo', 'Set up 301 redirect map', 'm4', 9, 'urgent', 'backend', [], 'Every old URL needs a permanent redirect before DNS cutover. Export from the crawler and map by hand where slugs changed.'],
  ['p1', 'todo', 'Write pricing page copy', 'm5', 7, 'medium', 'content', ['Plan comparison table', 'FAQ section', 'Legal review']],
  ['p1', 'todo', 'Accessibility audit (WCAG 2.2 AA)', 'm2', 14, 'high', 'frontend qa', ['Color contrast', 'Screen reader pass', 'Focus order', 'Form labels']],
  ['p1', 'review', 'Case study page template', 'm1 m2', 2, 'medium', 'design frontend', ['x Layout', 'x Pull quote component', 'Metrics strip']],
  ['p1', 'todo', 'Performance budget & Lighthouse CI', 'm2', 12, 'low', 'frontend infra', [], 'Fail the build if LCP regresses past 2.5s on the homepage.'],
  ['p1', 'progress', 'Fix layout shift on product pages', 'm2', 0, 'urgent', 'bug frontend', ['x Reproduce on throttled 4G', 'Reserve image space', 'Verify CLS < 0.1']],
  ['p1', 'todo', 'Cookie consent banner', 'm4 m2', 18, 'medium', 'frontend backend', []],
  ['p1', 'done', 'Choose CMS vendor', 'm3 m4', -15, 'medium', 'research', ['x Shortlist three vendors', 'x Run pilot', 'x Sign contract']],
  ['p1', 'todo', 'Launch checklist & go-live plan', 'm3', 21, 'high', '', ['DNS cutover', 'Monitoring alerts', 'Rollback plan', 'Announce launch'], 'Single source of truth for launch day. Owners and times for every step.'],
  // Mobile app v2
  ['p2', 'progress', 'Onboarding flow v2', 'm6 m1', 4, 'high', 'design frontend', ['x Welcome screens', 'x Permission priming', 'Account linking', 'Skip logic'], 'Cut onboarding from 7 screens to 4. Ask for notifications only after the first meaningful action.'],
  ['p2', 'todo', 'Push notification preferences', 'm6 m4', 10, 'medium', 'frontend backend', ['Settings UI', 'Preferences API', 'Migrate existing opt-ins']],
  ['p2', 'review', 'Offline sync for drafts', 'm4 m6', 2, 'urgent', 'backend', ['x Conflict resolution strategy', 'x Queue writes', 'Retry with backoff', 'QA on flaky network']],
  ['p2', 'progress', 'Dark mode for all screens', 'm6', 6, 'medium', 'design frontend', ['x Token audit', 'Charts', 'Illustrations']],
  ['p2', 'todo', 'App Store screenshots', 'm1 m5', 16, 'low', 'design content', []],
  ['p2', 'todo', 'Crash on Android 14 when opening camera', 'm6', -1, 'urgent', 'bug', ['Reproduce on Pixel 8', 'Check permission flow'], 'Sentry shows ~2% of Android 14 sessions crashing on camera open since 2.8.1.'],
  ['p2', 'done', 'Upgrade to React Native 0.76', 'm6', -6, 'high', 'infra', ['x Bump dependencies', 'x Fix breaking changes', 'x Smoke test']],
  ['p2', 'todo', 'Biometric login', 'm4 m6', 13, 'high', 'backend frontend', []],
  ['p2', 'progress', 'Redesign settings screen', 'm1', 3, 'low', 'design', ['x Group settings', 'Search in settings']],
  ['p2', 'review', 'In-app feedback widget', 'm2', 1, 'medium', 'frontend', []],
  ['p2', 'todo', 'Beta testing with 50 users', 'm3', 20, 'high', 'research qa', ['Recruit testers', 'TestFlight build', 'Feedback survey']],
  ['p2', 'done', 'Analytics event taxonomy', 'm3 m4', -10, 'medium', 'research backend', ['x Draft naming scheme', 'x Review with data team']],
  ['p2', 'todo', 'Reduce app bundle size', 'm6', null, 'medium', 'infra', []],
  ['p2', 'progress', 'Fix deep links from email', 'm4', -2, 'high', 'bug backend', ['x Universal links config', 'Android intent filters']],
  // Q3 marketing
  ['p3', 'progress', 'Q3 campaign brief', 'm5 m3', 2, 'high', 'content growth', ['x Goals & KPIs', 'x Audience segments', 'Channel mix', 'Budget split'], 'One-page brief covering the "Ship faster together" campaign across paid, owned and partner channels.'],
  ['p3', 'todo', 'Webinar: Shipping faster with small teams', 'm5', 19, 'medium', 'growth content', ['Book speakers', 'Landing page', 'Email invites']],
  ['p3', 'review', 'Paid social creative — round 1', 'm1 m5', 1, 'high', 'design growth', ['x 6 static variants', 'x 2 motion variants', 'Copy review']],
  ['p3', 'todo', 'SEO content calendar', 'm5', 8, 'medium', 'content', []],
  ['p3', 'progress', 'Customer story: Northwind', 'm5', 5, 'medium', 'content', ['x Interview', 'Draft', 'Customer approval']],
  ['p3', 'todo', 'Newsletter redesign', 'm1', null, 'low', 'design', []],
  ['p3', 'done', 'Q2 performance report', 'm3', -9, 'medium', 'research', ['x Pull channel data', 'x Write summary']],
  ['p3', 'todo', 'Partner co-marketing outreach', 'm3 m5', 14, 'medium', 'growth', []],
  ['p3', 'review', 'Landing page A/B test setup', 'm2 m5', 0, 'high', 'frontend growth', ['x Variant B build', 'Analytics goals']],
  ['p3', 'todo', 'Product Hunt launch prep', 'm5 m3', 24, 'high', 'growth', ['Hunter outreach', 'Assets & GIFs', 'Launch day schedule', 'Team reply rota']],
  ['p3', 'done', 'Brand voice guidelines', 'm5 m1', -14, 'medium', 'content', ['x Tone principles', 'x Do / don\'t examples']],
  ['p3', 'todo', 'Retargeting audiences', 'm5', 9, 'low', 'growth', []],
  ['p3', 'progress', 'Conference booth design', 'm1', 17, 'medium', 'design', ['x Floor plan', 'Banner artwork', 'Print vendor']],
];

const COMMENTS = [
  'Pushed a first pass — feedback welcome before Thursday.',
  'Looks good to me. Let’s ship it after QA signs off.',
  'Blocked on the API contract, following up today.',
  'Added screenshots and notes to the Figma file.',
  'Can we scope this down so it fits this sprint?',
  'I’ll pair on this tomorrow morning if that helps.',
  'Numbers from last week are in the sheet, trend is positive.',
  'Left a few comments on copy. Mostly small wording tweaks.',
];

export function seedTasks(): Task[] {
  const today = startOfDay();
  const counters: Record<string, number> = {};
  const orders: Record<string, number> = {};
  return SEEDS.map(([projectId, status, title, who, due, priority, labels, checklist, description], i) => {
    counters[projectId] = (counters[projectId] ?? 0) + 1;
    const ok = projectId + status;
    orders[ok] = (orders[ok] ?? 0) + 1;
    const assignees = who.split(' ').filter(Boolean);
    const n = i % 5 === 0 ? 3 : i % 4 === 0 ? 2 : i % 3 === 0 ? 1 : 0;
    const comments = Array.from({ length: n }, (_, k) => ({
      id: uid(),
      authorId: k === 0 ? assignees[0] ?? 'm3' : MEMBERS[(i + k * 2) % MEMBERS.length].id,
      text: COMMENTS[(i * 3 + k) % COMMENTS.length],
      createdAt: new Date(Date.now() - ((n - k) * 9 + (i % 5)) * 3600_000).toISOString(),
    }));
    return {
      id: uid(),
      projectId,
      number: counters[projectId],
      title,
      description: description ?? '',
      status,
      order: orders[ok],
      assignees,
      due: due === null ? null : toISO(addDays(today, due)),
      priority,
      labels: labels.split(' ').filter(Boolean),
      checklist: checklist.map((c) => ({ id: uid(), text: c.replace(/^x /, ''), done: c.startsWith('x ') })),
      comments,
      createdAt: new Date(Date.now() - (45 - i) * 86400000).toISOString(),
    };
  });
}

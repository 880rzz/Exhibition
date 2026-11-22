/**
 * Central VIPACH Exhibition chronology and archive visibility.
 * New exhibitions may become the homepage at build time without editing site.json.
 * Staged/rights-review exhibitions cannot be promoted automatically.
 */
const BLOCKED = new Set(['planned','draft','cancelled']);
function day(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const stamp = Date.parse(value);
  return Number.isFinite(stamp) ? new Date(stamp).toISOString().slice(0,10) : null;
}
export function exhibitionDate(e) {
  return day(e?.dates?.opening?.officialStart)
      || day(e?.dates?.opening?.start)
      || day(e?.dates?.publicVisit?.start)
      || day(e?.dates?.publicVisit?.canonicalForLivePages?.start)
      || (Number.isInteger(e?.year) ? String(e.year)+'-01-01' : null);
}
function released(e, today) {
  if (!e || BLOCKED.has(e.status) || e.realized === false) return false;
  if (e.publicationState === 'staged' || e.publicationState === 'draft' || e.publicReleaseApproved === false) return false;
  const date = exhibitionDate(e);
  return !!date && date <= today;
}
export function newestFeatured(exhibitions, buildDate = new Date()) {
  const today = buildDate.toISOString().slice(0,10);
  const eligible = exhibitions.filter(e => e.render === 'full-html' && released(e,today));
  eligible.sort((a,b)=>exhibitionDate(b).localeCompare(exhibitionDate(a)) || a.slug.localeCompare(b.slug));
  if (!eligible.length) throw new Error('No released full-html exhibition eligible for featured homepage');
  return eligible[0];
}
export function menuExhibitions(exhibitions, featured, buildDate = new Date()) {
  const today = buildDate.toISOString().slice(0,10);
  const visible = exhibitions.filter(e => released(e,today) &&
    (e.slug === featured.slug || e.navigation?.showInHamburger === true || e.render === 'full-html'));
  visible.sort((a,b) => exhibitionDate(b).localeCompare(exhibitionDate(a)) || a.slug.localeCompare(b.slug));
  return visible;
}

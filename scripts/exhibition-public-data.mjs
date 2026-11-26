import { spontanVenueSource, gallerySources } from './exhibition-seo.mjs';

const base = 'https://exhibition.vipach.at';
const routes = slug => ({
  en: base + '/' + slug + '/',
  hu: base + '/hu/' + slug + '/',
  de: base + '/de/' + slug + '/',
});
const sourceUrls = (event, opening) => ({
  organizerExhibition: event.external?.vipachPage?.hu || event.external?.vipachEventPage,
  openingListing: opening,
});
function publicVenue(v) {
  const address = v.address || v;
  return {
    name: v.name, streetAddress: address.streetAddress, postalCode: address.postalCode,
    addressLocality: address.addressLocality, addressCountry: address.addressCountry,
  };
}
function publicPress(event) {
  return (event.pressCoverage?.items || []).map(({ title, publication, date, issue, type, language, url }) =>
    ({ title, publication, date, issue, type, language, url }));
}
function archiveFacts(event, show, scope) {
  const venue = publicVenue(event.venue);
  return {
    slug: show.slug,
    title: event.titles,
    status: 'past-exhibition',
    supporter: { name: 'OM SYSTEM', shop: 'https://www.omsystemshop.hu/' },
    urls: routes(show.slug),
    publicVisit: { start: event.dates.publicVisit.start, end: event.dates.publicVisit.end },
    opening: { listedStart: event.dates.opening.listedStart, listedEnd: event.dates.opening.listedEnd, timeZone: 'Europe/Vienna' },
    venue,
    sources: { ...sourceUrls(event, event.dates.opening.source), venueExhibitionListing: gallerySources[show.slug], venueAddress: event.venue.addressSource },
    curator: event.team?.curator?.name,
    catalogue: {
      works: show.works.length,
      identifiedArtists: new Set(show.works.map(w => w.galleryEvidence.artistProfileId)).size,
      organizerReportedArtists: event.counts.sourceClaimedPhotographers,
      artists: show.artistProfiles.map(({ id, name }) => ({ name, anchor: 'artist-' + id })),
      workAttribution: show.works.map(w => ({
        anchor: w.id, galleryPosition: w.galleryEvidence.galleryPosition, artist: w.creator,
        artistAnchor: 'artist-' + w.galleryEvidence.artistProfileId,
      })),
    },
    media: {
      archiveDisplayAuthority: 'VIPACH organizer attestation for these archive uses only',
      workDisplaysInScope: show.works.length,
      portraitDisplaysInScope: show.artistProfiles.length,
      individuallyVerifiedDisplayPermissions: scope.independentlyVerifiedUseCount,
      publicReuseAuthorized: false,
    },
    press: publicPress(event),
  };
}
function spontanFacts(event) {
  const opening = event.dates.opening, visits = event.dates.publicVisit;
  return {
    slug: event.slug,
    title: event.titles,
    status: 'past-exhibition',
    supporter: { name: 'OM SYSTEM', shop: 'https://www.omsystemshop.hu/' },
    urls: routes(event.slug),
    publicVisit: { start: visits.canonicalForLivePages.start, end: visits.canonicalForLivePages.end, closesAt: visits.verifiedClosingTime },
    opening: { reception: opening.doorTime, officialStart: opening.officialStart, timeZone: opening.timezone },
    venue: publicVenue(event.venue),
    sources: {
      venueExhibitionListing: spontanVenueSource,
      historicalOrganizerCalendar: event.external.vipachEventPage,
      historicalOrganizerCalendarEnd: '2026-11-22T23:59:00+01:00',
      dateNote: 'Historical calendar discrepancy. Use the venue-confirmed public visiting period above.',
    },
    curator: event.team?.curator?.name,
    organizers: event.team?.organizers?.map(x => x.name),
    patron: event.team?.patron?.name,
    catalogue: {
      works: event.counts.worksClaimed,
      identifiedArtists: event.counts.photographers,
      artists: event.artists.map(({ name }) => ({ name })),
    },
    media: {
      posterAndExistingWixEmbedsRightsStatus: 'review-required',
      individuallyVerifiedDisplayPermissions: event.counts.licenceVerifiedApprovedForPublicDisplay,
      publicReuseAuthorized: false,
    },
    press: publicPress(event),
  };
}
export function publicExhibitionFacts(exhibitions, scope) {
  const bySlug = new Map(exhibitions.map(e => [e.slug, e]));
  return {
    version: 'vipach-exhibition-facts-1',
    publisher: 'VIPACH — Vienna Photo Art & Creative Hub',
    context: {
      role: 'Community photography exhibition archive',
      website: base+'/',
      communityClub: 'https://www.vipach.at/',
      professionalPhotography: 'https://www.banhalmiphotography.com/',
      commercialDigitalAdvertising: 'https://business.vipach.at/',
      note: 'VIPACH for Business is a separate commercial service of Banhalmi Norbert e.U.; not part of the community club or archive.',
    },
    languages: ['en', 'hu', 'de-AT'],
    summary: 'Public exhibition facts, not a media feed, current price list or licence granted to readers.',
    exhibitions: [
      ...(bySlug.has('spontan-2026') ? [spontanFacts(bySlug.get('spontan-2026'))] : []),
      ...(scope?.shows || []).filter(show => bySlug.has(show.slug)).map(show => archiveFacts(bySlug.get(show.slug), show, scope)),
    ].sort((a,b) => b.publicVisit.start.localeCompare(a.publicVisit.start)),
  };
}

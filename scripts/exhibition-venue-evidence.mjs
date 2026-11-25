/** Citations to the host's original event archive, not press or third-party endorsements. */
export const venueHome = 'https://publicartists.online/en/citygalleryvienna/';
export const venueAddress={streetAddress:'Mahlerstraße 11',postalCode:'1010',addressLocality:'Wien',addressCountry:'AT'};
export const venueSources={
 'spontan-2026':{url:'https://publicartists.online/event/vipach-151126/',name:'Vienna Photo Art & Creative Hub in der CITYgalleryVIENNA',date:['2026-11-15','2026-11-21']},
 'eletem-kepe':{url:'https://publicartists.online/event/eletem-kepe-071225/',name:'Életem képe in der CITYgalleryVIENNA',date:['2025-12-07','2025-12-13']},
 'as-i-like-it-austria':{url:'https://publicartists.online/event/bmi-fotoclub-301125/',name:'AS I LIKE IT AUSTRIA!',date:['2025-11-30','2025-12-06']}
};
const l={
 hu:{title:'A kiállítás helyszíni forrása',desc:'A CITYgalleryVIENNA saját programarchívuma igazolja a tárlat helyszínét és nyilvános dátumait.',event:'A galéria eredeti eseményoldala',venue:'A CITYgalleryVIENNA honlapja'},
 en:{title:'Venue and event record',desc:'CITYgalleryVIENNA’s own event archive confirms the venue and public exhibition dates.',event:'Original event listing from the gallery',venue:'CITYgalleryVIENNA website'},
 de:{title:'Veranstaltungsort und Originaleintrag',desc:'Das eigene Programmarchiv der CITYgalleryVIENNA bestätigt den Ort und die öffentlichen Ausstellungsdaten.',event:'Originaler Veranstaltungseintrag der Galerie',venue:'Website der CITYgalleryVIENNA'}
};
export function venueEvidenceMarkup(slug,locale){
 const e=venueSources[slug], c=l[locale];
 if(!e || !c)return '';
 return '<section class="section exhibition-venue-evidence" id="venue-evidence" aria-labelledby="venue-evidence-title"><div class="section-inner editorial-grid"><div><p class="kicker">CITYgalleryVIENNA · publicartists</p><h2 class="display-2" id="venue-evidence-title">'+c.title+'</h2></div><div class="prose"><p>'+c.desc+'</p><p>Mahlerstraße 11 · 1010 Wien</p><div class="actions"><a class="button primary" href="'+e.url+'" rel="noreferrer">'+c.event+'</a><a class="button" href="'+venueHome+'" rel="noreferrer">'+c.venue+'</a></div></div></div></section>';
}

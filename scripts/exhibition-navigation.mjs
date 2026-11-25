/** Shared native disclosure navigation for published exhibition routes. */
import { exhibitionDate } from "./exhibition-chronology.mjs";
const esc=x=>String(x??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const labels={
  "en": {
    "heading": "Exhibitions",
    "overview": "Overview",
    "community": "Community",
    "name": "The name",
    "learning": "Learning year",
    "spontan": "SPONTANEOUS",
    "story": "Exhibition story",
    "exhibitors": "Exhibitors",
    "team": "Team",
    "press": "Press coverage",
    "history": "Previous exhibitions",
    "visit": "Visit"
  },
  "hu": {
    "heading": "Kiállítások",
    "overview": "Áttekintés",
    "community": "Közösség",
    "name": "A név",
    "learning": "Tanulási év",
    "spontan": "SPONTÁN",
    "story": "A kiállítás története",
    "exhibitors": "Kiállítók",
    "team": "Stáb",
    "press": "Sajtómegjelenések",
    "history": "Előző kiállítások",
    "visit": "Látogatás"
  },
  "de": {
    "heading": "Ausstellungen",
    "overview": "Überblick",
    "community": "Gemeinschaft",
    "name": "Der Name",
    "learning": "Lernjahr",
    "spontan": "SPONTAN",
    "story": "Die Geschichte der Ausstellung",
    "exhibitors": "Ausstellende",
    "team": "Team",
    "press": "Presseberichte",
    "history": "Frühere Ausstellungen",
    "visit": "Besuch"
  }
};
const archiveLabels={
  "en": {
    "exhibitors": "Meet the artists",
    "team": "Behind the exhibition",
    "history": "Previous exhibition",
    "visit": "Exhibition details"
  },
  "hu": {
    "exhibitors": "Ismerd meg az alkotókat",
    "team": "A kiállítás mögött",
    "history": "Előző kiállítás",
    "visit": "Látogatási információk"
  },
  "de": {
    "exhibitors": "Die Kunstschaffenden",
    "team": "Hinter der Ausstellung",
    "history": "Vorherige Ausstellung",
    "visit": "Besuchsinformationen"
  }
};
export function renderExhibitionNavigation(exhibitions,lang,currentSlug,hrefFor,{historicalSections=false,preview=false}={}){
 const c=labels[lang];
 return '<div class="exhibition-nav-group" aria-label="'+esc(c.heading)+'"><p class="exhibition-nav-heading">'+esc(c.heading)+'</p>'+exhibitions.map(ex=>{
  const slug=ex.slug,href=hrefFor(ex),current=slug===currentSlug,name=ex.titles?.[lang]||ex.titles?.en||slug,year=exhibitionDate(ex)?.slice(0,4);
  let ids=[],copy=c;
  if(slug==="spontan-2026")ids=["community","name","learning","spontan","exhibitors","team","history","visit"];
  else if(historicalSections&&(slug==="eletem-kepe"||slug==="as-i-like-it-austria")){ids=["story","exhibitors","team"];copy={...c,...archiveLabels[lang]};if(slug==="eletem-kepe"||preview)ids.push("history");ids.push("visit");}
  if(ex.pressCoverage?.items?.length)ids.splice(ids.indexOf("history")>=0?ids.indexOf("history"):ids.indexOf("visit")>=0?ids.indexOf("visit"):ids.length,0,"press");
  return '<details class="exhibition-disclosure" data-exhibition="'+esc(slug)+'"><summary class="exhibition-menu-summary"><span>'+esc(name)+'</span>'+(year?'<small>'+esc(year)+'</small>':'')+'</summary><div class="exhibition-submenu"><a class="exhibition-menu-entry" href="'+esc(href)+'"'+(current?' aria-current="page"':'')+'>'+esc(c.overview)+'</a>'+ids.map(id=>'<a class="exhibition-submenu-link" href="'+esc((current?"":href)+"#"+id)+'">'+esc(copy[id])+'</a>').join("")+'</div></details>';
 }).join("")+'</div>';
}

// Display translations of documented editorial headlines; outbound hreflang still describes the source.
const headlines={
 spont:{en:'When a moment becomes an exhibition: SPONTÁN opens in Vienna',de:'Wenn aus einem Augenblick eine Ausstellung wird: SPONTÁN in Wien eröffnet',hu:'Amikor a pillanatból kiállítás születik – megnyílt a SPONTÁN fotókiállítás Bécsben'},
 orf:{en:'The BMI Photo Club celebrates with a photography exhibition',de:'Der BMI-Fotoclub feiert mit einer Fotoausstellung',hu:'Fotókiállítással ünnepel a BMI Fotóklub'},
 rolunk:{en:'One year of the BMI Photo Club: how art brings people together',de:'Ein Jahr BMI-Fotoclub: Wie Kunst Gemeinschaft schafft',hu:'Egyéves a BMI Fotóklub – hogyan teremt közösséget a művészet'},
 horizont:{en:'When photography brings people together',de:'Wenn Fotografie Gemeinschaft schafft',hu:'Amikor a fotográfia közösséget teremt'}
};
export function pressTitleFor(item,lang){
 if(item.language===lang)return item.title;
 const key=item.id.startsWith('becsi-szelet-spontan-')?'spont':item.id.split('-')[0];
 const title=headlines[key]?.[lang];
 if(!title)throw Error('Missing localized press title: '+item.id+'/'+lang);
 return title;
}

import fs from 'node:fs';

const read = name => JSON.parse(fs.readFileSync(new URL('../data/staging/'+name, import.meta.url), 'utf8'));
const titles = read('2025-catalogue-titles.json').shows;
const crosswalk = read('2025-editorial-copy.json').workDescriptionCrosswalk;
const label = {
  en: { description: 'Editorial title based on the artwork description', image: 'Editorial title based on the photograph', original: 'Title recorded in the source' },
  de: { description: 'Redaktioneller Titel nach der Werkbeschreibung', image: 'Redaktioneller Titel nach dem Foto', original: 'Titel in der Quelle' },
  hu: { description: 'Szerkesztői cím a műleírás alapján', image: 'Szerkesztői cím a fénykép alapján', original: 'A forrásban szereplő cím' },
};

export function catalogueTitle(slug, work, lang) {
  const row = titles[slug]?.[work.id], copy = label[lang];
  if (!copy || !row || row.galleryImageFileId !== work.galleryEvidence?.imageFileId || !row.titles[lang]?.trim())
    throw new Error('Missing image-bound editorial title: '+slug+'/'+work.id+'/'+lang);
  return {
    title: row.titles[lang],
    provenanceLabel: row.basis==='visible-gallery-photo' ? copy.image : copy.description,
    originalTitle: row.sourceTitle?.title || work.title?.hu || crosswalk[work.id]?.verifiedSourceTitle,
    originalTitleLang: row.sourceTitle?.lang || 'hu',
    originalTitleLabel: copy.original,
  };
}

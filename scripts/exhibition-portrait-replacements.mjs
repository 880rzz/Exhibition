import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Owner-supplied replacement for one public profile; leave the historical source intact.
export function archivedPortraitReplacement(slug, profile) {
  if (slug !== 'as-i-like-it-austria' || profile.id !== 'eszter') return null;
  if (profile.portraitSourceUrl !== 'https://static.wixstatic.com/media/b0aee1_2560b40a4d0d4dda9eedcaaee3ef3f0b~mv2.jpg')
    throw new Error('Unexpected historical source for Eszter Hölcz');
  const url = '/assets/portraits/eszter-holcz-square.webp';
  const digest = createHash('sha256').update(readFileSync(new URL('..'+url, import.meta.url))).digest('hex');
  if (digest !== '37f9f9f45663561f60d8377d884bb682304990438fe8b7b3d64bc611e2bba8df')
    throw new Error('Replacement portrait does not match the owner-supplied publication asset');
  return { url, width: 768, height: 768 };
}

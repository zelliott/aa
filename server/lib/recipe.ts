export interface ParsedRecipe {
  title: string;
  ingredients: string[];
  image?: string;
}

const LD_JSON = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
const TITLE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const OG_TITLE = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i;

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

function decodeEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m);
}

function clean(text: string): string {
  return decodeEntities(text.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
}

function isRecipeNode(node: unknown): node is Record<string, unknown> {
  if (typeof node !== 'object' || node === null) return false;
  const type = (node as Record<string, unknown>)['@type'];
  return type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
}

function findRecipeNode(data: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(data)) {
    for (const entry of data) {
      const found = findRecipeNode(entry);
      if (found) return found;
    }
    return undefined;
  }
  if (isRecipeNode(data)) return data;
  if (typeof data === 'object' && data !== null && '@graph' in data) {
    return findRecipeNode((data as Record<string, unknown>)['@graph']);
  }
  return undefined;
}

function imageUrl(image: unknown): string | undefined {
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return imageUrl(image[0]);
  if (typeof image === 'object' && image !== null && 'url' in image) {
    return imageUrl((image as Record<string, unknown>).url);
  }
  return undefined;
}

export function parseRecipe(html: string): ParsedRecipe {
  for (const match of html.matchAll(LD_JSON)) {
    let data: unknown;
    try {
      data = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const node = findRecipeNode(data);
    if (!node) continue;
    const ingredients = Array.isArray(node.recipeIngredient)
      ? node.recipeIngredient.filter((x): x is string => typeof x === 'string').map(clean)
      : [];
    return {
      title: clean(typeof node.name === 'string' ? node.name : ''),
      ingredients,
      image: imageUrl(node.image),
    };
  }

  const title = html.match(OG_TITLE)?.[1] ?? html.match(TITLE)?.[1] ?? '';
  return { title: clean(title), ingredients: [] };
}

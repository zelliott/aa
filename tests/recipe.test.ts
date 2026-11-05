import { describe, expect, it } from 'vitest';
import { parseRecipe } from '../server/lib/recipe.js';

describe('parseRecipe', () => {
  it('reads schema.org Recipe data', () => {
    const html = `<html><head>
      <script type="application/ld+json">
        {"@context":"https://schema.org","@type":"Recipe","name":"Tomato &amp; Bean Soup",
         "image":["https://example.com/soup.jpg"],
         "recipeIngredient":["2 cans tomatoes","1 can  cannellini beans"]}
      </script></head><body></body></html>`;
    expect(parseRecipe(html)).toEqual({
      title: 'Tomato & Bean Soup',
      ingredients: ['2 cans tomatoes', '1 can cannellini beans'],
      image: 'https://example.com/soup.jpg',
    });
  });

  it('finds a Recipe inside @graph', () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":"WebPage"},
      {"@type":["Recipe"],"name":"Pancakes","recipeIngredient":["flour","milk","eggs"]}]}</script>`;
    expect(parseRecipe(html).ingredients).toEqual(['flour', 'milk', 'eggs']);
  });

  it('falls back to the page title', () => {
    expect(parseRecipe('<title> Grandma&#39;s Stew </title>')).toEqual({
      title: "Grandma's Stew",
      ingredients: [],
    });
  });

  it('skips malformed JSON-LD', () => {
    const html = `<script type="application/ld+json">{oops</script><title>Fallback</title>`;
    expect(parseRecipe(html).title).toBe('Fallback');
  });
});

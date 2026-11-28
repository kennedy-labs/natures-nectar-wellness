import type { Product } from "@/features/products/types/product.types";

export type CategoryDeck = {
  id: string;
  name: string;
  slug: string;
  all: Product[];
  stage: Product[];
  rest: Product[];
};

export const STAGE_SIZE = 6;

export function shuffleList<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Deals up to `size` unseen products from `currentRest`, reshuffling remaining
 * items only after the entire category deck has taken a turn on stage.
 */
export function dealStageBatch(
  all: Product[],
  currentRest: Product[],
  size = STAGE_SIZE
): { stage: Product[]; rest: Product[] } {
  if (all.length <= size) {
    return { stage: shuffleList(all), rest: [] };
  }

  if (currentRest.length >= size) {
    return {
      stage: currentRest.slice(0, size),
      rest: currentRest.slice(size),
    };
  }

  const carriedIds = new Set(currentRest.map((product) => product.id));
  const freshDeck = shuffleList(
    all.filter((product) => !carriedIds.has(product.id))
  );
  const needed = size - currentRest.length;

  return {
    stage: [...currentRest, ...freshDeck.slice(0, needed)],
    rest: freshDeck.slice(needed),
  };
}

export function buildCategoryDecks(
  products: Product[],
  randomize = false
): CategoryDeck[] {
  const grouped = new Map<
    string,
    { id: string; name: string; slug: string; all: Product[] }
  >();

  for (const product of products) {
    const id = product.category?.id || product.categoryId || "general";
    const bucket = grouped.get(id) ?? {
      id,
      name: product.category?.name || "Botanicals",
      slug: product.category?.slug || "",
      all: [],
    };
    bucket.all.push(product);
    grouped.set(id, bucket);
  }

  const sorted = Array.from(grouped.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const ordered = randomize ? shuffleList(sorted) : sorted;

  return ordered.map((group) => {
    if (!randomize) {
      return {
        ...group,
        stage: group.all.slice(0, STAGE_SIZE),
        rest: group.all.slice(STAGE_SIZE),
      };
    }

    const { stage, rest } = dealStageBatch(group.all, [], STAGE_SIZE);
    return { ...group, stage, rest };
  });
}

export function shuffleDecksWithoutImmediateRepeat(
  decks: CategoryDeck[],
  lastCategoryId: string
): CategoryDeck[] {
  const next = shuffleList(decks);
  if (next.length > 1 && next[0].id === lastCategoryId) {
    const swapIdx = 1 + Math.floor(Math.random() * (next.length - 1));
    [next[0], next[swapIdx]] = [next[swapIdx], next[0]];
  }
  return next;
}

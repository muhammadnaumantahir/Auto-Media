import { KNOWLEDGE_BASE } from './assistantKnowledge';

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Scores every knowledge-base entry against the query by counting
 * overlapping words between the query and the entry's question +
 * keywords, then returns the best matches. No network call, no LLM -
 * this only ever answers from content that's actually in the app's
 * guides and FAQ list, so it can't invent something wrong.
 */
export function searchAssistant(query, limit = 3) {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return [];

  const scored = KNOWLEDGE_BASE.map((entry) => {
    const haystack = tokenize([entry.question, ...(entry.keywords || [])].join(' '));
    let score = 0;
    haystack.forEach((word) => {
      if (queryTokens.has(word)) score += 1;
      else if ([...queryTokens].some((q) => word.includes(q) || q.includes(word))) score += 0.5;
    });
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}

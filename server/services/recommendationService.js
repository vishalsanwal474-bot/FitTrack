/**
 * Recommendation facade.
 * Current: RuleBasedRecommendationProvider
 * Future: swap/extend with AIRecommendationProvider without changing routes/UI.
 */
import * as ruleBasedProvider from './providers/ruleBasedRecommendationProvider.js';

const PROVIDER = process.env.RECOMMENDATION_PROVIDER || 'rule-based';

export async function getRecommendedExercises(user, bodyPart, options = {}) {
  // Future: if (PROVIDER === 'ai') return aiProvider.getRecommendations(...)
  if (PROVIDER === 'rule-based') {
    return ruleBasedProvider.getRecommendations(user, bodyPart, options);
  }
  return ruleBasedProvider.getRecommendations(user, bodyPart, options);
}

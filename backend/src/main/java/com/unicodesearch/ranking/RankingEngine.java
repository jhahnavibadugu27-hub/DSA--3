package com.unicodesearch.ranking;

import com.unicodesearch.algorithm.KMP;
import com.unicodesearch.model.Document;

import java.util.List;
import java.util.Map;

/**
 * Transparent, explainable relevance scoring (deliberately NOT a
 * black-box ML ranker, so every score can be justified in a viva).
 *
 * score = (keyword frequency weight)
 *       + (title match bonus)
 *       + (exact/full-word match bonus)
 *       + (keyword coverage bonus, for multi-keyword queries)
 *
 * Weights are simple, fixed constants chosen so that:
 *   - raw match frequency matters, but doesn't dominate everything
 *   - a title hit is a strong relevance signal
 *   - matching MORE of the requested keywords (multi-keyword mode)
 *     outranks matching one keyword many times
 * Final score is normalized to a 0-100 scale for display.
 *
 * Ranking happens AFTER filtering: a document that does not contain every
 * query keyword has already been rejected, so it can never outrank (or even
 * appear next to) a valid document.
 */
public class RankingEngine {

    private static final double FREQUENCY_WEIGHT = 4.0;
    private static final double TITLE_MATCH_BONUS = 20.0;
    private static final double EXACT_MATCH_BONUS = 10.0;
    private static final double COVERAGE_WEIGHT = 15.0;

    public static class RankingBreakdown {
        public final double frequencyScore;
        public final double titleMatchBonus;
        public final double exactMatchBonus;
        public final double coverageBonus;
        public final double rawScore;
        public final double finalScore;
        public final int totalFrequency;
        public final boolean titleMatch;
        public final boolean exactMatchFound;
        public final double coverageRatio;

        public RankingBreakdown(double frequencyScore, double titleMatchBonus, double exactMatchBonus,
                                double coverageBonus, double rawScore, double finalScore,
                                int totalFrequency, boolean titleMatch, boolean exactMatchFound,
                                double coverageRatio) {
            this.frequencyScore = frequencyScore;
            this.titleMatchBonus = titleMatchBonus;
            this.exactMatchBonus = exactMatchBonus;
            this.coverageBonus = Math.round(coverageBonus * 100.0) / 100.0;
            this.rawScore = Math.round(rawScore * 100.0) / 100.0;
            this.finalScore = finalScore;
            this.totalFrequency = totalFrequency;
            this.titleMatch = titleMatch;
            this.exactMatchFound = exactMatchFound;
            this.coverageRatio = Math.round(coverageRatio * 1000.0) / 10.0;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("frequencyScore", frequencyScore);
            map.put("titleMatchBonus", titleMatchBonus);
            map.put("exactMatchBonus", exactMatchBonus);
            map.put("coverageBonus", coverageBonus);
            map.put("rawScore", rawScore);
            map.put("finalScore", finalScore);
            map.put("totalFrequency", totalFrequency);
            map.put("titleMatch", titleMatch);
            map.put("exactMatchFound", exactMatchFound);
            map.put("coveragePercent", coverageRatio);
            return map;
        }
    }

    public RankingBreakdown explainScore(Document doc, Map<String, Integer> keywordFrequencies,
                                         List<String> queryKeywords, boolean exactMatchFound) {
        int totalFrequency = keywordFrequencies.values().stream().mapToInt(Integer::intValue).sum();
        double freqScore = Math.min(totalFrequency, 15) * FREQUENCY_WEIGHT; // diminishing-returns cap

        boolean titleMatch = false;
        for (String kw : queryKeywords) {
            // case-folded title vs. case-folded keyword, matched with KMP (no String.contains)
            if (kw != null && !kw.isEmpty() && KMP.search(doc.getSearchableTitle(), kw).getMatchCount() > 0) {
                titleMatch = true;
                break;
            }
        }

        int matchedKeywordCount = (int) keywordFrequencies.values().stream().filter(f -> f > 0).count();
        double coverageRatio = queryKeywords.isEmpty() ? 0 : (double) matchedKeywordCount / queryKeywords.size();

        double titleBonus = titleMatch ? TITLE_MATCH_BONUS : 0.0;
        double exactBonus = exactMatchFound ? EXACT_MATCH_BONUS : 0.0;
        double coverageBonus = coverageRatio * COVERAGE_WEIGHT;

        double raw = freqScore + titleBonus + exactBonus + coverageBonus;

        double maxPossible = (15 * FREQUENCY_WEIGHT) + TITLE_MATCH_BONUS + EXACT_MATCH_BONUS + COVERAGE_WEIGHT;
        double normalized = Math.min(100.0, (raw / maxPossible) * 100.0);
        double finalScore = Math.round(normalized * 100.0) / 100.0;

        return new RankingBreakdown(freqScore, titleBonus, exactBonus, coverageBonus,
                raw, finalScore, totalFrequency, titleMatch, exactMatchFound, coverageRatio);
    }

    public double score(Document doc, Map<String, Integer> keywordFrequencies,
                         List<String> queryKeywords, boolean exactMatchFound) {
        return explainScore(doc, keywordFrequencies, queryKeywords, exactMatchFound).finalScore;
    }
}

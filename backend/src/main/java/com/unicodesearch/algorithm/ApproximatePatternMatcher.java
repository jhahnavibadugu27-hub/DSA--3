package com.unicodesearch.algorithm;

import com.unicodesearch.model.MatchResult;

import java.util.ArrayList;
import java.util.List;

/**
 * Searches a document text for pattern occurrences using Dynamic Programming
 * algorithms: Wagner-Fischer, Damerau-Levenshtein, Weighted Edit Distance,
 * and Needleman-Wunsch Global Sequence Alignment.
 */
public final class ApproximatePatternMatcher {

    public enum Algorithm {
        WAGNER_FISCHER,
        DAMERAU_LEVENSHTEIN,
        WEIGHTED_EDIT_DISTANCE,
        NEEDLEMAN_WUNSCH
    }

    private ApproximatePatternMatcher() {}

    public static MatchResult search(String text, String pattern, Algorithm algorithm) {
        long start = System.nanoTime();
        List<Integer> positions = new ArrayList<>();
        if (text == null || pattern == null || pattern.isEmpty() || text.length() < pattern.length() && !isFuzzyEligible(text, pattern)) {
            return new MatchResult(pattern, positions, elapsedMs(start));
        }

        int maxThreshold = Math.max(1, pattern.length() / 4);

        // Fast scan through tokens in text tracking character offsets
        int n = text.length();
        int tokenStart = -1;

        for (int i = 0; i <= n; i++) {
            boolean isEnd = (i == n) || Character.isWhitespace(text.charAt(i))
                    || "!?,.:;\"'()[]{}<>-/\\".indexOf(text.charAt(i)) >= 0;

            if (!isEnd) {
                if (tokenStart < 0) tokenStart = i;
            } else {
                if (tokenStart >= 0) {
                    String token = text.substring(tokenStart, i);
                    if (token.equalsIgnoreCase(pattern)) {
                        positions.add(tokenStart);
                    } else if (Math.abs(token.length() - pattern.length()) <= maxThreshold + 1) {
                        boolean match = switch (algorithm) {
                            case DAMERAU_LEVENSHTEIN ->
                                DamerauLevenshtein.distance(token, pattern) <= maxThreshold;
                            case WEIGHTED_EDIT_DISTANCE ->
                                WeightedEditDistance.compute(token, pattern, 1.0, 1.0, 1.0, 1.0).distance <= (double) maxThreshold;
                            case NEEDLEMAN_WUNSCH ->
                                NeedlemanWunsch.align(token, pattern, 2, -1, -1).identityPercent >= 70.0;
                            case WAGNER_FISCHER ->
                                WagnerFischer.compute(token, pattern).distance <= maxThreshold;
                        };
                        if (match) {
                            positions.add(tokenStart);
                        }
                    }
                    tokenStart = -1;
                }
            }
        }

        return new MatchResult(pattern, positions, elapsedMs(start));
    }

    private static boolean isFuzzyEligible(String text, String pattern) {
        return Math.abs(text.length() - pattern.length()) <= 2;
    }

    private static double elapsedMs(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000.0;
    }
}

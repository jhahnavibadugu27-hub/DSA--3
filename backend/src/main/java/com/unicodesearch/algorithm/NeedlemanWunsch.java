package com.unicodesearch.algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Needleman-Wunsch Global Sequence Alignment Algorithm.
 * Standard Dynamic Programming algorithm used for biological genome sequence alignment
 * and global string comparison.
 */
public final class NeedlemanWunsch {

    public static class AlignmentResult {
        public final int score;
        public final int[][] matrix;
        public final List<int[]> path;
        public final String alignedSeq1;
        public final String alignedSeq2;
        public final String alignmentMarkup;
        public final int matchCount;
        public final int mismatchCount;
        public final int gapCount;
        public final double identityPercent;
        public final String[] seq1Chars;
        public final String[] seq2Chars;

        public AlignmentResult(int score, int[][] matrix, List<int[]> path,
                               String alignedSeq1, String alignedSeq2, String alignmentMarkup,
                               int matchCount, int mismatchCount, int gapCount, double identityPercent,
                               String[] seq1Chars, String[] seq2Chars) {
            this.score = score;
            this.matrix = matrix;
            this.path = path;
            this.alignedSeq1 = alignedSeq1;
            this.alignedSeq2 = alignedSeq2;
            this.alignmentMarkup = alignmentMarkup;
            this.matchCount = matchCount;
            this.mismatchCount = mismatchCount;
            this.gapCount = gapCount;
            this.identityPercent = identityPercent;
            this.seq1Chars = seq1Chars;
            this.seq2Chars = seq2Chars;
        }
    }

    private NeedlemanWunsch() {}

    public static AlignmentResult align(String seq1, String seq2, int matchReward, int mismatchPenalty, int gapPenalty) {
        int[] x = seq1.codePoints().toArray();
        int[] y = seq2.codePoints().toArray();
        int m = x.length;
        int n = y.length;

        int[][] score = new int[m + 1][n + 1];

        // Base cases
        score[0][0] = 0;
        for (int i = 1; i <= m; i++) score[i][0] = i * gapPenalty;
        for (int j = 1; j <= n; j++) score[0][j] = j * gapPenalty;

        // DP recurrence
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                int diag = score[i - 1][j - 1] + (x[i - 1] == y[j - 1] ? matchReward : mismatchPenalty);
                int up = score[i - 1][j] + gapPenalty;
                int left = score[i][j - 1] + gapPenalty;
                score[i][j] = Math.max(Math.max(diag, up), left);
            }
        }

        // Traceback from (m, n) to (0, 0)
        StringBuilder al1 = new StringBuilder();
        StringBuilder al2 = new StringBuilder();
        StringBuilder markup = new StringBuilder();
        List<int[]> path = new ArrayList<>();

        int i = m, j = n;
        path.add(new int[]{i, j});

        int matches = 0;
        int mismatches = 0;
        int gaps = 0;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && score[i][j] == score[i - 1][j - 1] + (x[i - 1] == y[j - 1] ? matchReward : mismatchPenalty)) {
                String c1 = new String(Character.toChars(x[i - 1]));
                String c2 = new String(Character.toChars(y[j - 1]));
                al1.append(c1);
                al2.append(c2);
                if (x[i - 1] == y[j - 1]) {
                    markup.append("|");
                    matches++;
                } else {
                    markup.append("*");
                    mismatches++;
                }
                i--; j--;
            } else if (i > 0 && score[i][j] == score[i - 1][j] + gapPenalty) {
                al1.append(new String(Character.toChars(x[i - 1])));
                al2.append("-");
                markup.append(" ");
                gaps++;
                i--;
            } else {
                al1.append("-");
                al2.append(new String(Character.toChars(y[j - 1])));
                markup.append(" ");
                gaps++;
                j--;
            }
            path.add(new int[]{i, j});
        }

        Collections.reverse(path);
        al1.reverse();
        al2.reverse();
        markup.reverse();

        int totalLen = al1.length();
        double identity = totalLen > 0 ? (matches * 100.0 / totalLen) : 100.0;

        String[] src = new String[m];
        for (int k = 0; k < m; k++) src[k] = new String(Character.toChars(x[k]));
        String[] tgt = new String[n];
        for (int k = 0; k < n; k++) tgt[k] = new String(Character.toChars(y[k]));

        return new AlignmentResult(score[m][n], score, path, al1.toString(), al2.toString(), markup.toString(),
                matches, mismatches, gaps, Math.round(identity * 100.0) / 100.0, src, tgt);
    }
}

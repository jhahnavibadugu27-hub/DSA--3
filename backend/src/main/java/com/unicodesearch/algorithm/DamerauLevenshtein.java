package com.unicodesearch.algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Damerau-Levenshtein distance algorithm (Optimal String Alignment).
 * Extends Wagner-Fischer by supporting transposition of two adjacent characters.
 * Useful for typo handling (e.g. "teh" -> "the").
 */
public final class DamerauLevenshtein {

    public static class Result {
        public final int distance;
        public final int[][] matrix;
        public final List<String> operations;
        public final List<int[]> path;
        public final String[] sourceChars;
        public final String[] targetChars;

        public Result(int distance, int[][] matrix, List<String> operations, List<int[]> path, String[] sourceChars, String[] targetChars) {
            this.distance = distance;
            this.matrix = matrix;
            this.operations = operations;
            this.path = path;
            this.sourceChars = sourceChars;
            this.targetChars = targetChars;
        }
    }

    private DamerauLevenshtein() {}

    public static int distance(String a, String b) {
        return compute(a, b).distance;
    }

    public static Result compute(String a, String b) {
        int[] x = a.codePoints().toArray();
        int[] y = b.codePoints().toArray();
        int m = x.length;
        int n = y.length;

        int[][] d = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) d[i][0] = i;
        for (int j = 0; j <= n; j++) d[0][j] = j;

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                int cost = (x[i - 1] == y[j - 1]) ? 0 : 1;
                int del = d[i - 1][j] + 1;
                int ins = d[i][j - 1] + 1;
                int sub = d[i - 1][j - 1] + cost;

                int min = Math.min(Math.min(del, ins), sub);

                // Adjacent transposition
                if (i > 1 && j > 1 && x[i - 1] == y[j - 2] && x[i - 2] == y[j - 1]) {
                    min = Math.min(min, d[i - 2][j - 2] + 1);
                }

                d[i][j] = min;
            }
        }

        // Backtrack
        List<String> ops = new ArrayList<>();
        List<int[]> path = new ArrayList<>();
        int i = m, j = n;
        path.add(new int[]{i, j});

        while (i > 0 || j > 0) {
            // Check transposition first
            if (i > 1 && j > 1 && x[i - 1] == y[j - 2] && x[i - 2] == y[j - 1] && d[i][j] == d[i - 2][j - 2] + 1) {
                ops.add("TRANSPOSE " + new String(Character.toChars(x[i - 2])) + new String(Character.toChars(x[i - 1]))
                        + " -> " + new String(Character.toChars(y[j - 2])) + new String(Character.toChars(y[j - 1])));
                i -= 2;
                j -= 2;
                path.add(new int[]{i, j});
                continue;
            }

            if (i > 0 && j > 0 && x[i - 1] == y[j - 1] && d[i][j] == d[i - 1][j - 1]) {
                ops.add("MATCH " + new String(Character.toChars(x[i - 1])));
                i--; j--;
            } else if (i > 0 && j > 0 && d[i][j] == d[i - 1][j - 1] + 1) {
                ops.add("SUBSTITUTE " + new String(Character.toChars(x[i - 1])) + " -> " + new String(Character.toChars(y[j - 1])));
                i--; j--;
            } else if (i > 0 && d[i][j] == d[i - 1][j] + 1) {
                ops.add("DELETE " + new String(Character.toChars(x[i - 1])));
                i--;
            } else {
                ops.add("INSERT " + new String(Character.toChars(y[j - 1])));
                j--;
            }
            path.add(new int[]{i, j});
        }

        Collections.reverse(ops);
        Collections.reverse(path);

        String[] src = new String[m];
        for (int k = 0; k < m; k++) src[k] = new String(Character.toChars(x[k]));
        String[] tgt = new String[n];
        for (int k = 0; k < n; k++) tgt[k] = new String(Character.toChars(y[k]));

        return new Result(d[m][n], d, ops, path, src, tgt);
    }
}

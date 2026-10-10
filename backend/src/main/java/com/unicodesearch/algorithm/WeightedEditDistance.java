package com.unicodesearch.algorithm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Weighted Edit Distance algorithm.
 * Allows custom costs for insertion, deletion, substitution, and transposition.
 */
public final class WeightedEditDistance {

    public static class Result {
        public final double distance;
        public final double[][] matrix;
        public final List<String> operations;
        public final List<int[]> path;
        public final String[] sourceChars;
        public final String[] targetChars;

        public Result(double distance, double[][] matrix, List<String> operations, List<int[]> path, String[] sourceChars, String[] targetChars) {
            this.distance = distance;
            this.matrix = matrix;
            this.operations = operations;
            this.path = path;
            this.sourceChars = sourceChars;
            this.targetChars = targetChars;
        }
    }

    private WeightedEditDistance() {}

    public static Result compute(String a, String b, double insertCost, double deleteCost, double substituteCost, double transposeCost) {
        int[] x = a.codePoints().toArray();
        int[] y = b.codePoints().toArray();
        int m = x.length;
        int n = y.length;

        double[][] d = new double[m + 1][n + 1];
        for (int i = 0; i <= m; i++) d[i][0] = i * deleteCost;
        for (int j = 0; j <= n; j++) d[0][j] = j * insertCost;

        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                double subCost = (x[i - 1] == y[j - 1]) ? 0.0 : substituteCost;
                double del = d[i - 1][j] + deleteCost;
                double ins = d[i][j - 1] + insertCost;
                double sub = d[i - 1][j - 1] + subCost;

                double min = Math.min(Math.min(del, ins), sub);

                if (i > 1 && j > 1 && x[i - 1] == y[j - 2] && x[i - 2] == y[j - 1]) {
                    min = Math.min(min, d[i - 2][j - 2] + transposeCost);
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
            if (i > 1 && j > 1 && x[i - 1] == y[j - 2] && x[i - 2] == y[j - 1]
                    && Math.abs(d[i][j] - (d[i - 2][j - 2] + transposeCost)) < 1e-6) {
                ops.add("TRANSPOSE (cost " + transposeCost + ") " + new String(Character.toChars(x[i - 2])) + new String(Character.toChars(x[i - 1])));
                i -= 2;
                j -= 2;
                path.add(new int[]{i, j});
                continue;
            }

            if (i > 0 && j > 0 && x[i - 1] == y[j - 1] && Math.abs(d[i][j] - d[i - 1][j - 1]) < 1e-6) {
                ops.add("MATCH (cost 0) " + new String(Character.toChars(x[i - 1])));
                i--; j--;
            } else if (i > 0 && j > 0 && Math.abs(d[i][j] - (d[i - 1][j - 1] + substituteCost)) < 1e-6) {
                ops.add("SUBSTITUTE (cost " + substituteCost + ") " + new String(Character.toChars(x[i - 1])) + " -> " + new String(Character.toChars(y[j - 1])));
                i--; j--;
            } else if (i > 0 && Math.abs(d[i][j] - (d[i - 1][j] + deleteCost)) < 1e-6) {
                ops.add("DELETE (cost " + deleteCost + ") " + new String(Character.toChars(x[i - 1])));
                i--;
            } else {
                ops.add("INSERT (cost " + insertCost + ") " + new String(Character.toChars(y[j - 1])));
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

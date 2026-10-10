package com.unicodesearch.algorithm;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Optimal Binary Search Tree (OBST) Dynamic Programming Algorithm.
 * Implements the CLRS Chapter 15.5 formulation to minimize expected search cost
 * given known access frequencies/probabilities for search terms.
 */
public final class OptimalBST {

    public static class OBSTResult {
        public final double expectedCost;
        public final double[][] costMatrix;
        public final double[][] weightMatrix;
        public final int[][] rootMatrix;
        public final String[] keys;
        public final double[] frequencies;
        public final Map<String, Object> rootNode;
        public final List<String> inOrderTraversal;

        public OBSTResult(double expectedCost, double[][] costMatrix, double[][] weightMatrix, int[][] rootMatrix,
                          String[] keys, double[] frequencies, Map<String, Object> rootNode, List<String> inOrderTraversal) {
            this.expectedCost = expectedCost;
            this.costMatrix = costMatrix;
            this.weightMatrix = weightMatrix;
            this.rootMatrix = rootMatrix;
            this.keys = keys;
            this.frequencies = frequencies;
            this.rootNode = rootNode;
            this.inOrderTraversal = inOrderTraversal;
        }
    }

    private OptimalBST() {}

    public static OBSTResult compute(List<String> rawKeys, List<Double> rawFreqs) {
        if (rawKeys == null || rawKeys.isEmpty()) {
            return new OBSTResult(0, new double[0][0], new double[0][0], new int[0][0],
                    new String[0], new double[0], Map.of(), List.of());
        }

        // Pair and sort by key
        int n = rawKeys.size();
        class KeyPair {
            final String key;
            final double freq;
            KeyPair(String k, double f) { this.key = k; this.freq = f; }
        }
        List<KeyPair> pairs = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            pairs.add(new KeyPair(rawKeys.get(i), (i < rawFreqs.size() && rawFreqs.get(i) != null) ? Math.max(0.01, rawFreqs.get(i)) : 1.0));
        }
        pairs.sort(Comparator.comparing(p -> p.key));

        String[] keys = new String[n];
        double[] p = new double[n + 1]; // 1-indexed probabilities
        double sum = 0;
        for (int i = 0; i < n; i++) {
            keys[i] = pairs.get(i).key;
            p[i + 1] = pairs.get(i).freq;
            sum += p[i + 1];
        }

        // Normalize probabilities so sum = 1.0 (if sum > 0)
        double[] normP = new double[n + 1];
        for (int i = 1; i <= n; i++) {
            normP[i] = sum > 0 ? (p[i] / sum) : (1.0 / n);
        }

        // e[1..n+1][0..n], w[1..n+1][0..n], root[1..n][1..n]
        double[][] e = new double[n + 2][n + 1];
        double[][] w = new double[n + 2][n + 1];
        int[][] root = new int[n + 1][n + 1];

        for (int i = 1; i <= n + 1; i++) {
            e[i][i - 1] = 0.0;
            w[i][i - 1] = 0.0;
        }

        for (int l = 1; l <= n; l++) { // length of sequence
            for (int i = 1; i <= n - l + 1; i++) {
                int j = i + l - 1;
                e[i][j] = Double.MAX_VALUE;
                w[i][j] = w[i][j - 1] + normP[j];

                for (int r = i; r <= j; r++) {
                    double t = e[i][r - 1] + e[r + 1][j] + w[i][j];
                    if (t < e[i][j]) {
                        e[i][j] = t;
                        root[i][j] = r;
                    }
                }
            }
        }

        // Build tree JSON hierarchy
        Map<String, Object> tree = buildTree(root, keys, normP, 1, n, 0);

        List<String> inOrder = new ArrayList<>();
        collectInOrder(tree, inOrder);

        // Convert matrices to 0-indexed for convenient JSON serialization
        double[][] cleanCost = new double[n + 1][n + 1];
        double[][] cleanWeight = new double[n + 1][n + 1];
        int[][] cleanRoot = new int[n][n];

        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                cleanCost[i - 1][j - 1] = Math.round(e[i][j] * 1000.0) / 1000.0;
                cleanWeight[i - 1][j - 1] = Math.round(w[i][j] * 1000.0) / 1000.0;
                cleanRoot[i - 1][j - 1] = root[i][j] - 1; // 0-indexed
            }
        }

        double[] outFreqs = new double[n];
        for (int i = 0; i < n; i++) outFreqs[i] = Math.round(normP[i + 1] * 10000.0) / 100.0; // as percent

        return new OBSTResult(Math.round(e[1][n] * 1000.0) / 1000.0, cleanCost, cleanWeight, cleanRoot,
                keys, outFreqs, tree, inOrder);
    }

    private static Map<String, Object> buildTree(int[][] root, String[] keys, double[] p, int i, int j, int depth) {
        if (i > j) return null;
        int r = root[i][j];
        if (r < i || r > j) return null;

        Map<String, Object> node = new LinkedHashMap<>();
        node.put("key", keys[r - 1]);
        node.put("index", r - 1);
        node.put("probability", Math.round(p[r] * 10000.0) / 100.0);
        node.put("depth", depth);

        Map<String, Object> left = buildTree(root, keys, p, i, r - 1, depth + 1);
        Map<String, Object> right = buildTree(root, keys, p, r + 1, j, depth + 1);

        node.put("left", left);
        node.put("right", right);

        return node;
    }

    private static void collectInOrder(Map<String, Object> node, List<String> list) {
        if (node == null) return;
        @SuppressWarnings("unchecked")
        Map<String, Object> left = (Map<String, Object>) node.get("left");
        @SuppressWarnings("unchecked")
        Map<String, Object> right = (Map<String, Object>) node.get("right");

        collectInOrder(left, list);
        list.add((String) node.get("key"));
        collectInOrder(right, list);
    }
}

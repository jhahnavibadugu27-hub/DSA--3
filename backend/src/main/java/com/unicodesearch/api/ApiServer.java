package com.unicodesearch.api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.unicodesearch.index.CorpusLoader;
import com.unicodesearch.index.InvertedIndex;
import com.unicodesearch.json.JsonWriter;
import com.unicodesearch.model.Document;
import com.unicodesearch.model.SearchResultItem;
import com.unicodesearch.service.FuzzySearch;
import com.unicodesearch.service.KeywordDocumentFlowAnalyzer;
import com.unicodesearch.service.PerformanceComparator;
import com.unicodesearch.service.SearchEngine;

import com.unicodesearch.algorithm.WagnerFischer;
import com.unicodesearch.algorithm.DamerauLevenshtein;
import com.unicodesearch.algorithm.WeightedEditDistance;
import com.unicodesearch.algorithm.NeedlemanWunsch;
import com.unicodesearch.algorithm.OptimalBST;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.*;

/**
 * Lightweight Java REST backend built entirely on the JDK's built-in
 * com.sun.net.httpserver.HttpServer -- no Spring Boot / Maven / internet
 * access required to build or run. This keeps the whole backend
 * compileable with just `javac` in any standard student environment.
 *
 * Endpoints:
 *   GET /api/search?query=..&language=..&algorithm=..&mode=..&searchMode=exact|fuzzy
 *   GET /api/suggest?term=..&limit=..            (Levenshtein "did you mean")
 *   GET /api/flow?query=..&language=..&algorithm=dinic|edmondskarp|fordfulkerson&demand=1
 *   GET /api/statistics
 *   GET /api/languages
 *   GET /api/documents/{id}
 *   GET /api/performance?query=..&language=..
 *   POST /api/index/rebuild
 */
public class ApiServer {

    private static volatile InvertedIndex invertedIndex;
    private static volatile SearchEngine searchEngine;
    private static volatile PerformanceComparator performanceComparator;
    private static volatile KeywordDocumentFlowAnalyzer flowAnalyzer;
    private static Path corpusRoot;

    // Simple live counters for the statistics dashboard. Both are only ever
    // set from real events (an actual /api/search call, an actual index
    // rebuild) -- never hardcoded or simulated.
    private static final java.util.concurrent.atomic.AtomicLong totalSearches =
            new java.util.concurrent.atomic.AtomicLong(0);
    private static volatile String lastIndexBuild = null;

    public static void main(String[] args) throws IOException {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        corpusRoot = Path.of(args.length > 1 ? args[1] : "../corpus");

        rebuildIndex();

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/search", ApiServer::handleSearch);
        server.createContext("/api/suggest", ApiServer::handleSuggest);
        server.createContext("/api/flow", ApiServer::handleFlow);
        server.createContext("/api/statistics", ApiServer::handleStatistics);
        server.createContext("/api/languages", ApiServer::handleLanguages);
        server.createContext("/api/documents/", ApiServer::handleDocumentById);
        server.createContext("/api/performance", ApiServer::handlePerformance);
        server.createContext("/api/index/rebuild", ApiServer::handleRebuild);
        server.createContext("/api/algorithms/edit-distance", ApiServer::handleEditDistance);
        server.createContext("/api/algorithms/alignment", ApiServer::handleAlignment);
        server.createContext("/api/algorithms/obst", ApiServer::handleObst);
        // Thread pool: requests are handled concurrently instead of one at a time.
        server.setExecutor(java.util.concurrent.Executors.newFixedThreadPool(
                Math.max(4, Runtime.getRuntime().availableProcessors())));
        server.start();

        System.out.println("Unicode Search Engine backend running on http://localhost:" + port);
        System.out.println("Corpus loaded from: " + corpusRoot.toAbsolutePath());
        System.out.println("Documents indexed: " + invertedIndex.getDocumentCount());
    }

    private static void rebuildIndex() throws IOException {
        CorpusLoader loader = new CorpusLoader();
        List<Document> docs = loader.loadCorpus(corpusRoot);
        // Build fully on a local index, then publish: requests never see a half-built index.
        InvertedIndex fresh = new InvertedIndex();
        fresh.build(docs);
        searchEngine = new SearchEngine(fresh);
        performanceComparator = new PerformanceComparator(fresh);
        flowAnalyzer = new KeywordDocumentFlowAnalyzer(fresh);
        invertedIndex = fresh;
        lastIndexBuild = java.time.Instant.now().toString();
    }

    // ---------- Handlers ----------

    private static void handleSearch(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        Map<String, String> params = parseQuery(exchange.getRequestURI().getRawQuery());
        String query = params.getOrDefault("query", "");
        String language = params.getOrDefault("language", "all");
        String algorithm = params.getOrDefault("algorithm", "auto");
        String mode = params.getOrDefault("mode", "");
        String searchMode = params.getOrDefault("searchMode", "exact");

        totalSearches.incrementAndGet();
        SearchEngine.SearchResponse resp = searchEngine.search(query, language, algorithm, mode, searchMode);

        if (resp.error != null) {
            sendJson(exchange, 400, Map.of("error", resp.error));
            return;
        }

        Map<String, Object> json = new LinkedHashMap<>();
        json.put("query", resp.query);
        json.put("language", resp.language);
        json.put("algorithm", resp.algorithm);
        json.put("requestedAlgorithm", resp.requestedAlgorithm);
        json.put("algorithmNote", resp.algorithmNote);
        json.put("mode", resp.mode);
        json.put("searchMode", resp.searchMode);
        json.put("executionTimeMs", round(resp.executionTimeMs));
        json.put("documentsScanned", resp.documentsScanned);
        json.put("candidateDocuments", resp.candidateDocuments);
        json.put("totalDocuments", resp.totalDocuments);
        json.put("indexReductionPercent", resp.indexReductionPercent);
        json.put("normalizedQuery", resp.normalizedQuery);
        json.put("totalResults", resp.totalResults);
        json.put("keywordCount", resp.keywordCount);
        json.put("keywords", resp.keywords);
        json.put("keywordDocumentCounts", resp.keywordDocumentCounts);
        json.put("corrections", resp.corrections);
        json.put("suggestions", resp.suggestions);
        json.put("message", resp.message);

        List<Object> resultsJson = new ArrayList<>();
        for (SearchResultItem item : resp.results) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("documentId", item.getDocumentId());
            r.put("title", item.getTitle());
            r.put("language", item.getLanguage());
            r.put("matchCount", item.getMatchCount());
            r.put("score", item.getScore());
            r.put("snippet", item.getSnippet());
            r.put("matchedKeywords", item.getMatchedKeywords());
            r.put("keywordFrequencies", item.getKeywordFrequencies());
            r.put("matchPositions", item.getMatchPositions());
            r.put("rankingExplanation", item.getRankingExplanation());
            resultsJson.add(r);
        }
        json.put("results", resultsJson);

        sendJson(exchange, 200, json);
    }

    /** Levenshtein-based dictionary suggestions for a single term. */
    private static void handleSuggest(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        Map<String, String> params = parseQuery(exchange.getRequestURI().getRawQuery());
        List<String> tokens = com.unicodesearch.util.UnicodeUtil.tokenize(params.getOrDefault("term", ""));
        if (tokens.isEmpty()) {
            sendJson(exchange, 400, Map.of("error", "term parameter is required"));
            return;
        }
        int limit = 5;
        try { limit = Math.max(1, Math.min(20, Integer.parseInt(params.getOrDefault("limit", "5")))); }
        catch (NumberFormatException ignored) { }
        String term = tokens.get(0);
        List<Object> list = new ArrayList<>();
        for (FuzzySearch.Suggestion sg : searchEngine.getFuzzySearch().suggest(term, limit)) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("term", sg.term());
            m.put("distance", sg.distance());
            m.put("documentFrequency", sg.documentFrequency());
            list.add(m);
        }
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("term", term);
        json.put("existsInDictionary", invertedIndex.dictionaryContains(term));
        json.put("maxDistance", FuzzySearch.maxDistanceFor(term));
        json.put("suggestions", list);
        sendJson(exchange, 200, json);
    }

    /** CO4: keyword-document bipartite network-flow analysis (separate from normal search). */
    private static void handleFlow(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        Map<String, String> params = parseQuery(exchange.getRequestURI().getRawQuery());
        String query = params.getOrDefault("query", "");
        String language = params.getOrDefault("language", "all");
        String algorithm = params.getOrDefault("algorithm", "dinic");
        int demand = 1;
        try { demand = Integer.parseInt(params.getOrDefault("demand", "1")); }
        catch (NumberFormatException ignored) { }

        Map<String, Object> result = flowAnalyzer.analyze(query, language, algorithm, demand);
        if (result.containsKey("error")) {
            sendJson(exchange, 400, Map.of("error", result.get("error")));
            return;
        }
        sendJson(exchange, 200, result);
    }

    private static void handleStatistics(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        Map<String, Object> json = new LinkedHashMap<>();
        Set<String> languages = new TreeSet<>();
        Map<String, Integer> perLanguageCount = new TreeMap<>();
        for (Document d : invertedIndex.getAllDocuments()) {
            languages.add(d.getLanguage());
            perLanguageCount.merge(d.getLanguage(), 1, Integer::sum);
        }

        json.put("languages", new ArrayList<>(languages));
        json.put("languageCount", languages.size());
        json.put("documentsByLanguage", perLanguageCount);
        json.put("documentCount", invertedIndex.getDocumentCount());
        json.put("indexedTerms", invertedIndex.getVocabularySize());
        json.put("totalPostings", invertedIndex.getTotalPostings());
        json.put("totalCharacters", invertedIndex.getTotalCharacters());
        json.put("indexStatus", "Ready");
        json.put("totalSearches", totalSearches.get());
        json.put("lastIndexBuild", lastIndexBuild);
        json.put("maxKeywordsPerQuery", SearchEngine.MAX_KEYWORDS);
        json.put("algorithms", List.of("Naive", "KMP", "Rabin-Karp", "Z-Algorithm", "Aho-Corasick", "Trie",
                "Levenshtein (DP)", "Ford-Fulkerson", "Edmonds-Karp", "Dinic", "Min-Cut"));
        sendJson(exchange, 200, json);
    }

    private static void handleLanguages(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        Set<String> languages = new TreeSet<>();
        for (Document d : invertedIndex.getAllDocuments()) languages.add(d.getLanguage());
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("languages", new ArrayList<>(languages));
        sendJson(exchange, 200, json);
    }

    private static void handleDocumentById(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        String path = exchange.getRequestURI().getPath();
        String id = path.substring(path.lastIndexOf('/') + 1);
        Document doc = invertedIndex.getDocument(id);
        if (doc == null) {
            sendJson(exchange, 404, Map.of("error", "Document not found: " + id));
            return;
        }
        Map<String, String> params = parseQuery(exchange.getRequestURI().getRawQuery());
        String query = params.getOrDefault("query", "").trim();

        Map<String, Object> json = new LinkedHashMap<>();
        json.put("id", doc.getId());
        json.put("title", doc.getTitle());
        json.put("language", doc.getLanguage());
        json.put("content", doc.getRawContent());
        json.put("normalizedContent", doc.getNormalizedContent());

        if (!query.isEmpty()) {
            List<String> tokens = com.unicodesearch.util.UnicodeUtil.tokenize(query);
            Map<String, List<Integer>> positions = new LinkedHashMap<>();
            int totalMatches = 0;
            if (tokens.size() >= 2) {
                com.unicodesearch.algorithm.AhoCorasick ac = new com.unicodesearch.algorithm.AhoCorasick(tokens);
                Map<String, List<Integer>> found = ac.searchAll(doc.getSearchableContent());
                for (String t : tokens) {
                    List<Integer> p = found.getOrDefault(t, Collections.emptyList());
                    positions.put(t, p);
                    totalMatches += p.size();
                }
            } else if (!tokens.isEmpty()) {
                String kw = tokens.get(0);
                com.unicodesearch.model.MatchResult mr = com.unicodesearch.algorithm.KMP.search(doc.getSearchableContent(), kw);
                positions.put(kw, mr.getPositions());
                totalMatches = mr.getMatchCount();
            }
            json.put("query", query);
            json.put("keywords", tokens);
            json.put("totalMatches", totalMatches);
            json.put("matchPositions", positions);
        }

        sendJson(exchange, 200, json);
    }

    private static void handlePerformance(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        Map<String, String> params = parseQuery(exchange.getRequestURI().getRawQuery());
        String query = params.getOrDefault("query", "");
        String language = params.getOrDefault("language", "all");

        if (query.isBlank()) {
            sendJson(exchange, 400, Map.of("error", "query parameter is required"));
            return;
        }

        List<Map<String, Object>> comparison = performanceComparator.compare(query, language);
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("query", query);
        json.put("language", language);
        json.put("comparison", comparison);
        sendJson(exchange, 200, json);
    }

    private static void handleRebuild(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        try {
            rebuildIndex();
            sendJson(exchange, 200, Map.of("status", "rebuilt", "documentCount", invertedIndex.getDocumentCount()));
        } catch (IOException e) {
            sendJson(exchange, 500, Map.of("error", e.getMessage()));
        }
    }

    private static void handleEditDistance(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        Map<String, String> params = parseQuery(exchange.getRequestURI().getRawQuery());
        String s1 = params.getOrDefault("s1", "kitten");
        String s2 = params.getOrDefault("s2", "sitting");
        String type = params.getOrDefault("type", "wagner-fischer").toLowerCase();

        Map<String, Object> json = new LinkedHashMap<>();
        json.put("s1", s1);
        json.put("s2", s2);
        json.put("type", type);

        if ("damerau".equals(type) || "damerau-levenshtein".equals(type)) {
            DamerauLevenshtein.Result r = DamerauLevenshtein.compute(s1, s2);
            json.put("distance", r.distance);
            json.put("matrix", r.matrix);
            json.put("operations", r.operations);
            json.put("path", r.path);
            json.put("sourceChars", r.sourceChars);
            json.put("targetChars", r.targetChars);
            json.put("algorithmName", "Damerau-Levenshtein (Adjacent Transposition)");
        } else if ("weighted".equals(type)) {
            double ins = parseDouble(params.get("ins"), 1.0);
            double del = parseDouble(params.get("del"), 1.0);
            double sub = parseDouble(params.get("sub"), 1.0);
            double trans = parseDouble(params.get("trans"), 1.0);
            WeightedEditDistance.Result r = WeightedEditDistance.compute(s1, s2, ins, del, sub, trans);
            json.put("distance", round(r.distance));
            json.put("matrix", r.matrix);
            json.put("operations", r.operations);
            json.put("path", r.path);
            json.put("sourceChars", r.sourceChars);
            json.put("targetChars", r.targetChars);
            json.put("costs", Map.of("insert", ins, "delete", del, "substitute", sub, "transpose", trans));
            json.put("algorithmName", "Weighted Edit Distance");
        } else {
            WagnerFischer.Result r = WagnerFischer.compute(s1, s2);
            json.put("distance", r.distance);
            json.put("matrix", r.matrix);
            json.put("operations", r.operations);
            json.put("path", r.path);
            json.put("sourceChars", r.sourceChars);
            json.put("targetChars", r.targetChars);
            json.put("algorithmName", "Wagner-Fischer (Levenshtein DP Table)");
        }

        sendJson(exchange, 200, json);
    }

    private static void handleAlignment(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        Map<String, String> params = parseQuery(exchange.getRequestURI().getRawQuery());
        String seq1 = params.getOrDefault("seq1", "GCATGCG");
        String seq2 = params.getOrDefault("seq2", "GATTACA");
        int match = parseInt(params.get("match"), 2);
        int mismatch = parseInt(params.get("mismatch"), -1);
        int gap = parseInt(params.get("gap"), -1);

        NeedlemanWunsch.AlignmentResult r = NeedlemanWunsch.align(seq1, seq2, match, mismatch, gap);
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("algorithm", "Needleman-Wunsch Global Sequence Alignment");
        json.put("seq1", seq1);
        json.put("seq2", seq2);
        json.put("parameters", Map.of("matchReward", match, "mismatchPenalty", mismatch, "gapPenalty", gap));
        json.put("score", r.score);
        json.put("alignedSeq1", r.alignedSeq1);
        json.put("alignedSeq2", r.alignedSeq2);
        json.put("alignmentMarkup", r.alignmentMarkup);
        json.put("matchCount", r.matchCount);
        json.put("mismatchCount", r.mismatchCount);
        json.put("gapCount", r.gapCount);
        json.put("identityPercent", r.identityPercent);
        json.put("matrix", r.matrix);
        json.put("path", r.path);
        json.put("seq1Chars", r.seq1Chars);
        json.put("seq2Chars", r.seq2Chars);

        sendJson(exchange, 200, json);
    }

    private static void handleObst(HttpExchange exchange) throws IOException {
        if (!allowCors(exchange)) return;
        Map<String, String> params = parseQuery(exchange.getRequestURI().getRawQuery());

        List<String> keys = new ArrayList<>();
        List<Double> freqs = new ArrayList<>();

        if (params.containsKey("keys") && !params.get("keys").isBlank()) {
            for (String k : params.get("keys").split(",")) {
                String clean = k.trim();
                if (!clean.isEmpty()) keys.add(clean);
            }
            if (params.containsKey("freqs")) {
                for (String f : params.get("freqs").split(",")) {
                    try { freqs.add(Double.parseDouble(f.trim())); } catch (Exception ignored) { freqs.add(1.0); }
                }
            }
        } else {
            // Default: pick top popular search keywords from inverted index
            List<String> defaults = List.of("computer", "data", "engineering", "india", "network", "research", "science", "technology");
            for (String term : defaults) {
                keys.add(term);
                int df = invertedIndex != null ? invertedIndex.getDocumentFrequency(term) : 1;
                freqs.add((double) Math.max(1, df));
            }
        }

        OptimalBST.OBSTResult r = OptimalBST.compute(keys, freqs);
        Map<String, Object> json = new LinkedHashMap<>();
        json.put("algorithm", "Optimal Binary Search Tree (DP)");
        json.put("keys", r.keys);
        json.put("frequencies", r.frequencies);
        json.put("expectedCost", r.expectedCost);
        json.put("costMatrix", r.costMatrix);
        json.put("weightMatrix", r.weightMatrix);
        json.put("rootMatrix", r.rootMatrix);
        json.put("rootNode", r.rootNode);
        json.put("inOrderTraversal", r.inOrderTraversal);

        sendJson(exchange, 200, json);
    }

    private static double parseDouble(String s, double fallback) {
        if (s == null || s.isBlank()) return fallback;
        try { return Double.parseDouble(s.trim()); } catch (Exception e) { return fallback; }
    }

    private static int parseInt(String s, int fallback) {
        if (s == null || s.isBlank()) return fallback;
        try { return Integer.parseInt(s.trim()); } catch (Exception e) { return fallback; }
    }

    // ---------- Helpers ----------

    private static boolean allowCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return false;
        }
        return true;
    }

    private static Map<String, String> parseQuery(String rawQuery) {
        Map<String, String> params = new HashMap<>();
        if (rawQuery == null || rawQuery.isBlank()) return params;
        for (String pair : rawQuery.split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            String key = URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8);
            String value = URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            params.put(key, value);
        }
        return params;
    }

    private static void sendJson(HttpExchange exchange, int status, Object payload) throws IOException {
        String json = JsonWriter.write(payload);
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static double round(double v) {
        return Math.round(v * 10000.0) / 10000.0;
    }
}

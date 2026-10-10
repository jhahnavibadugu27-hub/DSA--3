package com.unicodesearch;

import com.unicodesearch.algorithm.*;
import com.unicodesearch.index.*;
import com.unicodesearch.model.*;
import com.unicodesearch.service.*;
import com.unicodesearch.util.UnicodeUtil;

import java.nio.file.Path;
import java.util.*;

/** Dependency-free test runner:  java -cp bin com.unicodesearch.SearchEngineTests ../corpus */
public class SearchEngineTests {
    static int pass = 0, fail = 0;

    static void check(String name, boolean ok) {
        if (ok) pass++; else fail++;
        System.out.println((ok ? "PASS  " : "FAIL  ") + name);
    }

    static Set<String> ids(SearchEngine.SearchResponse r) {
        Set<String> s = new TreeSet<>();
        for (SearchResultItem i : r.results) s.add(i.getDocumentId());
        return s;
    }

    /** Independent oracle: documents whose folded text contains ALL keywords (String.contains, tests only). */
    static Set<String> oracle(Collection<Document> docs, List<String> kws) {
        Set<String> s = new TreeSet<>();
        for (Document d : docs) {
            boolean all = true;
            for (String k : kws) if (!d.getSearchableContent().contains(k)) { all = false; break; }
            if (all) s.add(d.getId());
        }
        return s;
    }

    public static void main(String[] a) throws Exception {
        Path corpus = Path.of(a.length > 0 ? a[0] : "../corpus");
        List<Document> docs = new CorpusLoader().loadCorpus(corpus);
        InvertedIndex idx = new InvertedIndex();
        idx.build(docs);
        SearchEngine se = new SearchEngine(idx);
        System.out.println("Corpus: " + docs.size() + " docs, dictionary: " + idx.getVocabularySize() + " terms\n");

        // ---- Tests 1-4: single keyword, every algorithm, vs oracle ----
        for (String w : List.of("india", "water", "computer", "science", "river", "agriculture", "technology", "Ganga")) {
            String k = UnicodeUtil.toSearchable(w);
            Set<String> exp = oracle(docs, List.of(k));
            for (String alg : List.of("kmp", "rabinkarp", "naive", "zalgorithm", "ahocorasick")) {
                check("single '" + w + "' " + alg + " -> " + exp.size() + " docs", ids(se.search(w, "all", alg, "")).equals(exp));
            }
        }
        check("india returns >0 (case bug fixed)", se.search("india", "all", "kmp", "").totalResults > 0);
        check("'India' == 'INDIA' == 'india'", ids(se.search("India", "all", "kmp", "")).equals(ids(se.search("INDIA", "all", "kmp", ""))));

        // ---- Whole-dictionary sweep: EVERY dictionary term, KMP + RK + AC vs oracle ----
        int swept = 0, bad = 0;
        for (String term : idx.getDictionary()) {
            Set<String> exp = oracle(docs, List.of(term));
            for (String alg : List.of("kmp", "rabinkarp", "ahocorasick", "zalgorithm")) {
                if (!ids(se.search(term, "all", alg, "")).equals(exp)) bad++;
            }
            swept++;
        }
        check("dictionary sweep: all " + swept + " terms x 4 algorithms match oracle", bad == 0);

        // ---- Test 5 ----
        var r5 = se.search("nonexistentword123", "all", "auto", "");
        check("unknown word -> 0 results + message, no crash", r5.totalResults == 0 && r5.message != null && r5.error == null);

        // ---- Tests 6-8: AND semantics ----
        for (String q : List.of("india water", "river agriculture", "india water science", "india education students", "computer science")) {
            List<String> ks = UnicodeUtil.tokenize(q);
            var r = se.search(q, "all", "auto", "");
            boolean ok = ids(r).equals(oracle(docs, ks)) && r.algorithm.equals("ahocorasick");
            for (SearchResultItem it : r.results) for (String k : ks) if (it.getKeywordFrequencies().get(k) < 1) ok = false;
            check("AND '" + q + "' -> " + r.totalResults + " docs (Aho-Corasick)", ok);
        }
        var iw = se.search("india water", "all", "auto", "");
        var i = se.search("india", "all", "auto", "");
        check("'india water' strictly fewer than 'india' (not OR)", iw.totalResults < i.totalResults && iw.totalResults > 0);
        check("documentsScanned == candidate set, not 500", iw.documentsScanned < docs.size());

        // random dictionary combinations of 2..5 terms vs oracle
        Random rnd = new Random(42);
        List<String> dict = new ArrayList<>(idx.getDictionary());
        Collections.sort(dict);
        int combBad = 0;
        for (int t = 0; t < 300; t++) {
            int n = 2 + rnd.nextInt(4);
            List<String> ks = new ArrayList<>();
            Document seed = docs.get(rnd.nextInt(docs.size()));
            List<UnicodeUtil.Token> toks = UnicodeUtil.tokenizeWithOffsets(seed.getSearchableContent());
            for (int j = 0; j < n; j++) ks.add(toks.get(rnd.nextInt(toks.size())).text());
            ks = new ArrayList<>(new LinkedHashSet<>(ks));
            if (ks.size() < 2) continue;
            if (!ids(se.search(String.join(" ", ks), "all", "auto", "")).equals(oracle(docs, ks))) combBad++;
        }
        check("300 random multi-keyword AND queries match oracle", combBad == 0);

        // ---- Tests 9-10: 50 / 51 keywords ----
        String base = "india technology science computer software hardware internet education university student research engineering algorithm data artificial intelligence machine learning mathematics physics chemistry biology history culture language literature medicine economics politics geography environment energy communication innovation development industry agriculture space satellite programming database network security robotics automation cloud quantum astronomy digital mobile";
        int n50 = UnicodeUtil.tokenize(base).size();
        var r50 = se.search(base, "all", "auto", "");
        check("50-keyword query accepted (tokens=" + n50 + ", keywords searched=" + r50.keywords.size() + ")", n50 == 50 && r50.error == null && r50.keywords.size() == 50);
        var r51 = se.search(base + " extra", "all", "auto", "");
        check("51 keywords rejected with clear error", r51.error != null && r51.error.contains("Maximum 50 keywords allowed"));

        // 50 keywords that DO exist: all must be present (built from one real doc's dictionary + extras)
        List<Document> fx = new ArrayList<>(docs);
        StringBuilder full = new StringBuilder(), partial = new StringBuilder();
        List<String> fifty = new ArrayList<>();
        for (int j = 0; j < 50; j++) fifty.add("kw" + j + "x");
        for (String k : fifty) full.append(k).append(' ');
        for (int j = 0; j < 49; j++) partial.append(fifty.get(j)).append(' ');
        fx.add(new Document("fx-all50", "All fifty", "english", full.toString()));
        fx.add(new Document("fx-49", "Forty nine", "english", partial.toString()));
        InvertedIndex fidx = new InvertedIndex(); fidx.build(fx);
        var r50b = new SearchEngine(fidx).search(String.join(" ", fifty), "all", "auto", "");
        check("50 keywords: only the doc holding ALL 50 qualifies", r50b.totalResults == 1 && r50b.results.get(0).getDocumentId().equals("fx-all50"));

        // ---- Test 11: fuzzy (fixture has 'computer') ----
        List<Document> fx2 = new ArrayList<>();
        fx2.add(new Document("fx-cs", "Computer Science", "english", "A Computer runs software.\nComputer Science studies algorithms.\n\nScience and technology of India and water."));
        fx2.add(new Document("fx-c", "Computers", "english", "Every computer needs power."));
        InvertedIndex idx2 = new InvertedIndex(); idx2.build(fx2);
        SearchEngine se2 = new SearchEngine(idx2);
        var ex = se2.search("computr", "all", "auto", "", "exact");
        check("typo 'computr' exact mode: 0 results but suggests 'computer'", ex.totalResults == 0 && ex.suggestions.containsKey("computr")
                && ex.suggestions.get("computr").get(0).get("term").equals("computer") && (int) ex.suggestions.get("computr").get(0).get("distance") == 1);
        var fz = se2.search("computr", "all", "auto", "", "fuzzy");
        check("typo 'computr' fuzzy mode: corrected to computer, results found", fz.totalResults == 2 && fz.corrections.size() == 1);
        check("LevenshteinDistance(computr, computer)=1", LevenshteinDistance.distance("computr", "computer") == 1);
        check("Levenshtein kitten/sitting=3, ''/abc=3, same=0", LevenshteinDistance.distance("kitten", "sitting") == 3
                && LevenshteinDistance.distance("", "abc") == 3 && LevenshteinDistance.distance("abc", "abc") == 0);
        check("Levenshtein bounded + explain consistent", LevenshteinDistance.distanceBounded("kitten", "sitting", 2) == 3
                && LevenshteinDistance.explain("kitten", "sitting").stream().filter(o -> !o.startsWith("MATCH")).count() == 3);
        var cs = se2.search("computer science", "all", "auto", "");
        check("fixture 'computer science' -> only fx-cs", ids(cs).equals(Set.of("fx-cs")));
        var ics = se2.search("computer science india water", "all", "auto", "");
        check("fixture 4-keyword AND -> only fx-cs", ids(ics).equals(Set.of("fx-cs")));
        String snip = cs.results.get(0).getSnippet();
        check("snippet is multi-line, keeps original case + highlights", snip.contains("\n") && snip.contains("[[Computer]]") && snip.contains("[[Science]]"));

        // ---- Tests 12-15: Unicode ----
        Map<String, String> uni = new LinkedHashMap<>();
        uni.put("telugu", "తెలుగు"); uni.put("hindi", "भारत"); uni.put("tamil", "தமிழ்"); uni.put("bengali", "বাংলা");
        for (var e : uni.entrySet()) {
            var r = se.search(e.getValue(), e.getKey(), "kmp", "");
            var rc = se.search(e.getValue(), e.getKey(), "ahocorasick", "");
            check(e.getKey() + " keyword '" + e.getValue() + "' -> " + r.totalResults + " docs match oracle",
                    r.totalResults > 0 && ids(r).equals(oracle(docs.stream().filter(d -> d.getLanguage().equals(e.getKey())).toList(), List.of(UnicodeUtil.toSearchable(e.getValue()))))
                            && ids(rc).equals(ids(r)));
        }
        String decomposed = java.text.Normalizer.normalize("भारत", java.text.Normalizer.Form.NFD);
        check("NFD query still matches (NFC normalization)", se.search(decomposed, "hindi", "kmp", "").totalResults == se.search("भारत", "hindi", "kmp", "").totalResults);
        var orig = docs.get(0);
        check("original content unchanged/multiline preserved", orig.getOriginalContent().contains("\n"));

        // ---- Other algorithms ----
        check("Z-array of 'aabcaabxaaaz'", Arrays.equals(ZAlgorithm.buildZ("aabcaabxaaaz"), new int[]{12, 1, 0, 0, 3, 1, 0, 0, 2, 2, 1, 0}));
        check("Aho-Corasick single-char keyword detected", new AhoCorasick(List.of("a")).searchAll("banana").get("a").size() == 3);
        check("Aho-Corasick overlapping he/she/his/hers", new AhoCorasick(List.of("he", "she", "his", "hers")).searchAll("ushers").keySet().equals(Set.of("he", "she", "hers")));

        // ---- CO4 network flow ----
        var flow = new KeywordDocumentFlowAnalyzer(idx).analyze("india water river", "all", "dinic", 1);
        int mf = (int) flow.get("maxFlow");
        var runs = (List<Map<String, Object>>) flow.get("algorithmRuns");
        check("flow: 3 algorithms agree, maxFlow=" + mf + ", min-cut == max-flow",
                (boolean) flow.get("algorithmsAgree") && runs.size() == 3 && (boolean) ((Map<String, Object>) flow.get("minCut")).get("equalsMaxFlow"));
        check("flow: keyword nodes=3, matching size == maxFlow", (int) flow.get("keywordNodes") == 3 && (int) flow.get("matchingSize") == mf);
        var flow2 = new KeywordDocumentFlowAnalyzer(idx2).analyze("computer science", "all", "edmondskarp", 5);
        check("flow: demand 5 exceeds supply -> bottleneck reported", !(boolean) flow2.get("fullyMatched") && !((List<?>) flow2.get("unmatchedKeywords")).isEmpty());

        // ---- DSA Improvements & Response Metrics ----
        var tstRes = idx.getDictionaryTermsContaining("ind");
        check("TermSuffixTrie candidate lookup finds terms containing 'ind'", !tstRes.isEmpty() && tstRes.contains("india"));
        var prefRes = idx.getDictionaryTermsWithPrefix("ind");
        check("vocabularyTrie prefix lookup finds terms starting with 'ind'", !prefRes.isEmpty() && prefRes.contains("india"));

        var indResp = se.search("india", "all", "kmp", "");
        check("response contains candidateDocuments and indexReductionPercent",
                indResp.candidateDocuments > 0 && indResp.indexReductionPercent >= 0.0);
        check("first search result has matchPositions and rankingExplanation",
                !indResp.results.isEmpty()
                        && !indResp.results.get(0).getMatchPositions().isEmpty()
                        && indResp.results.get(0).getRankingExplanation().containsKey("frequencyScore")
                        && indResp.results.get(0).getRankingExplanation().containsKey("titleMatchBonus"));

        // ---- Advanced DP Algorithms: Edit Distance, Alignment, OBST ----
        var wfRes = WagnerFischer.compute("kitten", "sitting");
        check("Wagner-Fischer kitten/sitting distance=3 with valid DP matrix",
                wfRes.distance == 3 && wfRes.matrix[6][7] == 3 && !wfRes.path.isEmpty());

        var dlRes = DamerauLevenshtein.compute("teh", "the");
        check("Damerau-Levenshtein transposition 'teh' -> 'the' distance=1",
                dlRes.distance == 1 && dlRes.operations.stream().anyMatch(op -> op.startsWith("TRANSPOSE")));
        check("Damerau-Levenshtein transposition 'ca' -> 'ac' distance=1",
                DamerauLevenshtein.distance("ca", "ac") == 1);

        var weightedRes = WeightedEditDistance.compute("a", "ab", 0.5, 1.0, 2.0, 1.0);
        check("Weighted Edit Distance custom insertion cost 0.5",
                Math.abs(weightedRes.distance - 0.5) < 1e-6);

        var nwRes = NeedlemanWunsch.align("GCATGCG", "GATTACA", 1, -1, -1);
        check("Needleman-Wunsch sequence alignment score and equal-length aligned strings",
                nwRes.score == 0
                        && nwRes.alignedSeq1.length() == nwRes.alignedSeq2.length()
                        && nwRes.matchCount > 0);

        var obstRes = OptimalBST.compute(List.of("A", "B", "C"), List.of(0.5, 0.3, 0.2));
        check("Optimal BST DP computes positive expected cost and preserves in-order traversal",
                obstRes.expectedCost > 0
                        && obstRes.inOrderTraversal.equals(List.of("A", "B", "C"))
                        && obstRes.rootNode.containsKey("key"));

        // ---- Article Search using DP / Alignment Algorithms ----
        var wfSearch = se.search("computer", "all", "wagnerfischer", "");
        check("Search with Wagner-Fischer returns articles: total=" + wfSearch.totalResults,
                wfSearch.totalResults > 0 && "wagnerfischer".equals(wfSearch.algorithm));

        var dlSearch = se.search("computr", "all", "dameraulevenshtein", "");
        check("Search with Damerau-Levenshtein typo 'computr' returns articles: total=" + dlSearch.totalResults,
                dlSearch.totalResults > 0 && "dameraulevenshtein".equals(dlSearch.algorithm));

        var nwSearch = se.search("science", "all", "needlemanwunsch", "");
        check("Search with Needleman-Wunsch returns articles: total=" + nwSearch.totalResults,
                nwSearch.totalResults > 0 && "needlemanwunsch".equals(nwSearch.algorithm));

        var wedSearch = se.search("technology", "all", "weightededitdistance", "");
        check("Search with Weighted Edit Distance returns articles: total=" + wedSearch.totalResults,
                wedSearch.totalResults > 0 && "weightededitdistance".equals(wedSearch.algorithm));

        System.out.println("\n" + pass + " passed, " + fail + " failed");
        System.exit(fail == 0 ? 0 : 1);
    }
}

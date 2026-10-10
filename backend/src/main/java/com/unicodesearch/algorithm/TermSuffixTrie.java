package com.unicodesearch.algorithm;

import java.util.*;

/**
 * Suffix-Trie over the inverted index dictionary (DSA Improvement).
 *
 * Problem in naive candidate retrieval:
 *   Scanning every term in the dictionary and running KMP takes O(V * L)
 *   where V is the dictionary size and L is the average term length.
 *
 * Solution:
 *   For every dictionary term, insert all its suffixes into this Trie and
 *   index which dictionary term each suffix belongs to.
 *
 *   To find all dictionary terms containing a given substring 'keyword',
 *   we traverse the Trie following 'keyword' in O(|keyword|) time.
 *   The node reached directly contains the set of all dictionary terms
 *   that contain 'keyword'.
 *
 * Time complexity:
 *   - Search: O(|keyword| + matches) instead of O(V * L).
 *   - Build:  O(sum of squares of term lengths) once during index build.
 *
 * Space complexity:
 *   - Compact in memory for the ~1,300 dictionary terms.
 */
public class TermSuffixTrie {

    private static class SuffixNode {
        final Map<Character, SuffixNode> children = new HashMap<>();
        final Set<String> terms = new HashSet<>();
    }

    private final SuffixNode root = new SuffixNode();
    private int totalIndexedTerms = 0;

    /** Inserts all suffixes of a dictionary term into the suffix trie. */
    public void insertTerm(String term) {
        if (term == null || term.isEmpty()) return;
        totalIndexedTerms++;
        int len = term.length();
        for (int i = 0; i < len; i++) {
            SuffixNode curr = root;
            for (int j = i; j < len; j++) {
                char c = term.charAt(j);
                curr = curr.children.computeIfAbsent(c, k -> new SuffixNode());
                curr.terms.add(term);
            }
        }
    }

    /**
     * Retrieves all dictionary terms that contain the keyword as a substring in O(|keyword|).
     * Returns an empty list if the keyword does not appear in any dictionary term.
     */
    public List<String> getTermsContaining(String keyword) {
        if (keyword == null || keyword.isEmpty()) return Collections.emptyList();
        SuffixNode curr = root;
        for (int i = 0; i < keyword.length(); i++) {
            char c = keyword.charAt(i);
            curr = curr.children.get(c);
            if (curr == null) return Collections.emptyList();
        }
        List<String> result = new ArrayList<>(curr.terms);
        Collections.sort(result);
        return result;
    }

    /** Returns true if any dictionary term contains the keyword as a substring in O(|keyword|). */
    public boolean containsSubstring(String keyword) {
        if (keyword == null || keyword.isEmpty()) return false;
        SuffixNode curr = root;
        for (int i = 0; i < keyword.length(); i++) {
            char c = keyword.charAt(i);
            curr = curr.children.get(c);
            if (curr == null) return false;
        }
        return !curr.terms.isEmpty();
    }

    public int getTotalIndexedTerms() {
        return totalIndexedTerms;
    }
}

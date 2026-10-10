const ALGORITHMS = [
  { name: 'Inverted Index', detail: 'HashMap<term, List<Posting>> narrowing queries to candidate documents with character-level occurrence offsets.' },
  { name: 'TermSuffixTrie', detail: 'Trie indexing all suffixes of vocabulary terms; achieves O(|keyword|) containment lookup instead of O(V × L) dictionary scanning.' },
  { name: 'KMP Algorithm', detail: 'Single-keyword exact matching using precomputed Longest Proper Prefix-Suffix (LPS) array — O(n + m) time, no backwards pointer movement.' },
  { name: 'Rabin–Karp', detail: 'Rolling polynomial hash (base 256, mod 10⁹+7) with O(1) window updates and explicit character collision verification.' },
  { name: 'Aho–Corasick', detail: 'Trie automaton augmented with BFS failure links; finds all query keywords across text in a single linear pass (AND semantics).' },
  { name: 'Z-Algorithm', detail: 'Constructs Z-array of [pattern + separator + text] maintaining rightmost match window [l, r) in O(n + m) time.' },
  { name: 'Levenshtein (DP)', detail: 'Dynamic programming matrix with length-gap and row-minimum pruning for typo-tolerant "did you mean" suggestions (CO3).' },
  { name: 'Network Flow', detail: 'Keyword-document bipartite matching: Dinic, Edmonds-Karp, and Ford-Fulkerson with Max-Flow Min-Cut bottleneck theorem (CO4).' },
];

export default function About() {
  return (
    <div className="shell" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 840 }}>
      <p className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>academic project documentation · dsa exhibition</p>
      <h1 style={{ fontSize: 36, marginTop: 10, marginBottom: 8 }}>
        Unicode Pattern Search Engine
      </h1>
      <h2 style={{ fontSize: 22, color: 'var(--saffron)', fontWeight: 400, marginBottom: 28 }}>
        For Indian Language Wikipedia
      </h2>

      <div className="panel" style={{ padding: 24, marginBottom: 32, background: 'var(--panel-raised)' }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--paper)' }}>
          A specialized, Unicode-aware text search engine developed to demonstrate core
          <strong> Data Structures and Algorithms</strong> applied to multilingual Indian language retrieval
          (Telugu, Hindi, Tamil, Bengali, and English). Every algorithm and data structure is hand-coded
          in Java from scratch without third-party search libraries (no Lucene, Solr, Elasticsearch, or database LIKE).
        </p>
      </div>

      <h3 style={{ fontSize: 20, marginBottom: 12 }}>The Problem: Why Standard Search Fails on Indian Scripts</h3>
      <p style={{ lineHeight: 1.7, marginBottom: 28, color: 'var(--paper-dim)' }}>
        Standard string search algorithms are typically designed for simple ASCII Latin alphabets. Indian scripts
        (Devanagari, Telugu, Tamil, Bengali) rely on complex grapheme clusters comprising base consonants, vowel matras,
        viramas (halants), and joining controls (ZWJ U+200D and ZWNJ U+200C). In raw text, identical visual syllables
        can be encoded in differing code-point orders (NFD vs NFC), causing standard byte-level comparisons to fail silently.
      </p>

      <h3 style={{ fontSize: 20, marginBottom: 12 }}>Why Unicode Normalization Matters</h3>
      <p style={{ lineHeight: 1.7, marginBottom: 28, color: 'var(--paper-dim)' }}>
        Our preprocessing pipeline passes all corpus text and incoming queries through Unicode <strong>NFC (Canonical Composition)</strong>
        normalization. This collapses decomposed diacritic sequences into canonical composite forms. For Latin characters,
        case-folding is applied character-by-character to preserve exact string offsets between the normalized display
        text and the searchable text, guaranteeing zero-offset shift during snippet extraction and document highlighting.
      </p>

      <h3 style={{ fontSize: 20, marginBottom: 12 }}>Hand-Crafted Data Structures & Algorithms</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 32 }}>
        {ALGORITHMS.map((a, i) => (
          <div key={a.name} style={{ padding: '16px 0', borderTop: i === 0 ? '1px solid var(--line)' : 'none', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
              <div className="mono" style={{ width: 170, flexShrink: 0, color: 'var(--saffron)', fontSize: 14, fontWeight: 600 }}>
                {a.name}
              </div>
              <div style={{ fontSize: 14, color: 'var(--paper-dim)', lineHeight: 1.6 }}>
                {a.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 20, marginBottom: 12 }}>The Search Workflow</h3>
      <div className="panel" style={{ padding: 24, marginBottom: 32, background: 'var(--panel-raised)' }}>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, fontSize: 14, color: 'var(--paper)' }}>
          <li><strong>Query Reception:</strong> Accepts multilingual Unicode input across 5 language folders.</li>
          <li><strong>NFC Normalization & Case Folding:</strong> Canonical composition + length-preserving Latin folding.</li>
          <li><strong>Tokenization:</strong> Word splitting with Unicode combining mark awareness.</li>
          <li><strong>Fuzzy Suggestion (if required):</strong> Levenshtein DP with early pruning against the index dictionary.</li>
          <li><strong>Suffix-Trie & Inverted Index Lookup:</strong> O(|keyword|) containment retrieval pruning 90%+ of documents.</li>
          <li><strong>Pattern Matching:</strong> Single-keyword (KMP / Rabin-Karp / Z) or multi-keyword (Aho-Corasick automaton).</li>
          <li><strong>Explainable Relevance Scoring:</strong> Keyword frequency + Title hit + Exact match + Keyword coverage.</li>
          <li><strong>Contextual Snippets:</strong> Multi-line window selection highlighting occurrences in original text.</li>
        </ol>
      </div>

      <h3 style={{ fontSize: 20, marginBottom: 12 }}>Future Scope</h3>
      <p style={{ lineHeight: 1.7, color: 'var(--paper-dim)' }}>
        Future iterations can integrate morphological stemmers tailored for agglutinative Dravidian languages (Telugu and Tamil),
        phonetic transliteration matching (e.g. Indic Soundex / Metaphone for search by Romanized English transliteration),
        and compressed posting lists (variable-byte and Elias gamma encoding) for multi-gigabyte corpora.
      </p>
    </div>
  );
}

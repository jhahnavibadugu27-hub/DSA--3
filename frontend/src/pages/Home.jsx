import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = [
  { value: 'all', label: 'All languages' },
  { value: 'telugu', label: 'Telugu (తెలుగు)' },
  { value: 'hindi', label: 'Hindi (हिन्दी)' },
  { value: 'tamil', label: 'Tamil (தமிழ்)' },
  { value: 'bengali', label: 'Bengali (বাংলা)' },
  { value: 'english', label: 'English' },
];

const ALGORITHMS = [
  { value: 'auto', label: 'Auto (Engine picks KMP / Aho-Corasick)' },
  { value: 'kmp', label: 'KMP (Knuth–Morris–Pratt)' },
  { value: 'rabinkarp', label: 'Rabin–Karp (Rolling Hash)' },
  { value: 'ahocorasick', label: 'Aho–Corasick (Automaton)' },
  { value: 'zalgorithm', label: 'Z-Algorithm' },
  { value: 'naive', label: 'Naive (Brute Force Baseline)' },
  { value: 'wagnerfischer', label: 'Wagner-Fischer (Levenshtein DP)' },
  { value: 'dameraulevenshtein', label: 'Damerau-Levenshtein (Transposition DP)' },
  { value: 'weightededitdistance', label: 'Weighted Edit Distance' },
  { value: 'needlemanwunsch', label: 'Needleman-Wunsch (Global Alignment)' },
];

const EXAMPLES = [
  { label: 'తెలుగు: భారతదేశం', query: 'భారతదేశం', lang: 'telugu' },
  { label: 'Hindi: भारत', query: 'भारत', lang: 'hindi' },
  { label: 'Tamil: இந்தியா', query: 'இந்தியா', lang: 'tamil' },
  { label: 'Bengali: ভারত', query: 'ভারত', lang: 'bengali' },
  { label: 'English: India', query: 'India', lang: 'english' },
  { label: 'Multi: भारत इतिहास', query: 'भारत इतिहास', lang: 'hindi' },
];

const MAX_KEYWORDS = 50;

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('all');
  const [algorithm, setAlgorithm] = useState('auto');
  const [searchMode, setSearchMode] = useState('exact');

  const keywordCount = query.trim() ? query.trim().split(/\s+/).length : 0;
  const tooManyKeywords = keywordCount > MAX_KEYWORDS;

  function doSearch(searchQuery, searchLang = language, searchAlgo = algorithm, mode = searchMode) {
    if (!searchQuery.trim() || tooManyKeywords) return;
    const params = new URLSearchParams({
      query: searchQuery.trim(),
      language: searchLang,
      algorithm: searchAlgo,
      searchMode: mode,
    });
    navigate(`/results?${params.toString()}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    doSearch(query);
  }

  function handleExampleClick(ex) {
    setQuery(ex.query);
    setLanguage(ex.lang);
    doSearch(ex.query, ex.lang);
  }

  return (
    <div className="shell" style={{ paddingTop: 64, paddingBottom: 96 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 64, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'var(--panel-raised)', border: '1px solid var(--line)', marginBottom: 20 }}>
            <span className="mono" style={{ color: 'var(--saffron)', fontSize: 12 }}>DSA EXPO EDITION</span>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>·</span>
            <span className="mono" style={{ color: 'var(--paper-dim)', fontSize: 12 }}>Unicode + Inverted Index + Matchers</span>
          </div>

          <h1 style={{ fontSize: 50, lineHeight: 1.1, maxWidth: 540 }}>
            Unicode Pattern Search Engine
          </h1>
          <p style={{ marginTop: 12, fontSize: 20, color: 'var(--saffron)', fontFamily: 'var(--font-display)' }}>
            For Indian Language Wikipedia
          </p>

          <p style={{ marginTop: 20, fontSize: 16, maxWidth: 480, lineHeight: 1.65 }}>
            Every search pipeline stage is hand-coded in Java without external libraries:
            NFC Unicode normalization, Inverted Index candidate retrieval via Suffix-Trie,
            KMP, Rabin-Karp, Aho-Corasick, Z-Algorithm, and Levenshtein dynamic programming.
          </p>

          {/* Script specimen chips */}
          <div style={{ marginTop: 40 }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
              Example Searches (Click to Run):
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  className="btn btn-ghost btn-sm indic"
                  onClick={() => handleExampleClick(ex)}
                  style={{ fontSize: 13, padding: '6px 12px' }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel" style={{ marginTop: 40, padding: 20, maxWidth: 480, background: 'var(--panel-raised)' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--teal)', marginBottom: 6 }}>
              VIVA & TECHNICAL HIGHLIGHT
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6 }}>
              Query → NFC Normalization → Tokenization → Vocabulary Suffix-Trie → Inverted Index Postings → Candidate Intersection (AND) → Pattern Matching → Ranking Engine → Snippet Extractor.
            </p>
          </div>
        </div>

        {/* Search Controls Panel */}
        <form onSubmit={handleSubmit} className="panel" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="field-label" htmlFor="query">Search Query (Unicode Supported)</label>
            <input
              id="query"
              type="text"
              className="indic"
              placeholder="తెలుగు, भारत, தமிழ், বাংলা, India…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span className="mono" style={{ fontSize: 11, color: tooManyKeywords ? 'var(--maroon)' : 'var(--muted)' }}>
                {keywordCount} / {MAX_KEYWORDS} keywords
              </span>
              {tooManyKeywords && (
                <span className="mono" style={{ fontSize: 11, color: 'var(--maroon)' }}>
                  Too many keywords — max {MAX_KEYWORDS}
                </span>
              )}
            </div>
          </div>

          {/* Search Mode Toggle: Exact vs Fuzzy */}
          <div>
            <span className="field-label">Search Mode</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { v: 'exact', l: 'Exact Search' },
                { v: 'fuzzy', l: 'Fuzzy (Typo-Tolerant DP)' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.v}
                  onClick={() => setSearchMode(m.v)}
                  className={searchMode === m.v ? 'btn' : 'btn btn-ghost'}
                  style={{ flex: 1, justifyContent: 'center', padding: '10px 12px', fontSize: 13 }}
                >
                  {m.l}
                </button>
              ))}
            </div>
          </div>

          {/* Language Filter */}
          <div>
            <label className="field-label" htmlFor="language">Language Filter</label>
            <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Algorithm Selector */}
          <div>
            <label className="field-label" htmlFor="algorithm">Pattern Matching Algorithm</label>
            <select id="algorithm" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
              {ALGORITHMS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn"
            style={{ justifyContent: 'center', marginTop: 8 }}
            disabled={!query.trim() || tooManyKeywords}
          >
            Search Corpus
          </button>

          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            Supports single or multi-keyword queries (AND-matched). Auto algorithm selects KMP for 1 keyword and Aho-Corasick automaton for multi-keyword queries in a single pass.
          </p>
        </form>
      </div>
    </div>
  );
}

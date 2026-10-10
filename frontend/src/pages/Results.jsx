import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { search } from '../services/api';
import ResultCard from '../components/ResultCard';
import DocumentViewerModal from '../components/DocumentViewerModal';
import HowSearchWorkedModal from '../components/HowSearchWorkedModal';
import HowRankedModal from '../components/HowRankedModal';

const LANGUAGES = [
  { value: 'all', label: 'All languages' },
  { value: 'telugu', label: 'Telugu (తెలుగు)' },
  { value: 'hindi', label: 'Hindi (हिन्दी)' },
  { value: 'tamil', label: 'Tamil (தமிழ்)' },
  { value: 'bengali', label: 'Bengali (বাংলা)' },
  { value: 'english', label: 'English' },
];

const ALGORITHMS = [
  { value: 'auto', label: 'Auto (Engine picks)' },
  { value: 'kmp', label: 'KMP' },
  { value: 'rabinkarp', label: 'Rabin–Karp' },
  { value: 'ahocorasick', label: 'Aho–Corasick' },
  { value: 'zalgorithm', label: 'Z-Algorithm' },
  { value: 'naive', label: 'Naive' },
  { value: 'wagnerfischer', label: 'Wagner-Fischer (Levenshtein)' },
  { value: 'dameraulevenshtein', label: 'Damerau-Levenshtein' },
  { value: 'weightededitdistance', label: 'Weighted Edit Distance' },
  { value: 'needlemanwunsch', label: 'Needleman-Wunsch (Alignment)' },
];

const EXAMPLES = [
  { label: 'తెలుగు: భారతదేశం', query: 'భారతదేశం', lang: 'telugu' },
  { label: 'Hindi: भारत', query: 'भारत', lang: 'hindi' },
  { label: 'Tamil: இந்தியா', query: 'இந்தியா', lang: 'tamil' },
  { label: 'Bengali: ভারত', query: 'ভারত', lang: 'bengali' },
  { label: 'English: India', query: 'India', lang: 'english' },
];

export default function Results() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = params.get('query') || '';
  const languageParam = params.get('language') || 'all';
  const algorithmParam = params.get('algorithm') || 'auto';
  const modeParam = params.get('mode') || '';
  const searchModeParam = params.get('searchMode') || 'exact';

  // Local form state for top search bar
  const [inputQuery, setInputQuery] = useState(queryParam);
  const [selectedLanguage, setSelectedLanguage] = useState(languageParam);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(algorithmParam);
  const [selectedSearchMode, setSelectedSearchMode] = useState(searchModeParam);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [viewerDocId, setViewerDocId] = useState(null);
  const [showHowSearchWorked, setShowHowSearchWorked] = useState(false);
  const [rankedModalItem, setRankedModalItem] = useState(null);

  // Sync state with URL params
  useEffect(() => {
    setInputQuery(queryParam);
    setSelectedLanguage(languageParam);
    setSelectedAlgorithm(algorithmParam);
    setSelectedSearchMode(searchModeParam);

    if (!queryParam.trim()) {
      navigate('/');
      return;
    }

    setLoading(true);
    setError(null);
    search({
      query: queryParam.trim(),
      language: languageParam,
      algorithm: algorithmParam,
      mode: modeParam,
      searchMode: searchModeParam,
    })
      .then(setData)
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [queryParam, languageParam, algorithmParam, modeParam, searchModeParam, navigate]);

  function handleSearchSubmit(e) {
    if (e) e.preventDefault();
    if (!inputQuery.trim()) return;
    setParams({
      query: inputQuery.trim(),
      language: selectedLanguage,
      algorithm: selectedAlgorithm,
      searchMode: selectedSearchMode,
    });
  }

  function handleExampleClick(ex) {
    setInputQuery(ex.query);
    setSelectedLanguage(ex.lang);
    setParams({
      query: ex.query,
      language: ex.lang,
      algorithm: selectedAlgorithm,
      searchMode: selectedSearchMode,
    });
  }

  function handleSwitchToFuzzy() {
    setSelectedSearchMode('fuzzy');
    setParams({
      query: queryParam,
      language: languageParam,
      algorithm: algorithmParam,
      searchMode: 'fuzzy',
    });
  }

  function handleSearchAllLanguages() {
    setSelectedLanguage('all');
    setParams({
      query: queryParam,
      language: 'all',
      algorithm: algorithmParam,
      searchMode: searchModeParam,
    });
  }

  function handleSuggestionClick(term) {
    // Replace the misspelled word in query with the suggestion
    setInputQuery(term);
    setParams({
      query: term,
      language: selectedLanguage,
      algorithm: selectedAlgorithm,
      searchMode: 'exact',
    });
  }

  const reduction = data?.indexReductionPercent ??
    (data && data.totalDocuments > 0
      ? Math.round(((data.totalDocuments - data.documentsScanned) / data.totalDocuments) * 1000) / 10
      : 0);

  return (
    <div className="shell" style={{ paddingTop: 36, paddingBottom: 96 }}>
      {/* Search Controls Panel */}
      <div className="panel" style={{ padding: 24, marginBottom: 32 }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 16 }}>
            <input
              type="text"
              className="indic"
              placeholder="Search Indian Wikipedia (Unicode supported)…"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              style={{ fontSize: 16, padding: '12px 14px' }}
            />
            <button type="submit" className="btn" style={{ padding: '0 28px' }}>
              Search
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'center' }}>
            {/* Language filter */}
            <div>
              <label className="field-label" htmlFor="res-lang">Language Filter</label>
              <select
                id="res-lang"
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  setParams({
                    query: inputQuery.trim(),
                    language: e.target.value,
                    algorithm: selectedAlgorithm,
                    searchMode: selectedSearchMode,
                  });
                }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Algorithm Selector */}
            <div>
              <label className="field-label" htmlFor="res-algo">Algorithm</label>
              <select
                id="res-algo"
                value={selectedAlgorithm}
                onChange={(e) => {
                  setSelectedAlgorithm(e.target.value);
                  setParams({
                    query: inputQuery.trim(),
                    language: selectedLanguage,
                    algorithm: e.target.value,
                    searchMode: selectedSearchMode,
                  });
                }}
              >
                {ALGORITHMS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* Search Mode Toggle */}
            <div>
              <span className="field-label">Search Mode</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { v: 'exact', l: 'Exact' },
                  { v: 'fuzzy', l: 'Fuzzy' },
                ].map((m) => (
                  <button
                    type="button"
                    key={m.v}
                    onClick={() => {
                      setSelectedSearchMode(m.v);
                      setParams({
                        query: inputQuery.trim(),
                        language: selectedLanguage,
                        algorithm: selectedAlgorithm,
                        searchMode: m.v,
                      });
                    }}
                    className={selectedSearchMode === m.v ? 'btn btn-sm' : 'btn btn-ghost btn-sm'}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    {m.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick example buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Examples:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className="btn btn-ghost btn-sm indic"
                onClick={() => handleExampleClick(ex)}
                style={{ fontSize: 12, padding: '4px 10px' }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {loading && (
        <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
          <p className="indic" style={{ fontSize: 18, color: 'var(--saffron)' }}>Searching "{queryParam}" across inverted index…</p>
          <p className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Executing candidate retrieval & pattern matching</p>
        </div>
      )}

      {error && (
        <div className="panel" style={{ padding: 24, borderColor: 'var(--maroon)' }}>
          <h3 style={{ fontSize: 18, color: 'var(--maroon)', marginBottom: 8 }}>Search Error</h3>
          <p style={{ color: 'var(--paper-dim)' }}>
            {error.status === 400
              ? error.message
              : `Unable to reach the Java backend (${error.message}). Ensure ApiServer is running on port 8080.`}
          </p>
        </div>
      )}

      {data && !loading && !error && (
        <>
          {/* Algorithm Actually Used Badge & Summary Bar */}
          <div className="panel" style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Algorithm actually used
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span className="mono" style={{ fontSize: 18, color: 'var(--saffron)', fontWeight: 600 }}>
                    {data.algorithm.toUpperCase()}
                  </span>
                  {data.requestedAlgorithm === 'auto' && (
                    <span className="badge badge-ghost" style={{ fontSize: 11 }}>
                      Auto-Selected ({data.mode === 'multi' ? 'Multi-Keyword' : 'Single Pattern'})
                    </span>
                  )}
                </div>
              </div>

              <div style={{ width: 1, height: 32, background: 'var(--line)' }} />

              <div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Index Reduction
                </span>
                <div className="mono" style={{ fontSize: 15, color: 'var(--teal)', marginTop: 2 }}>
                  {reduction}% pruned ({data.documentsScanned} of {data.totalDocuments} scanned)
                </div>
              </div>

              <div style={{ width: 1, height: 32, background: 'var(--line)' }} />

              <div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Runtime
                </span>
                <div className="mono" style={{ fontSize: 15, color: 'var(--paper)', marginTop: 2 }}>
                  {data.executionTimeMs} ms
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowHowSearchWorked(true)}
            >
              How Search Worked (Pipeline)
            </button>
          </div>

          {/* Algorithm Note if any */}
          {data.algorithmNote && (
            <div className="panel" style={{ padding: '12px 18px', marginBottom: 20, background: 'var(--panel-raised)', fontSize: 13, color: 'var(--paper-dim)' }}>
              ℹ️ {data.algorithmNote}
            </div>
          )}

          {/* Fuzzy Corrections if any */}
          {data.corrections && data.corrections.length > 0 && (
            <div className="panel" style={{ padding: '14px 20px', marginBottom: 20, borderColor: 'var(--saffron)' }}>
              {data.corrections.map((c) => (
                <div key={c.original} style={{ fontSize: 14 }}>
                  Fuzzy Search Corrected: <strong className="indic">{c.original}</strong> →{' '}
                  <strong className="indic" style={{ color: 'var(--saffron)' }}>{c.corrected}</strong>{' '}
                  <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>(edit distance {c.editDistance})</span>
                </div>
              ))}
            </div>
          )}

          {/* Multi-Keyword Postings Breakdown */}
          {data.keywordDocumentCounts && data.keywords.length > 1 && (
            <div className="panel" style={{ padding: '14px 20px', marginBottom: 24, background: 'var(--panel-raised)' }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                Multi-Keyword Postings Intersection (AND Semantics)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                {Object.entries(data.keywordDocumentCounts).map(([kw, count]) => (
                  <span key={kw} className="mono badge badge-ghost" style={{ fontSize: 12 }}>
                    <strong className="indic">{kw}</strong> → {count} docs
                  </span>
                ))}
                <span style={{ color: 'var(--muted)' }}>⇒</span>
                <span className="mono badge badge-teal" style={{ fontSize: 12 }}>
                  Intersection = {data.documentsScanned} candidate docs
                </span>
                <span className="badge badge-ghost" style={{ fontSize: 11 }}>
                  Algorithm: Aho-Corasick (1 pass)
                </span>
              </div>
            </div>
          )}

          {/* Empty Results Screen */}
          {data.results.length === 0 ? (
            <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
              <h3 style={{ fontSize: 22, marginBottom: 12 }}>No matching documents found</h3>
              <p className="indic" style={{ fontSize: 16, color: 'var(--paper-dim)', marginBottom: 20 }}>
                {data.message || `No documents contain "${data.query}" in ${data.language}.`}
              </p>

              {/* Suggestions from Levenshtein dictionary */}
              {data.suggestions && Object.keys(data.suggestions).length > 0 && (
                <div style={{ marginBottom: 28, padding: 18, background: 'var(--panel-raised)', display: 'inline-block', textAlign: 'left' }}>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                    DID YOU MEAN? (Levenshtein Dictionary Matches)
                  </div>
                  {Object.entries(data.suggestions).map(([kw, list]) => (
                    <div key={kw} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                      <span className="indic" style={{ color: 'var(--muted)' }}>For "{kw}":</span>
                      {list.map((s) => (
                        <button
                          key={s.term}
                          type="button"
                          className="btn btn-ghost btn-sm indic"
                          onClick={() => handleSuggestionClick(s.term)}
                          style={{ color: 'var(--saffron)' }}
                        >
                          {s.term} (dist: {s.distance})
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Useful quick actions */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                {data.searchMode !== 'fuzzy' && (
                  <button type="button" className="btn btn-sm" onClick={handleSwitchToFuzzy}>
                    Try Fuzzy Search
                  </button>
                )}
                {data.language !== 'all' && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleSearchAllLanguages}>
                    Search All Languages
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
                  Clear Search
                </button>
              </div>
            </div>
          ) : (
            /* Result cards list */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Showing {data.results.length} result{data.results.length > 1 ? 's' : ''} for "{data.query}"
                </span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Ranked by Relevance Score
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {data.results.map((r, i) => (
                  <ResultCard
                    key={r.documentId}
                    result={r}
                    index={i}
                    searchMeta={data}
                    onViewDocument={(docId) => setViewerDocId(docId)}
                    onHowSearchWorked={() => setShowHowSearchWorked(true)}
                    onHowRanked={(item, idx) => setRankedModalItem({ item, idx })}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Document Viewer Modal */}
      {viewerDocId && (
        <DocumentViewerModal
          documentId={viewerDocId}
          initialQuery={queryParam}
          onClose={() => setViewerDocId(null)}
        />
      )}

      {/* "How Search Worked" Pipeline Modal */}
      {showHowSearchWorked && (
        <HowSearchWorkedModal
          searchData={data}
          onClose={() => setShowHowSearchWorked(false)}
        />
      )}

      {/* "How Ranked" Explanation Modal */}
      {rankedModalItem && (
        <HowRankedModal
          result={rankedModalItem.item}
          rankIndex={rankedModalItem.idx}
          onClose={() => setRankedModalItem(null)}
        />
      )}
    </div>
  );
}

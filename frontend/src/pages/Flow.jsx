import { useState } from 'react';
import { getFlow } from '../services/api';

const PIPELINE_STAGES = [
  {
    step: 1,
    name: 'User Query',
    cls: 'SearchEngine.java',
    method: 'search(rawQuery, language, algorithm, mode, searchMode)',
    role: 'Accepts raw multilingual text in Telugu, Hindi, Tamil, Bengali, or English.',
  },
  {
    step: 2,
    name: 'Unicode Normalization',
    cls: 'UnicodeUtil.java',
    method: 'normalize(text) -> Normalizer.Form.NFC',
    role: 'Decomposes and canonically recomposes Indic combining marks, viramas, and matras so visually identical character sequences compare equal.',
  },
  {
    step: 3,
    name: 'Tokenization & Case-Folding',
    cls: 'UnicodeUtil.java',
    method: 'tokenizeWithOffsets() / foldCase()',
    role: 'Case-folds Latin characters while preserving Indic scripts and exact string length. Identifies word boundaries preserving combining diacritics.',
  },
  {
    step: 4,
    name: 'Vocabulary Suffix-Trie Lookup',
    cls: 'TermSuffixTrie.java & Trie.java',
    method: 'suffixTrie.getTermsContaining(keyword)',
    role: 'Traverses the Trie in O(|keyword|) time to identify all dictionary terms containing the keyword stem, avoiding full dictionary iteration.',
  },
  {
    step: 5,
    name: 'Candidate Document Retrieval',
    cls: 'InvertedIndex.java',
    method: 'getCandidateDocumentsForAllContaining()',
    role: 'Fetches posting lists for matching vocabulary terms; intersects candidate document sets smallest-first (AND semantics), achieving 90%+ index reduction.',
  },
  {
    step: 6,
    name: 'Pattern Matching Algorithms',
    cls: 'KMP.java / RabinKarp.java / AhoCorasick.java / ZAlgorithm.java',
    method: 'KMP.search() / AhoCorasick.searchAll()',
    role: 'Runs exact character-level pattern matching only over candidate documents. Single keywords use KMP/RK/Z; multi-keywords use Aho-Corasick automaton in 1 pass.',
  },
  {
    step: 7,
    name: 'Relevance Scoring & Ranking',
    cls: 'RankingEngine.java',
    method: 'explainScore(doc, freq, keywords, exactMatch)',
    role: 'Transparent weighted scoring: Keyword Frequency (weight 4.0, cap 15) + Title Match (+20.0) + Exact Token (+10.0) + Multi-keyword Coverage (+15.0). Normalized 0–100%.',
  },
  {
    step: 8,
    name: 'Contextual Snippet Extraction',
    cls: 'SnippetExtractor.java',
    method: 'build(normalizedText, positionsByKeyword)',
    role: 'Selects up to 3 sentences with highest keyword density from normalized original-cased text; wraps matches in [[...]] delimiters.',
  },
  {
    step: 9,
    name: 'Ranked Result Delivery',
    cls: 'ApiServer.java & SearchEngine.java',
    method: 'handleSearch() -> JSON response',
    role: 'Serializes sorted results, highlights, explainable ranking scores, and execution metrics to the React client.',
  },
];

const FLOW_ALGOS = [
  { value: 'dinic', label: 'Dinic (Level Graph & Blocking Flow)' },
  { value: 'edmondskarp', label: 'Edmonds–Karp (BFS Shortest Path)' },
  { value: 'fordfulkerson', label: 'Ford–Fulkerson (DFS Augmenting Path)' },
];

export default function Flow() {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'network'

  // Network Flow State
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('all');
  const [algorithm, setAlgorithm] = useState('dinic');
  const [demand, setDemand] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function runFlow(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    getFlow({ query: query.trim(), language, algorithm, demand })
      .then(setData)
      .catch((err) => { setData(null); setError(err.message); })
      .finally(() => setLoading(false));
  }

  return (
    <div className="shell" style={{ paddingTop: 56, paddingBottom: 96 }}>
      <p className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>dsa architecture & viva flow</p>
      <h1 style={{ fontSize: 34, marginTop: 10, marginBottom: 16 }}>System Architecture & Workflow</h1>
      <p style={{ marginBottom: 28, maxWidth: 740, lineHeight: 1.6 }}>
        Understand the complete search engine pipeline from raw query input to ranked results,
        and explore bipartite keyword-document network flow analysis (CO4).
      </p>

      {/* View Switcher Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={activeTab === 'pipeline' ? 'btn' : 'btn btn-ghost'}
        >
          1. End-to-End Search Pipeline (Viva Guide)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('network')}
          className={activeTab === 'network' ? 'btn' : 'btn btn-ghost'}
        >
          2. Keyword–Document Network Flow (CO4)
        </button>
      </div>

      {activeTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Visual Architecture Pipeline */}
          <div className="panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>Search Execution Pipeline</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
              Demonstrates how classical Data Structures & Algorithms process every search without external search libraries.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {PIPELINE_STAGES.map((s, idx) => (
                <div key={s.step} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      className="mono"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--saffron)',
                        color: '#1a1408',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                      }}
                    >
                      {s.step}
                    </div>
                    {idx < PIPELINE_STAGES.length - 1 && (
                      <div style={{ width: 2, height: 42, background: 'var(--line)', margin: '4px 0' }} />
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1,
                      padding: '14px 18px',
                      background: 'var(--panel-raised)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                      <h4 style={{ fontSize: 16, color: 'var(--paper)' }}>{s.name}</h4>
                      <span className="mono badge badge-teal" style={{ fontSize: 12 }}>
                        {s.cls} → {s.method}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--paper-dim)' }}>
                      {s.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div>
          <div className="panel" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Bipartite Matching & Flow Capacity</h3>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--paper-dim)' }}>
              Source → keyword nodes → document nodes → sink. An edge (keyword → document) exists when the inverted index confirms the document contains the term. Max Flow computes the maximum number of keywords that can each be paired with a distinct document under the requested capacity constraint.
            </p>
          </div>

          <form onSubmit={runFlow} className="panel" style={{ padding: 24, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 90px auto', gap: 16, alignItems: 'end', marginBottom: 40 }}>
            <div>
              <label className="field-label" htmlFor="fq">Keywords (space-separated)</label>
              <input id="fq" type="text" className="indic" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="india water river" />
            </div>
            <div>
              <label className="field-label" htmlFor="fl">Language</label>
              <select id="fl" value={language} onChange={(e) => setLanguage(e.target.value)}>
                {['all', 'english', 'telugu', 'hindi', 'tamil', 'bengali'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="fa">Flow Algorithm</label>
              <select id="fa" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
                {FLOW_ALGOS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="fd">Demand</label>
              <input id="fd" type="number" min="1" max="50" value={demand} onChange={(e) => setDemand(Number(e.target.value) || 1)} style={{ width: '100%', padding: '10px 12px', background: 'var(--panel-raised)', border: '1px solid var(--line)', color: 'var(--paper)' }} />
            </div>
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Running…' : 'Analyse'}</button>
          </form>

          {error && <p style={{ color: 'var(--maroon)' }}>{error}</p>}

          {data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="panel" style={{ padding: 24, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <Stat label="Keyword nodes" value={data.keywordNodes} />
                <Stat label="Document nodes" value={data.documentNodes} />
                <Stat label="Keyword→doc edges" value={data.keywordDocumentEdges} />
                <Stat label="Total edges" value={data.totalEdges} />
                <Stat label="Max flow" value={`${data.maxFlow} / ${data.requestedFlow}`} accent />
                <Stat label="Min-cut capacity" value={data.minCut.capacity} />
                <Stat label={data.algorithm} value={`${data.executionTimeMs} ms`} />
              </div>

              <div className="panel" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Algorithm Comparison on Same Network</h3>
                {data.algorithmRuns.map((r) => (
                  <div key={r.algorithm} className="mono" style={{ fontSize: 13, padding: '4px 0' }}>
                    {r.algorithm}: max-flow {r.maxFlow} · {r.augmentationsOrPhases} augmentations/phases · {r.executionTimeMs} ms
                  </div>
                ))}
              </div>

              {data.unmatchedKeywords.length > 0 && (
                <div className="panel" style={{ padding: 24, borderColor: 'var(--maroon)' }}>
                  <h3 style={{ fontSize: 16, marginBottom: 12 }}>Bottleneck Keywords (Min-Cut S-Side)</h3>
                  {data.unmatchedKeywords.map((u) => (
                    <div key={u.keyword} className="mono" style={{ fontSize: 13 }}>
                      {u.keyword}: assigned {u.assigned} of {u.demand} · only {u.documentsContainingKeyword} document(s) contain it
                    </div>
                  ))}
                </div>
              )}

              <div className="panel" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Matching Witness Pairs ({data.matchingSize} pairs)</h3>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {data.matching.map((m, i) => (
                    <div key={i} className="mono indic" style={{ fontSize: 13, padding: '3px 0' }}>
                      {m.keyword} → {m.title} <span style={{ color: 'var(--muted)' }}>({m.documentId})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div className="mono" style={{ fontSize: 15, color: accent ? 'var(--saffron)' : 'var(--paper)' }}>{value}</div>
    </div>
  );
}

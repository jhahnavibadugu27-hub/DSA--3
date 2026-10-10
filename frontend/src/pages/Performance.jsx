import { useState } from 'react';
import { getPerformance } from '../services/api';

const LANGUAGES = [
  { value: 'all', label: 'All languages' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'english', label: 'English' },
];

const BAR_COLOR = {
  Naive: 'var(--maroon)',
  KMP: 'var(--saffron)',
  'Rabin-Karp': 'var(--teal)',
  'Z-Algorithm': '#6fbf73',
  'Aho-Corasick': '#8f7fe0',
};

const COMPLEXITIES = {
  Naive: { time: 'O(n × m)', space: 'O(1)', desc: 'Brute-force baseline; backs up text pointer on mismatch.' },
  KMP: { time: 'O(n + m)', space: 'O(m)', desc: 'Longest Proper Prefix/Suffix (LPS) failure function avoids backwards text scan.' },
  'Rabin-Karp': { time: 'O(n + m) avg', space: 'O(1)', desc: 'Rolling polynomial hash modulo 10⁹+7 with explicit character collision verification.' },
  'Z-Algorithm': { time: 'O(n + m)', space: 'O(n + m)', desc: 'Z-box rightmost prefix window on pattern + SEP + text.' },
  'Aho-Corasick': { time: 'O(n + z)', space: 'O(∑|P|)', desc: 'Trie automaton with BFS failure links; scans all keywords in 1 pass.' },
};

const QUICK_BENCHMARKS = [
  { label: 'భారతదేశం (Telugu)', query: 'భారతదేశం', lang: 'telugu' },
  { label: 'भारत (Hindi)', query: 'भारत', lang: 'hindi' },
  { label: 'இந்தியா (Tamil)', query: 'இந்தியா', lang: 'tamil' },
  { label: 'India (English)', query: 'india', lang: 'english' },
  { label: 'Multi: india water', query: 'india water', lang: 'english' },
];

export default function Performance() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('all');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function runComparison(searchQuery = query, searchLang = language) {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    getPerformance({ query: searchQuery.trim(), language: searchLang })
      .then(setData)
      .catch((e2) => setError(e2.message))
      .finally(() => setLoading(false));
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    runComparison();
  }

  function handleQuick(qb) {
    setQuery(qb.query);
    setLanguage(qb.lang);
    runComparison(qb.query, qb.lang);
  }

  const maxTime = data ? Math.max(...data.comparison.map((c) => c.executionTimeMs), 0.001) : 0;
  const naiveRow = data?.comparison?.find((r) => r.algorithm === 'Naive');
  const naiveTime = naiveRow?.executionTimeMs || 0;

  return (
    <div className="shell" style={{ paddingTop: 56, paddingBottom: 96 }}>
      <p className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>dsa benchmarking · live timing</p>
      <h1 style={{ fontSize: 34, marginTop: 10, marginBottom: 12 }}>
        Pattern Matching Performance Comparison
      </h1>
      <p style={{ maxWidth: 720, lineHeight: 1.6, marginBottom: 28 }}>
        Measures real runtime in milliseconds via <code className="mono">System.nanoTime()</code> across
        candidate documents identified by the Inverted Index. Compare the baseline Naive algorithm against
        KMP, Rabin-Karp, Z-Algorithm, and Aho-Corasick.
      </p>

      {/* Benchmark query form */}
      <form onSubmit={handleFormSubmit} className="panel" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px auto', gap: 16, alignItems: 'end' }}>
          <div>
            <label className="field-label" htmlFor="pq">Keyword or Multi-Keyword Query</label>
            <input
              id="pq"
              type="text"
              className="indic"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="తెలుగు, भारत, water, india…"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="pl">Corpus Language</label>
            <select id="pl" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit" disabled={loading || !query.trim()}>
            {loading ? 'Benchmarking…' : 'Run Benchmark'}
          </button>
        </div>

        {/* Quick benchmarks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Presets:</span>
          {QUICK_BENCHMARKS.map((qb) => (
            <button
              key={qb.label}
              type="button"
              className="btn btn-ghost btn-sm indic"
              onClick={() => handleQuick(qb)}
              style={{ fontSize: 12, padding: '4px 10px' }}
            >
              {qb.label}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="panel" style={{ padding: 20, marginBottom: 24, borderColor: 'var(--maroon)' }}>
          <p style={{ color: 'var(--maroon)' }}>{error}</p>
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Main Visualizer Bar Chart */}
          <div className="panel" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
              <div>
                <h3 style={{ fontSize: 20 }}>Measured Execution Time</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  Query: <strong className="indic" style={{ color: 'var(--saffron)' }}>"{data.query}"</strong> · Language: <strong>{data.language}</strong> · Candidates: <strong>{data.comparison[0]?.documentsScanned} of {data.comparison[0]?.totalDocuments}</strong> documents
                </p>
              </div>
              <span className="mono" style={{ fontSize: 12, color: 'var(--teal)' }}>
                System.nanoTime() · Zero Hardcoded Data
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {data.comparison.map((row) => {
                const isNaive = row.algorithm === 'Naive';
                const speedup = !isNaive && row.executionTimeMs > 0 && naiveTime > 0
                  ? (naiveTime / row.executionTimeMs).toFixed(2)
                  : null;

                return (
                  <div key={row.algorithm}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13, marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--paper)' }}>{row.algorithm}</span>
                        {speedup && Number(speedup) >= 1 && (
                          <span className="badge badge-teal mono" style={{ fontSize: 11 }}>
                            {speedup}x speedup vs Naive
                          </span>
                        )}
                        {isNaive && (
                          <span className="badge badge-ghost mono" style={{ fontSize: 11 }}>
                            Baseline (1.0x)
                          </span>
                        )}
                      </div>
                      <div className="mono" style={{ color: 'var(--paper-dim)' }}>
                        <strong style={{ color: 'var(--paper)' }}>{row.executionTimeMs} ms</strong>
                        {' · '}{row.matches} match{row.matches === 1 ? '' : 'es'}
                        {' · '}{row.documentsScanned} scanned
                        {' · '}<span style={{ color: 'var(--muted)' }}>{row.scope}</span>
                      </div>
                    </div>

                    {/* Progress / time bar */}
                    <div style={{ height: 12, background: 'var(--panel-raised)', border: '1px solid var(--line)', position: 'relative' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(3, (row.executionTimeMs / maxTime) * 100)}%`,
                          background: BAR_COLOR[row.algorithm] || 'var(--teal)',
                          transition: 'width 240ms ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Complexity & Theory Breakdown Table */}
          <div className="panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Theoretical vs Observed Complexity</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>
                    <th style={{ padding: '10px 12px' }}>Algorithm</th>
                    <th style={{ padding: '10px 12px' }}>Time Complexity</th>
                    <th style={{ padding: '10px 12px' }}>Space</th>
                    <th style={{ padding: '10px 12px' }}>Measured (ms)</th>
                    <th style={{ padding: '10px 12px' }}>Matches</th>
                    <th style={{ padding: '10px 12px' }}>Algorithmic Mechanism</th>
                  </tr>
                </thead>
                <tbody>
                  {data.comparison.map((row) => {
                    const info = COMPLEXITIES[row.algorithm] || { time: '—', space: '—', desc: '—' };
                    return (
                      <tr key={row.algorithm} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                          {row.algorithm}
                        </td>
                        <td className="mono" style={{ padding: '12px', color: 'var(--saffron)' }}>
                          {info.time}
                        </td>
                        <td className="mono" style={{ padding: '12px', color: 'var(--teal)' }}>
                          {info.space}
                        </td>
                        <td className="mono" style={{ padding: '12px', color: 'var(--paper)' }}>
                          {row.executionTimeMs} ms
                        </td>
                        <td className="mono" style={{ padding: '12px' }}>
                          {row.matches}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--paper-dim)', fontSize: 12 }}>
                          {info.desc}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!data && !error && (
        <div className="panel" style={{ padding: 36, color: 'var(--muted)', textAlign: 'center' }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>Ready to benchmark pattern matching algorithms.</p>
          <p style={{ fontSize: 13 }}>Select a preset keyword or enter any Indian language text above to record live nano-second benchmarks.</p>
        </div>
      )}
    </div>
  );
}

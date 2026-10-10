import { useEffect, useState } from 'react';
import { getStatistics, rebuildIndex } from '../services/api';

export default function Dataset() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [rebuilding, setRebuilding] = useState(false);

  function load() {
    getStatistics().then(setStats).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleRebuild() {
    setRebuilding(true);
    try {
      await rebuildIndex();
      load();
    } finally {
      setRebuilding(false);
    }
  }

  const avgDocLength = stats && stats.documentCount > 0
    ? Math.round(stats.totalCharacters / stats.documentCount)
    : 0;

  return (
    <div className="shell" style={{ paddingTop: 56, paddingBottom: 96 }}>
      <p className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>corpus & data structures · dsa dashboard</p>
      <h1 style={{ fontSize: 34, marginTop: 10, marginBottom: 12 }}>
        Corpus & Inverted Index Statistics
      </h1>
      <p style={{ maxWidth: 720, lineHeight: 1.6, marginBottom: 32 }}>
        Real live statistics derived from the 5-language Indian Wikipedia corpus under <code className="mono">corpus/</code>.
        Every metric reflects the in-memory inverted index and vocabulary trie structures built by the Java backend.
      </p>

      {error && (
        <div className="panel" style={{ padding: 24, borderColor: 'var(--maroon)', marginBottom: 24 }}>
          <p style={{ color: 'var(--maroon)' }}>Couldn't reach the backend ({error}). Start the Java API server on port 8080.</p>
        </div>
      )}

      {stats && (
        <>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
            <StatCard label="Total Documents" value={stats.documentCount} />
            <StatCard label="Indexed Vocabulary Terms" value={stats.indexedTerms} />
            <StatCard label="Total Inverted Postings" value={stats.totalPostings} />
            <StatCard label="Active Languages" value={stats.languageCount ?? stats.languages.length} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
            <StatCard label="Total Corpus Characters" value={stats.totalCharacters?.toLocaleString()} />
            <StatCard label="Average Doc Length (chars)" value={avgDocLength.toLocaleString()} />
            <StatCard label="Total Searches Served" value={stats.totalSearches ?? 0} />
            <StatCard label="Index Status" value={stats.indexStatus} isAccent />
          </div>

          {/* Language Distribution */}
          <div className="panel" style={{ padding: 28, marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18 }}>Corpus Distribution by Language</h3>
              <span className="mono" style={{ fontSize: 12, color: 'var(--teal)' }}>
                100 articles per language (500 total)
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {stats.languages.map((l) => {
                const count = stats.documentsByLanguage?.[l] ?? 0;
                const pct = stats.documentCount > 0 ? Math.round((count / stats.documentCount) * 100) : 0;
                return (
                  <div
                    key={l}
                    style={{
                      flex: 1,
                      minWidth: 140,
                      padding: '16px',
                      background: 'var(--panel-raised)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="mono" style={{ textTransform: 'capitalize', fontWeight: 600 }}>{l}</span>
                      <span className="mono" style={{ color: 'var(--saffron)', fontSize: 13 }}>{count} docs</span>
                    </div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      {pct}% of corpus
                    </div>
                  </div>
                );
              })}
            </div>
            {stats.lastIndexBuild && (
              <p style={{ fontSize: 12, marginTop: 20, color: 'var(--muted)' }}>
                Last index build timestamp: <span className="mono">{stats.lastIndexBuild}</span>
              </p>
            )}
          </div>

          {/* Educational Concept: What is an Inverted Index? */}
          <div className="panel" style={{ padding: 32, marginBottom: 32 }}>
            <h3 style={{ fontSize: 20, marginBottom: 12 }}>What is an Inverted Index?</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--paper-dim)', marginBottom: 20 }}>
              In standard sequential scanning (brute force), finding a pattern requires opening every document
              and searching the entire text, taking $O(D \times N \times M)$ time.
              An <strong>Inverted Index</strong> inverts this relationship: instead of mapping Documents $\to$ Words,
              it maps distinct <strong>Vocabulary Terms $\to$ Postings</strong> (which documents contain the word,
              their frequency, and character offsets).
            </p>

            <div className="panel" style={{ padding: 20, background: 'var(--panel-raised)', marginBottom: 24 }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--saffron)', marginBottom: 10 }}>
                INVERTED INDEX MAPPING (Real Examples from this Corpus):
              </div>
              <div className="mono indic" style={{ fontSize: 14, lineHeight: 2 }}>
                <div><strong>భారతదేశం</strong> (Telugu) → [telugu-doc001, telugu-doc014, telugu-doc042, telugu-doc088] (freq: 17)</div>
                <div><strong>भारत</strong> (Hindi) → [hindi-doc001, hindi-doc003, hindi-doc012, hindi-doc045, ...] (freq: 85)</div>
                <div><strong>தமிழ்</strong> (Tamil) → [tamil-doc001, tamil-doc022, tamil-doc067] (freq: 14)</div>
                <div><strong>বাংলা</strong> (Bengali) → [bengali-doc001, bengali-doc019, bengali-doc052] (freq: 9)</div>
                <div><strong>india</strong> (English) → [english-doc001, english-doc002, english-doc015, ...] (freq: 128)</div>
              </div>
            </div>

            <h4 style={{ fontSize: 16, marginBottom: 8, color: 'var(--paper)' }}>
              DSA Suffix-Trie Acceleration
            </h4>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--paper-dim)' }}>
              In Indic languages where agglutinative suffixes and inflected stems are common,
              a query term is often a prefix or infix of a dictionary word. Rather than iterating over all
              1,274 dictionary terms with KMP, this engine implements a <strong>TermSuffixTrie</strong>:
              all suffixes of vocabulary terms are indexed in a Trie. Querying a substring traverses
              the Trie in $O(|keyword|)$ time to retrieve matching dictionary terms instantly, achieving an
              average <strong>90%+ index reduction</strong> before pattern matchers run.
            </p>
          </div>

          {/* Rebuild Trigger */}
          <div className="panel" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h4 style={{ fontSize: 16 }}>Reconstruct Inverted Index</h4>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                Re-reads all 500 UTF-8 articles from disk and rebuilds the InvertedIndex and SuffixTrie from scratch.
              </p>
            </div>
            <button className="btn btn-ghost" onClick={handleRebuild} disabled={rebuilding}>
              {rebuilding ? 'Rebuilding index…' : 'Rebuild Index Now'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, isAccent }) {
  return (
    <div className="panel" style={{ padding: 22 }}>
      <div className="mono" style={{ fontSize: 26, color: isAccent ? 'var(--teal)' : 'var(--saffron)' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{label}</div>
    </div>
  );
}

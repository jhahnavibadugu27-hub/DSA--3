import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getDocument } from '../services/api';

export default function DocumentViewer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('query') || '';

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getDocument(id, query)
      .then((data) => {
        setDoc(data);
        setCurrentMatchIndex(0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, query]);

  const keywords = useMemo(() => {
    if (doc?.keywords && doc.keywords.length > 0) return doc.keywords;
    if (!query.trim()) return [];
    return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  }, [doc, query]);

  const { segments, matchCount } = useMemo(() => {
    if (!doc?.content || keywords.length === 0) {
      return { segments: [{ text: doc?.content || '', isMatch: false, matchIndex: -1 }], matchCount: 0 };
    }

    const text = doc.content;
    const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!escaped) return { segments: [{ text, isMatch: false, matchIndex: -1 }], matchCount: 0 };

    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    let matchCounter = 0;
    const segs = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      const isMatch = keywords.some((k) => k.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        segs.push({ text: part, isMatch: true, matchIndex: matchCounter++ });
      } else {
        segs.push({ text: part, isMatch: false, matchIndex: -1 });
      }
    }

    return { segments: segs, matchCount: matchCounter };
  }, [doc, keywords]);

  useEffect(() => {
    if (matchCount === 0 || !contentRef.current) return;
    const el = contentRef.current.querySelector(`[data-match-idx="${currentMatchIndex}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatchIndex, matchCount]);

  function handlePrev() {
    if (matchCount === 0) return;
    setCurrentMatchIndex((prev) => (prev > 0 ? prev - 1 : matchCount - 1));
  }

  function handleNext() {
    if (matchCount === 0) return;
    setCurrentMatchIndex((prev) => (prev < matchCount - 1 ? prev + 1 : 0));
  }

  return (
    <div className="shell" style={{ paddingTop: 48, paddingBottom: 96, maxWidth: 860 }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 20 }}
      >
        ← Back to Results
      </button>

      {loading && <p>Loading document…</p>}
      {error && (
        <div className="panel" style={{ padding: 24, borderColor: 'var(--maroon)' }}>
          <p style={{ color: 'var(--maroon)' }}>Error: {error}</p>
        </div>
      )}

      {doc && !loading && !error && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span className="badge badge-teal" style={{ textTransform: 'capitalize' }}>{doc.language}</span>
                <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>{doc.id}</span>
              </div>
              <h1 style={{ fontSize: 32 }}>{doc.title}</h1>
            </div>
          </div>

          {/* Navigation bar */}
          <div className="panel doc-toolbar" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--paper-dim)' }}>
                Search Query: <strong className="indic" style={{ color: 'var(--saffron)' }}>{query || '—'}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="mono" style={{ fontSize: 13 }}>
                {matchCount > 0 ? `Matches: ${currentMatchIndex + 1} / ${matchCount}` : '0 matches'}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handlePrev}
                  disabled={matchCount === 0}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleNext}
                  disabled={matchCount === 0}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Full content */}
          <div className="panel" style={{ padding: 32 }} ref={contentRef}>
            <div className="indic doc-text-flow" style={{ fontSize: 16, lineHeight: 1.8 }}>
              {segments.map((seg, idx) => {
                if (seg.isMatch) {
                  const isActive = seg.matchIndex === currentMatchIndex;
                  return (
                    <mark
                      key={idx}
                      data-match-idx={seg.matchIndex}
                      className={`doc-highlight ${isActive ? 'doc-highlight-active' : ''}`}
                    >
                      {seg.text}
                    </mark>
                  );
                }
                return <span key={idx}>{seg.text}</span>;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

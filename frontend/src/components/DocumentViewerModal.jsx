import { useEffect, useState, useRef, useMemo } from 'react';
import { getDocument } from '../services/api';

export default function DocumentViewerModal({ documentId, initialQuery = '', onClose }) {
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    getDocument(documentId, initialQuery)
      .then((data) => {
        setDoc(data);
        setCurrentMatchIndex(0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [documentId, initialQuery]);

  // Extract query keywords
  const keywords = useMemo(() => {
    if (doc?.keywords && doc.keywords.length > 0) return doc.keywords;
    if (!initialQuery.trim()) return [];
    return initialQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  }, [doc, initialQuery]);

  // Segment content and identify matching spans
  const { segments, matchCount } = useMemo(() => {
    if (!doc?.content || keywords.length === 0) {
      return { segments: [{ text: doc?.content || '', isMatch: false, matchIndex: -1 }], matchCount: 0 };
    }

    const text = doc.content;
    // Build regex that finds any of the keywords case-insensitively while preserving Unicode
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

  // Scroll to active match
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog document-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span className="badge badge-teal">{doc?.language || 'Language'}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                {documentId}
              </span>
            </div>
            <h2 style={{ fontSize: 22 }}>{doc?.title || 'Loading document…'}</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Match Navigation Toolbar */}
        <div className="doc-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--paper-dim)' }}>
              Query: <strong className="indic" style={{ color: 'var(--saffron)' }}>{initialQuery || '—'}</strong>
            </span>
            {keywords.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                ({keywords.length} keyword{keywords.length > 1 ? 's' : ''})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mono" style={{ fontSize: 13, color: matchCount > 0 ? 'var(--paper)' : 'var(--muted)' }}>
              {matchCount > 0 ? `Match ${currentMatchIndex + 1} of ${matchCount}` : '0 matches'}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handlePrev}
                disabled={matchCount === 0}
                title="Previous match"
              >
                ▲ Previous
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleNext}
                disabled={matchCount === 0}
                title="Next match"
              >
                ▼ Next
              </button>
            </div>
          </div>
        </div>

        {/* Document Content View */}
        <div className="modal-body doc-content-body" ref={contentRef}>
          {loading && <p style={{ padding: 24, color: 'var(--muted)' }}>Loading document text…</p>}
          {error && <p style={{ padding: 24, color: 'var(--maroon)' }}>Failed to load document: {error}</p>}
          {doc && !loading && !error && (
            <div className="indic doc-text-flow">
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
          )}
        </div>

        <div className="modal-footer">
          <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
            Rendered from original document text with lossless Unicode preservation
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

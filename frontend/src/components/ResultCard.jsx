import SnippetText from './SnippetText';

export default function ResultCard({
  result,
  index,
  searchMeta,
  onViewDocument,
  onHowSearchWorked,
  onHowRanked,
}) {
  const algo = (searchMeta?.algorithm || 'KMP').toUpperCase();
  const execTime = searchMeta?.executionTimeMs ?? 0;
  const scanned = searchMeta?.documentsScanned ?? 0;
  const total = searchMeta?.totalDocuments ?? 500;

  return (
    <article className="panel result-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span className="mono result-number-badge">
            Result #{index + 1}
          </span>
          <h3 style={{ fontSize: 20, color: 'var(--paper)' }}>{result.title}</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-teal" style={{ textTransform: 'capitalize' }}>
            Language: {result.language}
          </span>
          <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
            {result.documentId}
          </span>
        </div>
      </div>

      {/* Snippet with highlighted terms */}
      <div className="indic result-snippet" style={{ marginTop: 14, marginBottom: 16 }}>
        <SnippetText text={result.snippet} />
      </div>

      {/* Technical metrics grid */}
      <div className="result-metrics-grid">
        <div className="result-metric-item">
          <span className="result-metric-label">Relevance</span>
          <span className="mono result-metric-value" style={{ color: 'var(--saffron)' }}>
            {result.score}%
          </span>
        </div>
        <div className="result-metric-item">
          <span className="result-metric-label">Matches</span>
          <span className="mono result-metric-value">
            {result.matchCount}
          </span>
        </div>
        <div className="result-metric-item">
          <span className="result-metric-label">Algorithm</span>
          <span className="mono result-metric-value" style={{ color: 'var(--teal)' }}>
            {algo}
          </span>
        </div>
        <div className="result-metric-item">
          <span className="result-metric-label">Time</span>
          <span className="mono result-metric-value">
            {execTime} ms
          </span>
        </div>
        <div className="result-metric-item">
          <span className="result-metric-label">Documents</span>
          <span className="mono result-metric-value">
            {scanned} / {total}
          </span>
        </div>
      </div>

      {/* Matched keywords breakdown */}
      {result.matchedKeywords && result.matchedKeywords.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12, fontSize: 12 }}>
          <span style={{ color: 'var(--muted)' }}>Matched keywords:</span>
          {result.matchedKeywords.map((kw) => (
            <span key={kw} className="mono badge badge-ghost" style={{ fontSize: 11 }}>
              {kw} {result.keywordFrequencies && result.keywordFrequencies[kw] ? `(${result.keywordFrequencies[kw]})` : ''}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="result-actions" style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onViewDocument(result.documentId)}
        >
          View Document
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onHowSearchWorked && onHowSearchWorked()}
        >
          How Search Worked
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onHowRanked && onHowRanked(result, index)}
        >
          How Ranked
        </button>
      </div>
    </article>
  );
}

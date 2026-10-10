export default function HowRankedModal({ result, rankIndex, onClose }) {
  if (!result) return null;

  const explanation = result.rankingExplanation || {};
  const {
    frequencyScore = 0,
    titleMatchBonus = 0,
    exactMatchBonus = 0,
    coverageBonus = 0,
    rawScore = 0,
    finalScore = result.score || 0,
    totalFrequency = result.matchCount || 0,
    titleMatch = false,
    exactMatchFound = false,
    coveragePercent = 100,
  } = explanation;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog ranking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span className="badge badge-saffron">Relevance Score Breakdown</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                Result #{rankIndex + 1}
              </span>
            </div>
            <h2 style={{ fontSize: 20 }}>Why this result ranked #{rankIndex + 1} ({finalScore}%)</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>DOCUMENT TITLE</div>
            <h3 style={{ fontSize: 17, color: 'var(--paper)' }}>{result.title}</h3>
            <span className="mono" style={{ fontSize: 12, color: 'var(--teal)', textTransform: 'capitalize' }}>
              {result.language} · ID: {result.documentId}
            </span>
          </div>

          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--paper-dim)', marginBottom: 20 }}>
            The ranking engine scores documents using transparent, deterministic factors rather than an opaque black box.
            Each component contributes to the final normalized score:
          </p>

          <div className="ranking-breakdown-list">
            <div className="ranking-breakdown-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--paper)' }}>Keyword Frequency Score</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {totalFrequency} total matches (diminishing-returns cap at 15 × 4.0 weight)
                </div>
              </div>
              <div className="mono" style={{ fontSize: 16, color: 'var(--saffron)' }}>
                +{frequencyScore}
              </div>
            </div>

            <div className="ranking-breakdown-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--paper)' }}>Document Title Match Bonus</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {titleMatch ? 'Query term occurs directly in the document title (+20.0 bonus)' : 'No title match (+0.0)'}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 16, color: titleMatch ? 'var(--teal)' : 'var(--muted)' }}>
                +{titleMatchBonus}
              </div>
            </div>

            <div className="ranking-breakdown-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--paper)' }}>Exact Whole-Word Match Bonus</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {exactMatchFound ? 'Keyword appears as a discrete indexed term (+10.0 bonus)' : 'Inflected/substring match (+0.0)'}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 16, color: exactMatchFound ? 'var(--teal)' : 'var(--muted)' }}>
                +{exactMatchBonus}
              </div>
            </div>

            <div className="ranking-breakdown-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--paper)' }}>Multi-Keyword Coverage Bonus</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Matches {coveragePercent}% of required keywords (up to +15.0)
                </div>
              </div>
              <div className="mono" style={{ fontSize: 16, color: 'var(--saffron)' }}>
                +{coverageBonus}
              </div>
            </div>
          </div>

          {/* Formula Summary Box */}
          <div className="panel" style={{ padding: 18, marginTop: 20, background: 'var(--panel-raised)' }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
              SCORING FORMULA
            </div>
            <div className="mono" style={{ fontSize: 13, color: 'var(--paper)', lineHeight: 1.6 }}>
              Raw Score = {frequencyScore} + {titleMatchBonus} + {exactMatchBonus} + {coverageBonus} = <strong>{rawScore}</strong>
            </div>
            <div className="mono" style={{ fontSize: 13, color: 'var(--paper)', marginTop: 4 }}>
              Normalized = min(100, ({rawScore} / 105.0) × 100) = <strong style={{ color: 'var(--saffron)' }}>{finalScore}%</strong>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

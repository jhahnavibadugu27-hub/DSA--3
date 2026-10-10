import { useState, useEffect } from 'react';
import { getEditDistance, getSequenceAlignment, getOptimalBST } from '../services/api';

export default function AlgorithmLab() {
  const [activeTab, setActiveTab] = useState('edit-distance');

  // Edit distance state
  const [s1, setS1] = useState('kitten');
  const [s2, setS2] = useState('sitting');
  const [editType, setEditType] = useState('wagner-fischer');
  const [insCost, setInsCost] = useState(1);
  const [delCost, setDelCost] = useState(1);
  const [subCost, setSubCost] = useState(1);
  const [transCost, setTransCost] = useState(1);
  const [editResult, setEditResult] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Alignment state
  const [seq1, setSeq1] = useState('GCATGCG');
  const [seq2, setSeq2] = useState('GATTACA');
  const [matchReward, setMatchReward] = useState(1);
  const [mismatchPenalty, setMismatchPenalty] = useState(-1);
  const [gapPenalty, setGapPenalty] = useState(-1);
  const [alignResult, setAlignResult] = useState(null);
  const [alignLoading, setAlignLoading] = useState(false);

  // OBST state
  const [obstKeys, setObstKeys] = useState('computer, data, engineering, india, network, research, science, technology');
  const [obstFreqs, setObstFreqs] = useState('10, 16, 15, 99, 9, 19, 12, 13');
  const [obstResult, setObstResult] = useState(null);
  const [obstLoading, setObstLoading] = useState(false);

  // Run initial queries
  useEffect(() => {
    runEditDistance();
    runAlignment();
    runOBST();
  }, []);

  const runEditDistance = async (customS1, customS2, customType) => {
    setEditLoading(true);
    try {
      const res = await getEditDistance({
        s1: customS1 !== undefined ? customS1 : s1,
        s2: customS2 !== undefined ? customS2 : s2,
        type: customType || editType,
        ins: insCost,
        del: delCost,
        sub: subCost,
        trans: transCost,
      });
      setEditResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setEditLoading(false);
    }
  };

  const runAlignment = async (customSeq1, customSeq2) => {
    setAlignLoading(true);
    try {
      const res = await getSequenceAlignment({
        seq1: customSeq1 !== undefined ? customSeq1 : seq1,
        seq2: customSeq2 !== undefined ? customSeq2 : seq2,
        match: matchReward,
        mismatch: mismatchPenalty,
        gap: gapPenalty,
      });
      setAlignResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setAlignLoading(false);
    }
  };

  const runOBST = async (customKeys, customFreqs) => {
    setObstLoading(false);
    try {
      const res = await getOptimalBST({
        keys: customKeys !== undefined ? customKeys : obstKeys,
        freqs: customFreqs !== undefined ? customFreqs : obstFreqs,
      });
      setObstResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setObstLoading(false);
    }
  };

  const isPathCell = (i, j, path) => {
    if (!path) return false;
    return path.some(([r, c]) => r === i && c === j);
  };

  return (
    <div className="shell" style={{ padding: '36px 0 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--saffron)', marginBottom: 6 }}>
          Advanced Algorithm Lab &bull; Dynamic Programming
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, margin: 0, fontWeight: 700 }}>
          Edit Distance, Alignment &amp; Optimal BST
        </h1>
        <p style={{ color: 'var(--paper-dim)', marginTop: 8, fontSize: 15, maxWidth: 840 }}>
          Interactive execution and step-by-step matrix visualization of Wagner-Fischer, Damerau-Levenshtein,
          Weighted Edit Distance, Needleman-Wunsch Global Sequence Alignment, and Optimal Binary Search Trees.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--line)', marginBottom: 28 }}>
        <button
          onClick={() => setActiveTab('edit-distance')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'edit-distance' ? '2px solid var(--saffron)' : '2px solid transparent',
            color: activeTab === 'edit-distance' ? 'var(--paper)' : 'var(--paper-dim)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          1. Edit Distance Suite
        </button>
        <button
          onClick={() => setActiveTab('alignment')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'alignment' ? '2px solid var(--saffron)' : '2px solid transparent',
            color: activeTab === 'alignment' ? 'var(--paper)' : 'var(--paper-dim)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          2. Needleman-Wunsch Alignment
        </button>
        <button
          onClick={() => setActiveTab('obst')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'obst' ? '2px solid var(--saffron)' : '2px solid transparent',
            color: activeTab === 'obst' ? 'var(--paper)' : 'var(--paper-dim)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          3. Optimal Binary Search Tree (OBST)
        </button>
      </div>

      {/* TAB 1: EDIT DISTANCE */}
      {activeTab === 'edit-distance' && (
        <div>
          {/* Controls */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 16 }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--paper-dim)', marginBottom: 4 }}>String 1 (Source)</label>
                <input
                  type="text"
                  value={s1}
                  onChange={(e) => setS1(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 4 }}
                />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--paper-dim)', marginBottom: 4 }}>String 2 (Target)</label>
                <input
                  type="text"
                  value={s2}
                  onChange={(e) => setS2(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 4 }}
                />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--paper-dim)', marginBottom: 4 }}>Algorithm Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 4 }}
                >
                  <option value="wagner-fischer">Wagner-Fischer (Levenshtein Matrix DP)</option>
                  <option value="damerau">Damerau-Levenshtein (Adjacent Transposition)</option>
                  <option value="weighted">Weighted Edit Distance</option>
                </select>
              </div>
              <button
                onClick={() => runEditDistance()}
                disabled={editLoading}
                style={{ padding: '9px 24px', background: 'var(--saffron)', color: '#000', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
              >
                {editLoading ? 'Computing...' : 'Calculate DP'}
              </button>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--paper-dim)' }}>Presets:</span>
              <button
                onClick={() => { setS1('kitten'); setS2('sitting'); setEditType('wagner-fischer'); runEditDistance('kitten', 'sitting', 'wagner-fischer'); }}
                style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 3, cursor: 'pointer' }}
              >
                kitten &harr; sitting (Wagner-Fischer)
              </button>
              <button
                onClick={() => { setS1('teh'); setS2('the'); setEditType('damerau'); runEditDistance('teh', 'the', 'damerau'); }}
                style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 3, cursor: 'pointer' }}
              >
                teh &harr; the (Damerau Transposition)
              </button>
              <button
                onClick={() => { setS1('compteur'); setS2('computer'); setEditType('damerau'); runEditDistance('compteur', 'computer', 'damerau'); }}
                style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 3, cursor: 'pointer' }}
              >
                compteur &harr; computer (Typo)
              </button>
              <button
                onClick={() => { setS1('భారత్'); setS2('భారతం'); setEditType('wagner-fischer'); runEditDistance('భారత్', 'భారతం', 'wagner-fischer'); }}
                style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 3, cursor: 'pointer' }}
              >
                భారత్ &harr; భారతం (Telugu Unicode)
              </button>
            </div>

            {/* Custom Costs if Weighted */}
            {editType === 'weighted' && (
              <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--paper-dim)' }}>Insert Cost: {insCost}</label>
                  <input type="range" min="0.1" max="5" step="0.1" value={insCost} onChange={(e) => setInsCost(parseFloat(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--paper-dim)' }}>Delete Cost: {delCost}</label>
                  <input type="range" min="0.1" max="5" step="0.1" value={delCost} onChange={(e) => setDelCost(parseFloat(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--paper-dim)' }}>Substitute Cost: {subCost}</label>
                  <input type="range" min="0.1" max="5" step="0.1" value={subCost} onChange={(e) => setSubCost(parseFloat(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--paper-dim)' }}>Transpose Cost: {transCost}</label>
                  <input type="range" min="0.1" max="5" step="0.1" value={transCost} onChange={(e) => setTransCost(parseFloat(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>
            )}
          </div>

          {/* Results Display */}
          {editResult && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: 24 }}>
              {/* Left Column: Summary and Edit Script */}
              <div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--paper-dim)', textTransform: 'uppercase' }}>Computed Distance</div>
                  <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--saffron)', margin: '6px 0' }}>{editResult.distance}</div>
                  <div style={{ fontSize: 13, color: 'var(--paper-dim)' }}>{editResult.algorithmName}</div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 20 }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Step-by-Step Edit Operations</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {editResult.operations && editResult.operations.map((op, idx) => {
                      let bg = 'rgba(255,255,255,0.05)';
                      let border = 'var(--line)';
                      let tag = 'OP';
                      if (op.startsWith('MATCH')) { bg = 'rgba(52,211,153,0.1)'; border = '#34d399'; tag = 'MATCH'; }
                      else if (op.startsWith('SUBSTITUTE')) { bg = 'rgba(251,191,36,0.1)'; border = '#fbbf24'; tag = 'SUB'; }
                      else if (op.startsWith('DELETE')) { bg = 'rgba(248,113,113,0.1)'; border = '#f87171'; tag = 'DEL'; }
                      else if (op.startsWith('INSERT')) { bg = 'rgba(96,165,250,0.1)'; border = '#60a5fa'; tag = 'INS'; }
                      else if (op.startsWith('TRANSPOSE')) { bg = 'rgba(192,132,252,0.1)'; border = '#c084fc'; tag = 'TRANSPOSE'; }

                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: bg, borderLeft: `3px solid ${border}`, borderRadius: 4, fontSize: 13 }}>
                          <span style={{ fontSize: 10, padding: '2px 6px', background: border, color: '#000', borderRadius: 3, fontWeight: 700 }}>{tag}</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{op}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Full Dynamic Programming Matrix */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 20, overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Dynamic Programming Table (M+1 &times; N+1)</h3>
                  <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>&bull; Green path = Optimal Backtracking Path</span>
                </div>
                <table style={{ borderCollapse: 'collapse', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>D[i][j]</th>
                      <th style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', color: 'var(--paper-dim)' }}>&empty;</th>
                      {editResult.targetChars && editResult.targetChars.map((ch, j) => (
                        <th key={j} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', color: 'var(--saffron)' }}>{ch}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editResult.matrix && editResult.matrix.map((row, i) => (
                      <tr key={i}>
                        <th style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', color: i === 0 ? 'var(--paper-dim)' : 'var(--saffron)' }}>
                          {i === 0 ? '\u2205' : editResult.sourceChars[i - 1]}
                        </th>
                        {row.map((val, j) => {
                          const inPath = isPathCell(i, j, editResult.path);
                          return (
                            <td
                              key={j}
                              style={{
                                padding: '8px 10px',
                                border: '1px solid var(--line)',
                                background: inPath ? 'rgba(52,211,153,0.2)' : 'transparent',
                                color: inPath ? '#34d399' : 'var(--paper)',
                                fontWeight: inPath ? 700 : 400,
                              }}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NEEDLEMAN-WUNSCH ALIGNMENT */}
      {activeTab === 'alignment' && (
        <div>
          {/* Controls */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 16 }}>
              <div style={{ flex: '1 1 240px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--paper-dim)', marginBottom: 4 }}>Sequence 1</label>
                <input
                  type="text"
                  value={seq1}
                  onChange={(e) => setSeq1(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 4, fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div style={{ flex: '1 1 240px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--paper-dim)', marginBottom: 4 }}>Sequence 2</label>
                <input
                  type="text"
                  value={seq2}
                  onChange={(e) => setSeq2(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 4, fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div style={{ width: 100 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--paper-dim)', marginBottom: 4 }}>Match (+)</label>
                <input
                  type="number"
                  value={matchReward}
                  onChange={(e) => setMatchReward(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 4 }}
                />
              </div>
              <div style={{ width: 100 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--paper-dim)', marginBottom: 4 }}>Mismatch (-)</label>
                <input
                  type="number"
                  value={mismatchPenalty}
                  onChange={(e) => setMismatchPenalty(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 4 }}
                />
              </div>
              <div style={{ width: 100 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--paper-dim)', marginBottom: 4 }}>Gap (-)</label>
                <input
                  type="number"
                  value={gapPenalty}
                  onChange={(e) => setGapPenalty(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 4 }}
                />
              </div>
              <button
                onClick={() => runAlignment()}
                disabled={alignLoading}
                style={{ padding: '9px 24px', background: 'var(--saffron)', color: '#000', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
              >
                {alignLoading ? 'Aligning...' : 'Global Align'}
              </button>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--paper-dim)' }}>Presets:</span>
              <button
                onClick={() => { setSeq1('GCATGCG'); setSeq2('GATTACA'); runAlignment('GCATGCG', 'GATTACA'); }}
                style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 3, cursor: 'pointer' }}
              >
                DNA: GCATGCG &harr; GATTACA
              </button>
              <button
                onClick={() => { setSeq1('ACACACTA'); setSeq2('AGCACACA'); runAlignment('ACACACTA', 'AGCACACA'); }}
                style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 3, cursor: 'pointer' }}
              >
                DNA: ACACACTA &harr; AGCACACA
              </button>
              <button
                onClick={() => { setSeq1('ALGORITHM'); setSeq2('LOGARITHM'); runAlignment('ALGORITHM', 'LOGARITHM'); }}
                style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 3, cursor: 'pointer' }}
              >
                Text: ALGORITHM &harr; LOGARITHM
              </button>
            </div>
          </div>

          {/* Results */}
          {alignResult && (
            <div>
              {/* Score Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--paper-dim)' }}>Alignment Score</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--saffron)', marginTop: 4 }}>{alignResult.score}</div>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--paper-dim)' }}>Sequence Identity</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#34d399', marginTop: 4 }}>{alignResult.identityPercent}%</div>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--paper-dim)' }}>Matches</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#34d399', marginTop: 4 }}>{alignResult.matchCount}</div>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--paper-dim)' }}>Mismatches</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24', marginTop: 4 }}>{alignResult.mismatchCount}</div>
                </div>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--paper-dim)' }}>Gaps Introduced</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#f87171', marginTop: 4 }}>{alignResult.gapCount}</div>
                </div>
              </div>

              {/* Aligned Representation Box */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 24, marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Pairwise Global Alignment Traceback</h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, background: '#0a0a0c', padding: 20, borderRadius: 6, lineHeight: 1.8, letterSpacing: '0.2em' }}>
                  <div style={{ color: 'var(--saffron)' }}>
                    <span style={{ fontSize: 11, color: 'var(--paper-dim)', marginRight: 16, display: 'inline-block', width: 60 }}>Seq 1:</span>
                    {alignResult.alignedSeq1}
                  </div>
                  <div style={{ color: '#34d399' }}>
                    <span style={{ fontSize: 11, color: 'var(--paper-dim)', marginRight: 16, display: 'inline-block', width: 60 }}>Match:</span>
                    {alignResult.alignmentMarkup}
                  </div>
                  <div style={{ color: '#60a5fa' }}>
                    <span style={{ fontSize: 11, color: 'var(--paper-dim)', marginRight: 16, display: 'inline-block', width: 60 }}>Seq 2:</span>
                    {alignResult.alignedSeq2}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--paper-dim)', marginTop: 12, display: 'flex', gap: 16 }}>
                  <span><strong style={{ color: '#34d399' }}>|</strong> = Exact Match</span>
                  <span><strong style={{ color: '#fbbf24' }}>*</strong> = Mismatch</span>
                  <span><strong style={{ color: '#f87171' }}>-</strong> = Insertion / Deletion Gap</span>
                </div>
              </div>

              {/* Scoring Matrix Table */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 20, overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Needleman-Wunsch Scoring Table S[i][j]</h3>
                <table style={{ borderCollapse: 'collapse', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>S[i][j]</th>
                      <th style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', color: 'var(--paper-dim)' }}>&empty;</th>
                      {alignResult.seq2Chars && alignResult.seq2Chars.map((ch, j) => (
                        <th key={j} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', color: 'var(--saffron)' }}>{ch}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alignResult.matrix && alignResult.matrix.map((row, i) => (
                      <tr key={i}>
                        <th style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', color: i === 0 ? 'var(--paper-dim)' : 'var(--saffron)' }}>
                          {i === 0 ? '\u2205' : alignResult.seq1Chars[i - 1]}
                        </th>
                        {row.map((val, j) => {
                          const inPath = isPathCell(i, j, alignResult.path);
                          return (
                            <td
                              key={j}
                              style={{
                                padding: '8px 10px',
                                border: '1px solid var(--line)',
                                background: inPath ? 'rgba(52,211,153,0.2)' : 'transparent',
                                color: inPath ? '#34d399' : 'var(--paper)',
                                fontWeight: inPath ? 700 : 400,
                              }}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OPTIMAL BINARY SEARCH TREE */}
      {activeTab === 'obst' && (
        <div>
          {/* Controls */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 16 }}>
              <div style={{ flex: '2 1 300px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--paper-dim)', marginBottom: 4 }}>Keys (Comma-separated)</label>
                <input
                  type="text"
                  value={obstKeys}
                  onChange={(e) => setObstKeys(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 4 }}
                />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--paper-dim)', marginBottom: 4 }}>Frequencies / Document Postings</label>
                <input
                  type="text"
                  value={obstFreqs}
                  onChange={(e) => setObstFreqs(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 4 }}
                />
              </div>
              <button
                onClick={() => runOBST()}
                disabled={obstLoading}
                style={{ padding: '9px 24px', background: 'var(--saffron)', color: '#000', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
              >
                {obstLoading ? 'Computing...' : 'Construct OBST'}
              </button>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--paper-dim)' }}>Presets:</span>
              <button
                onClick={() => {
                  const k = 'computer, data, engineering, india, network, research, science, technology';
                  const f = '10, 16, 15, 99, 9, 19, 12, 13';
                  setObstKeys(k); setObstFreqs(f); runOBST(k, f);
                }}
                style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 3, cursor: 'pointer' }}
              >
                Search Engine Corpus Top Terms
              </button>
              <button
                onClick={() => {
                  const k = 'k1, k2, k3, k4, k5';
                  const f = '15, 10, 5, 10, 20';
                  setObstKeys(k); setObstFreqs(f); runOBST(k, f);
                }}
                style={{ fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--line)', color: 'var(--paper)', borderRadius: 3, cursor: 'pointer' }}
              >
                CLRS Textbook 5-Key Example
              </button>
            </div>
          </div>

          {/* Results */}
          {obstResult && (
            <div>
              {/* Cost & InOrder Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 2fr', gap: 24, marginBottom: 24 }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--paper-dim)', textTransform: 'uppercase' }}>Expected Search Cost E[depth]</div>
                  <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--saffron)', margin: '6px 0' }}>{obstResult.expectedCost}</div>
                  <div style={{ fontSize: 13, color: 'var(--paper-dim)' }}>
                    Minimum average search comparisons required to locate query terms according to their empirical probability distribution.
                  </div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 20 }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 600 }}>Sorted In-Order Key Probabilities</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {obstResult.keys && obstResult.keys.map((k, idx) => (
                      <div key={idx} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', borderRadius: 4, fontSize: 13 }}>
                        <strong style={{ color: 'var(--saffron)' }}>{k}</strong>
                        <span style={{ color: 'var(--paper-dim)', marginLeft: 6, fontSize: 11 }}>({obstResult.frequencies[idx]}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tree Visualizer */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 24, marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Optimal BST Hierarchical Structure</h3>
                {obstResult.rootNode ? (
                  <div style={{ background: '#0a0a0c', padding: 20, borderRadius: 6, overflowX: 'auto' }}>
                    <TreeNode node={obstResult.rootNode} />
                  </div>
                ) : (
                  <div style={{ color: 'var(--paper-dim)' }}>No tree generated.</div>
                )}
              </div>

              {/* Root Selection Matrix */}
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 20, overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Root Selection Table (root[i][j])</h3>
                <p style={{ fontSize: 12, color: 'var(--paper-dim)', margin: '0 0 12px' }}>
                  Indicates which key index is chosen as the optimal subtree root for keys range [i .. j].
                </p>
                <table style={{ borderCollapse: 'collapse', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>i \ j</th>
                      {obstResult.keys && obstResult.keys.map((k, j) => (
                        <th key={j} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', color: 'var(--saffron)' }}>{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {obstResult.rootMatrix && obstResult.rootMatrix.map((row, i) => (
                      <tr key={i}>
                        <th style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', color: 'var(--saffron)' }}>
                          {obstResult.keys[i]}
                        </th>
                        {row.map((val, j) => (
                          <td
                            key={j}
                            style={{
                              padding: '8px 10px',
                              border: '1px solid var(--line)',
                              color: val >= 0 ? '#34d399' : 'var(--paper-dim)',
                              fontWeight: val >= 0 ? 600 : 400,
                            }}
                          >
                            {val >= 0 ? obstResult.keys[val] : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TreeNode({ node, isLeft }) {
  if (!node) return null;
  return (
    <div style={{ marginLeft: node.depth * 28, marginY: 6, borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, margin: '4px 0' }}>
        <span style={{ fontSize: 11, color: isLeft !== undefined ? (isLeft ? '#60a5fa' : '#c084fc') : 'var(--saffron)', fontWeight: 700 }}>
          {isLeft !== undefined ? (isLeft ? 'L:' : 'R:') : 'ROOT:'}
        </span>
        <strong style={{ color: 'var(--paper)' }}>{node.key}</strong>
        <span style={{ fontSize: 11, color: 'var(--paper-dim)' }}>freq: {node.probability}%</span>
        <span style={{ fontSize: 10, padding: '1px 5px', background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>depth {node.depth}</span>
      </div>
      {node.left && <TreeNode node={node.left} isLeft={true} />}
      {node.right && <TreeNode node={node.right} isLeft={false} />}
    </div>
  );
}

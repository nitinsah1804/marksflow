import React, { useState, useEffect } from 'react';
import { Sliders, X, Save, CheckCircle2 } from 'lucide-react';

export default function GradeCutoffsModal({
  isOpen,
  onClose,
  currentCourse,
  onCutoffsUpdated,
  showToast
}) {
  const [cutoffs, setCutoffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && currentCourse?.id) {
      fetchCutoffs(currentCourse.id);
    }
  }, [isOpen, currentCourse?.id]);

  const fetchCutoffs = async (crsId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${crsId}/grade-cutoffs`);
      if (!res.ok) throw new Error('Failed to load grade cutoffs');
      const data = await res.json();
      setCutoffs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCutoffChange = (index, val) => {
    const num = parseFloat(val);
    setCutoffs((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, min_percentage: isNaN(num) ? 0 : num } : c))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${currentCourse.id}/grade-cutoffs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cutoffs })
      });

      if (!res.ok) throw new Error('Failed to update cutoffs');

      if (showToast) showToast('Grade boundaries updated & marks recalculated!', 'success');
      onClose();
      if (onCutoffsUpdated) onCutoffsUpdated();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sliders size={20} style={{ color: 'var(--primary)' }} />
            Configure Grade Cutoffs & Boundaries
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Define the minimum percentage required for each letter grade on the university 10-point scale.
          </p>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading cutoffs...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {cutoffs.map((item, idx) => (
                <div
                  key={item.grade}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      className="badge badge-blue"
                      style={{ width: '38px', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', justifyContent: 'center' }}
                    >
                      {item.grade}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.description}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Grade Point: {item.grade_point} / 10
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>&gt;=</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      className="input"
                      style={{ width: '75px', textAlign: 'center', fontWeight: 700 }}
                      value={item.min_percentage}
                      onChange={(e) => handleCutoffChange(idx, e.target.value)}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save & Recalculate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Lock, Unlock, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function LockModal({
  isOpen,
  onClose,
  currentCourse,
  currentUser,
  onStatusChanged,
  showToast
}) {
  const isLocked = currentCourse?.is_locked;
  const [reason, setReason] = useState(
    isLocked
      ? 'Unfreezing requested by HOD for authorized grievance correction'
      : 'Final internal marks verified and frozen for institutional End-Semester exam cell transmission'
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !currentCourse) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      if (showToast) showToast('Please enter an audit reason', 'error');
      return;
    }

    setSubmitting(true);
    const endpoint = isLocked
      ? `/api/courses/${currentCourse.id}/unlock`
      : `/api/courses/${currentCourse.id}/lock`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || 'usr-fac-1',
          user_name: currentUser?.name || 'Dr. Snehlata Wankhade',
          user_role: currentUser?.role || 'faculty',
          reason: reason
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Lock operation failed');
      }

      if (showToast) {
        showToast(
          `Marks successfully ${isLocked ? 'Unlocked' : 'Frozen & Locked'}!`,
          'success'
        );
      }
      onClose();
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {isLocked ? (
              <Unlock size={20} style={{ color: 'var(--emerald)' }} />
            ) : (
              <Lock size={20} style={{ color: 'var(--rose)' }} />
            )}
            {isLocked ? 'Unlock Internal Marks' : 'Freeze & Lock Marks'}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isLocked ? 'var(--emerald-light)' : 'var(--rose-light)',
              color: isLocked ? 'var(--emerald)' : 'var(--rose)',
              border: `1px solid ${isLocked ? 'var(--emerald-border)' : 'var(--rose-border)'}`,
              fontSize: '0.85rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}
          >
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              {isLocked ? (
                <>Unlocking will re-enable manual mark edits and Excel uploads for instructors.</>
              ) : (
                <>Freezing marks ensures tamper protection. Instructors will not be able to edit scores without explicit unfreeze approval.</>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Audit Justification / Reason (Required):</label>
            <textarea
              className="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State justification..."
            />
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Action will be recorded as <strong>{currentUser?.name}</strong> ({currentUser?.role}).
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${isLocked ? 'btn-emerald' : 'btn-danger'}`}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Updating...' : isLocked ? 'Confirm Unlock' : 'Confirm Freeze'}
          </button>
        </div>
      </div>
    </div>
  );
}

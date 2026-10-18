import React, { useState } from 'react';
import { PlusCircle, X, BookOpen } from 'lucide-react';

export default function NewCourseModal({
  isOpen,
  onClose,
  currentUser,
  onCourseCreated,
  showToast
}) {
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    department: 'Department of Computer Science & Engineering, SIT Nagpur',
    semester: 'B.Tech CSE - Semester IV',
    credits: 4
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.title.trim()) {
      if (showToast) showToast('Course code and title are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          instructor_id: currentUser?.id || 'usr-fac-1'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to create course');
      }

      const newCourse = await res.json();
      if (showToast) showToast(`Course ${newCourse.code} created!`, 'success');
      onClose();
      if (onCourseCreated) onCourseCreated(newCourse);
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={20} style={{ color: 'var(--primary)' }} />
            Initialize New Course Offering
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Course Code:</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. CS401"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group">
                <label className="label">Course Title:</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Machine Learning & Neural Networks"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Department / School:</label>
                <input
                  type="text"
                  className="input"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="label">Credits:</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  className="input"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 4 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Academic Term / Semester:</label>
              <input
                type="text"
                className="input"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating Course...' : 'Initialize Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

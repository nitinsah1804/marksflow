import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save,
  Download,
  Upload,
  Clock,
  FileSpreadsheet,
  Lock,
  Search
} from 'lucide-react';

export default function MarksEntryMatrix({
  currentCourse,
  currentUser,
  componentsList = [],
  onMarksSaved,
  showToast
}) {
  const [selectedComponentId, setSelectedComponentId] = useState(componentsList[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [componentMeta, setComponentMeta] = useState(null);
  const [marksEntries, setMarksEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dirtyRows, setDirtyRows] = useState(new Set());
  const [saveReasonModalOpen, setSaveReasonModalOpen] = useState(false);
  const [auditReason, setAuditReason] = useState('Routine marks entry & evaluation updates');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const isLocked = currentCourse?.is_locked;
  const isFacultyOrHOD = currentUser?.role === 'faculty' || currentUser?.role === 'hod';

  const fetchMarksForComponent = useCallback(async (compId) => {
    if (!compId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/components/${compId}/marks`);
      if (!res.ok) throw new Error('Failed to load component marks');
      const data = await res.json();
      setComponentMeta(data.component);
      setMarksEntries(data.entries || []);
      setDirtyRows(new Set());
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Could not load component marks', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load component list or set initial selection
  useEffect(() => {
    if (componentsList.length > 0 && !selectedComponentId) {
      setSelectedComponentId(componentsList[0].id);
    }
  }, [componentsList, selectedComponentId]);

  // Fetch marks when selected component changes
  useEffect(() => {
    if (selectedComponentId) {
      fetchMarksForComponent(selectedComponentId);
    }
  }, [selectedComponentId, fetchMarksForComponent]);

  const handleMarkChange = (studentId, val) => {
    if (isLocked) return;
    const num = val === '' ? null : parseFloat(val);
    setMarksEntries((prev) =>
      prev.map((item) => {
        if (item.student_id === studentId) {
          return {
            ...item,
            marks_obtained: isNaN(num) ? null : num,
            is_absent: false
          };
        }
        return item;
      })
    );
    setDirtyRows((prev) => new Set(prev).add(studentId));
  };

  const handleAbsentToggle = (studentId, checked) => {
    if (isLocked) return;
    setMarksEntries((prev) =>
      prev.map((item) => {
        if (item.student_id === studentId) {
          return {
            ...item,
            is_absent: checked,
            marks_obtained: checked ? 0 : item.marks_obtained
          };
        }
        return item;
      })
    );
    setDirtyRows((prev) => new Set(prev).add(studentId));
  };

  const handleCommentChange = (studentId, comments) => {
    if (isLocked) return;
    setMarksEntries((prev) =>
      prev.map((item) => {
        if (item.student_id === studentId) {
          return { ...item, comments };
        }
        return item;
      })
    );
    setDirtyRows((prev) => new Set(prev).add(studentId));
  };

  // Bulk Save all modified rows
  const handleTriggerSave = () => {
    if (dirtyRows.size === 0) {
      if (showToast) showToast('No modified marks to save.', 'info');
      return;
    }
    setSaveReasonModalOpen(true);
  };

  const executeBulkSave = async () => {
    if (!selectedComponentId) return;
    setSaving(true);
    try {
      const payloadEntries = marksEntries
        .filter((item) => dirtyRows.has(item.student_id))
        .map((item) => ({
          student_id: item.student_id,
          marks_obtained: item.is_absent ? 0 : item.marks_obtained,
          is_absent: item.is_absent,
          comments: item.comments || ''
        }));

      const res = await fetch(`/api/components/${selectedComponentId}/bulk-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: payloadEntries,
          changed_by_id: currentUser?.id || 'usr-fac-1',
          changed_by_name: currentUser?.name || 'Faculty Instructor',
          changed_by_role: currentUser?.role || 'faculty',
          reason: auditReason || 'Manual grade entry & update'
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Save failed');
      }

      const resData = await res.json();
      setSaveReasonModalOpen(false);
      setDirtyRows(new Set());
      if (showToast) showToast(`Successfully saved ${resData.updated_count} student marks!`, 'success');
      if (onMarksSaved) onMarksSaved();
      fetchMarksForComponent(selectedComponentId);
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    if (!selectedComponentId) return;
    window.open(`/api/components/${selectedComponentId}/template`, '_blank');
  };

  // Upload Excel / CSV file
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !selectedComponentId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('changed_by_id', currentUser?.id || 'usr-fac-1');
      formData.append('changed_by_name', currentUser?.name || 'Faculty Instructor');
      formData.append('changed_by_role', currentUser?.role || 'faculty');
      formData.append('reason', auditReason || 'Bulk Excel upload');

      const res = await fetch(`/api/components/${selectedComponentId}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'File upload failed');
      }

      const result = await res.json();
      setUploadModalOpen(false);
      setUploadFile(null);
      if (showToast) {
        showToast(
          `Uploaded! ${result.updated_count} marks updated. ${result.warnings?.length ? `(${result.warnings.length} warnings)` : ''}`,
          'success'
        );
      }
      if (onMarksSaved) onMarksSaved();
      fetchMarksForComponent(selectedComponentId);
    } catch (err) {
      console.error(err);
      if (showToast) showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Filter entries by search
  const filteredEntries = marksEntries.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      m.student_name?.toLowerCase().includes(q) ||
      m.roll_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Header Toolbar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800 }}>
                Marks Entry & Spreadsheet Matrix
              </h2>
              {dirtyRows.size > 0 && (
                <span className="badge badge-amber">
                  {dirtyRows.size} Unsaved Changes
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Input student scores directly with bounds validation, or ingest in bulk via official Excel templates.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadTemplate}
              title="Download pre-filled Excel template for this component"
            >
              <Download size={15} style={{ color: 'var(--emerald)' }} />
              <span>Download Excel Template</span>
            </button>

            {isFacultyOrHOD && !isLocked && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setUploadModalOpen(true)}
                title="Upload evaluated marks from Excel/CSV"
              >
                <Upload size={15} style={{ color: 'var(--primary)' }} />
                <span>Upload Excel / CSV</span>
              </button>
            )}

            {isFacultyOrHOD && !isLocked && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleTriggerSave}
                disabled={dirtyRows.size === 0 || saving}
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : `Save Changes (${dirtyRows.size})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Component Selector Bar */}
        <div
          style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Target Component:
            </label>
            <select
              className="select"
              style={{ minWidth: '280px', fontWeight: 600 }}
              value={selectedComponentId}
              onChange={(e) => setSelectedComponentId(e.target.value)}
            >
              {componentsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.name} (Max: {c.max_marks} Marks · {c.group_name || 'Evaluation'})
                </option>
              ))}
            </select>
          </div>

          {componentMeta && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
              <span className="badge badge-blue">
                Maximum: {componentMeta.max_marks} Marks
              </span>
              <span className="badge badge-slate">
                Group: {componentMeta.group_name} ({componentMeta.group_weightage}% Weight)
              </span>
              {componentMeta.due_date && (
                <span className="badge badge-slate">
                  <Clock size={12} /> Due: {componentMeta.due_date}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lock Notice Banner */}
      {isLocked && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--rose-light)',
            border: '1px solid var(--rose-border)',
            color: 'var(--rose)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <Lock size={18} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            This course is currently FROZEN and LOCKED. Marks are read-only. Contact HOD or Exam Coordinator to request unfreezing.
          </div>
        </div>
      )}

      {/* 2. Filter & Search Bar */}
      <div className="card" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Filter by student name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {filteredEntries.length} of {marksEntries.length} students
          </div>
        </div>
      </div>

      {/* 3. Marks Entry Table */}
      <div className="table-card">
        <div className="table-scroll-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '110px', textAlign: 'center' }}>Roll No</th>
                <th style={{ width: '220px' }}>Student Name</th>
                <th style={{ width: '160px', textAlign: 'center' }}>
                  Marks Obtained (Max: {componentMeta?.max_marks || 100})
                </th>
                <th style={{ width: '100px', textAlign: 'center' }}>% Score</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Absent?</th>
                <th>Remarks / Evaluation Notes</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading student marks list...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No student entries found for this component.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((row) => {
                  const maxM = componentMeta?.max_marks || 100;
                  const isDirty = dirtyRows.has(row.student_id);
                  const isOverMax = row.marks_obtained !== null && row.marks_obtained > maxM;
                  const isNegative = row.marks_obtained !== null && row.marks_obtained < 0;
                  const hasError = isOverMax || isNegative;
                  const pct =
                    row.marks_obtained !== null && !row.is_absent && maxM > 0
                      ? ((row.marks_obtained / maxM) * 100).toFixed(1)
                      : null;

                  return (
                    <tr
                      key={row.student_id}
                      style={{
                        backgroundColor: isDirty ? 'var(--primary-light)' : 'transparent'
                      }}
                    >
                      {/* Roll No */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'center', fontSize: '0.8rem' }}>
                        {row.roll_number}
                      </td>

                      {/* Name & Email */}
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.student_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{row.email}</div>
                      </td>

                      {/* Marks Input */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={maxM}
                            className="input"
                            disabled={isLocked || row.is_absent}
                            style={{
                              width: '90px',
                              textAlign: 'center',
                              fontWeight: 700,
                              borderColor: hasError ? 'var(--rose)' : isDirty ? 'var(--primary)' : 'var(--border)',
                              backgroundColor: row.is_absent ? 'var(--bg-subtle)' : 'var(--bg-input)'
                            }}
                            value={
                              row.is_absent
                                ? ''
                                : row.marks_obtained !== null && row.marks_obtained !== undefined
                                ? row.marks_obtained
                                : ''
                            }
                            placeholder={row.is_absent ? 'ABS' : '0.0'}
                            onChange={(e) => handleMarkChange(row.student_id, e.target.value)}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {maxM}</span>
                        </div>
                        {isOverMax && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--rose)', marginTop: '0.15rem', fontWeight: 600 }}>
                            Exceeds max ({maxM})!
                          </div>
                        )}
                      </td>

                      {/* Percentage */}
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        {row.is_absent ? (
                          <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>ABS</span>
                        ) : pct !== null ? (
                          <span
                            style={{
                              color: parseFloat(pct) >= 80 ? 'var(--emerald)' : parseFloat(pct) < 50 ? 'var(--rose)' : 'inherit'
                            }}
                          >
                            {pct}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Absent Checkbox */}
                      <td style={{ textAlign: 'center' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                          <input
                            type="checkbox"
                            disabled={isLocked}
                            checked={row.is_absent || false}
                            onChange={(e) => handleAbsentToggle(row.student_id, e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: 'var(--rose)' }}
                          />
                        </label>
                      </td>

                      {/* Remarks */}
                      <td>
                        <input
                          type="text"
                          className="input input-sm"
                          disabled={isLocked}
                          placeholder="Optional remarks..."
                          value={row.comments || ''}
                          onChange={(e) => handleCommentChange(row.student_id, e.target.value)}
                        />
                      </td>

                      {/* Status */}
                      <td style={{ textAlign: 'center' }}>
                        {isDirty ? (
                          <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Edited</span>
                        ) : row.marks_obtained !== null || row.is_absent ? (
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Saved</span>
                        ) : (
                          <span className="badge badge-slate" style={{ fontSize: '0.65rem' }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Audit Reason Modal for Bulk Save */}
      {saveReasonModalOpen && (
        <div className="modal-overlay" onClick={() => setSaveReasonModalOpen(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Save size={18} style={{ color: 'var(--primary)' }} />
                Confirm Marks Commit
              </div>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                You are about to commit marks updates for <strong>{dirtyRows.size} students</strong> under <strong>{componentMeta?.name}</strong>.
              </p>
              <div className="form-group">
                <label className="label">Audit Reason / Justification:</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="State the rationale for these marks entries (e.g., CIE Exam 1 initial grading)..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSaveReasonModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={executeBulkSave} disabled={saving}>
                {saving ? 'Saving...' : 'Confirm & Log Audit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Upload Excel / CSV Modal */}
      {uploadModalOpen && (
        <div className="modal-overlay" onClick={() => setUploadModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Upload size={18} style={{ color: 'var(--primary)' }} />
                Bulk Ingest: {componentMeta?.name}
              </div>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Upload an Excel (.xlsx, .xls) or CSV file with columns <code>Roll Number</code>, <code>Marks Obtained</code>, and optional <code>Remarks</code>.
              </p>

              <div
                style={{
                  border: '2px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet size={36} style={{ color: 'var(--primary)', margin: '0 auto 0.75rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  {uploadFile ? uploadFile.name : 'Click to select spreadsheet or drop here'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : 'Supports .xlsx, .xls, .csv up to 10MB'}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
              </div>

              <div className="form-group">
                <label className="label">Audit Reason for Ingestion:</label>
                <input
                  type="text"
                  className="input"
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  placeholder="e.g. Bulk upload from Department Mid-term Excel sheet"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUploadSubmit}
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Processing File...' : 'Upload & Commit Marks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

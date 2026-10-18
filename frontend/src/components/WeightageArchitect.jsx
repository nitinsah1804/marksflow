import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Lock,
  Calendar,
  Save,
  X
} from 'lucide-react';

export default function WeightageArchitect({
  groups = [],
  currentCourse,
  currentUser,
  onRefresh,
  showToast
}) {
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    weightage_percent: 20,
    rule_type: 'average',
    best_n_count: 2,
    description: ''
  });

  const [newGroupModalOpen, setNewGroupModalOpen] = useState(false);
  const [newComponentModalOpen, setNewComponentModalOpen] = useState(false);
  const [targetGroupIdForComponent, setTargetGroupIdForComponent] = useState(null);
  const [componentFormData, setComponentFormData] = useState({
    name: '',
    code: '',
    max_marks: 50,
    due_date: ''
  });

  const isLocked = currentCourse?.is_locked;
  const isFacultyOrHOD = currentUser?.role === 'faculty' || currentUser?.role === 'hod';

  // Calculate sum of weightages
  const totalWeightage = groups.reduce((acc, g) => acc + (parseFloat(g.weightage_percent) || 0), 0);
  const is100Percent = Math.abs(totalWeightage - 100) < 0.01;

  // Add Group
  const handleCreateGroup = async () => {
    if (!groupFormData.name.trim()) {
      if (showToast) showToast('Group name is required', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/courses/${currentCourse.id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupFormData)
      });
      if (!res.ok) throw new Error('Failed to create group');
      if (showToast) showToast('Evaluation group added!', 'success');
      setNewGroupModalOpen(false);
      setGroupFormData({ name: '', weightage_percent: 20, rule_type: 'average', best_n_count: 2, description: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    }
  };

  // Delete Group
  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to delete group "${groupName}" and all its components?`)) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete group');
      if (showToast) showToast('Group deleted', 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    }
  };

  // Add Component to Group
  const handleCreateComponent = async () => {
    if (!componentFormData.name.trim() || !componentFormData.code.trim()) {
      if (showToast) showToast('Component name and code are required', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/courses/${currentCourse.id}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: targetGroupIdForComponent,
          name: componentFormData.name,
          code: componentFormData.code,
          max_marks: parseFloat(componentFormData.max_marks) || 50,
          due_date: componentFormData.due_date || null
        })
      });
      if (!res.ok) throw new Error('Failed to create component');
      if (showToast) showToast('Assessment component created!', 'success');
      setNewComponentModalOpen(false);
      setComponentFormData({ name: '', code: '', max_marks: 50, due_date: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    }
  };

  // Delete Component
  const handleDeleteComponent = async (componentId, componentName) => {
    if (!window.confirm(`Delete component "${componentName}"?`)) return;
    try {
      const res = await fetch(`/api/components/${componentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete component');
      if (showToast) showToast('Component deleted', 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Header Toolbar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800 }}>
                Assessment Architecture & Evaluation Rules
              </h2>
              <span className={`badge ${is100Percent ? 'badge-emerald' : 'badge-amber'}`}>
                {is100Percent ? <><CheckCircle2 size={12} /> 100% Weightage Balanced</> : <><AlertCircle size={12} /> Total: {totalWeightage}%</>}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Configure evaluation categories (Tests, Assignments, Lab), percentage contributions, and Best-of-N algorithms.
            </p>
          </div>

          {isFacultyOrHOD && !isLocked && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setNewGroupModalOpen(true)}
            >
              <Plus size={15} />
              <span>Add Evaluation Group</span>
            </button>
          )}
        </div>

        {/* Weightage Distribution Progress Bar */}
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            <span>Weightage Allocation: {totalWeightage}% of 100%</span>
            <span style={{ color: is100Percent ? 'var(--emerald)' : 'var(--amber)' }}>
              {is100Percent ? 'Perfect 100% Balance' : `Discrepancy: ${100 - totalWeightage}%`}
            </span>
          </div>
          <div
            style={{
              height: '10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-subtle)',
              overflow: 'hidden',
              display: 'flex',
              border: '1px solid var(--border)'
            }}
          >
            {groups.map((g, idx) => {
              const colors = ['var(--primary)', 'var(--emerald)', 'var(--purple)', 'var(--amber)'];
              const color = colors[idx % colors.length];
              return (
                <div
                  key={g.id}
                  style={{
                    width: `${g.weightage_percent}%`,
                    backgroundColor: color,
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }}
                  title={`${g.name}: ${g.weightage_percent}%`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Groups Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {groups.map((grp) => {
          return (
            <div key={grp.id} className="card">
              {/* Group Header */}
              <div className="card-header" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {grp.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Rule: {grp.rule_type === 'best_n' ? `Best ${grp.best_n_count} of N components` : grp.rule_type === 'average' ? 'Equal average of all components' : 'Direct sum'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="badge badge-blue" style={{ fontSize: '0.8125rem', padding: '0.25rem 0.65rem' }}>
                    {grp.weightage_percent}% of Course Total
                  </span>

                  {isFacultyOrHOD && !isLocked && (
                    <>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                          setTargetGroupIdForComponent(grp.id);
                          setNewComponentModalOpen(true);
                        }}
                      >
                        <Plus size={13} /> Add Component
                      </button>
                      <button
                        className="btn btn-ghost btn-xs"
                        style={{ color: 'var(--rose)' }}
                        onClick={() => handleDeleteGroup(grp.id, grp.name)}
                        title="Delete Group"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Group Body: List of Components */}
              <div className="card-body" style={{ padding: '0.75rem 1.25rem' }}>
                {grp.components?.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    No assessment components defined under this category yet. Click "Add Component" above.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {grp.components?.map((cmp) => (
                      <div
                        key={cmp.id}
                        className="card"
                        style={{
                          padding: '0.85rem 1rem',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg-card)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                            <span className="badge badge-slate" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                              {cmp.code}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                              {cmp.name}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Maximum Marks: <strong style={{ color: 'var(--text-primary)' }}>{cmp.max_marks}</strong>
                            {cmp.due_date && <span> · Due: {cmp.due_date}</span>}
                          </div>
                        </div>

                        {isFacultyOrHOD && !isLocked && (
                          <button
                            className="btn btn-ghost btn-xs"
                            style={{ color: 'var(--rose)' }}
                            onClick={() => handleDeleteComponent(cmp.id, cmp.name)}
                            title="Delete Component"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. New Group Modal */}
      {newGroupModalOpen && (
        <div className="modal-overlay" onClick={() => setNewGroupModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Sliders size={18} style={{ color: 'var(--primary)' }} />
                Add Evaluation Category / Group
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setNewGroupModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Group Name:</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Continuous Internal Evaluation (CIE Tests)"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="label">Weightage (%):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="input"
                    value={groupFormData.weightage_percent}
                    onChange={(e) => setGroupFormData({ ...groupFormData, weightage_percent: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Evaluation Rule:</label>
                  <select
                    className="select"
                    value={groupFormData.rule_type}
                    onChange={(e) => setGroupFormData({ ...groupFormData, rule_type: e.target.value })}
                  >
                    <option value="average">Equal Average</option>
                    <option value="best_n">Best-of-N (e.g. Best 2 of 3)</option>
                    <option value="direct_sum">Direct Raw Sum</option>
                  </select>
                </div>
              </div>

              {groupFormData.rule_type === 'best_n' && (
                <div className="form-group">
                  <label className="label">Number of Best Components to Count (N):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input"
                    value={groupFormData.best_n_count}
                    onChange={(e) => setGroupFormData({ ...groupFormData, best_n_count: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="label">Description / Academic Notes:</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Three centralized mid-term exams; top 2 scores counted"
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setNewGroupModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateGroup}>
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. New Component Modal */}
      {newComponentModalOpen && (
        <div className="modal-overlay" onClick={() => setNewComponentModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Plus size={18} style={{ color: 'var(--primary)' }} />
                Add Assessment Component
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setNewComponentModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Component Name:</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. CIE Test 1: Relational Algebra & SQL"
                  value={componentFormData.name}
                  onChange={(e) => setComponentFormData({ ...componentFormData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="label">Short Code / Tag:</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. CIE-1 or A1"
                    value={componentFormData.code}
                    onChange={(e) => setComponentFormData({ ...componentFormData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Maximum Marks:</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    className="input"
                    value={componentFormData.max_marks}
                    onChange={(e) => setComponentFormData({ ...componentFormData, max_marks: parseFloat(e.target.value) || 50 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Due Date (Optional):</label>
                <input
                  type="date"
                  className="input"
                  value={componentFormData.due_date}
                  onChange={(e) => setComponentFormData({ ...componentFormData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setNewComponentModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateComponent}>
                Add Component
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

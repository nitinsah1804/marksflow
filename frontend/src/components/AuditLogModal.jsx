import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Clock,
  User,
  ShieldCheck,
  Search,
  ArrowRight,
  FileCheck2
} from 'lucide-react';

export default function AuditLogModal({ isOpen, onClose, currentCourse }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (isOpen && currentCourse?.id) {
      fetchAuditLogs(currentCourse.id);
    }
  }, [isOpen, currentCourse?.id]);

  const fetchAuditLogs = async (crsId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${crsId}/audit-logs`);
      if (!res.ok) throw new Error('Failed to load audit logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const q = filterQuery.toLowerCase().trim();
    return (
      !q ||
      (log.changed_by_name || log.user_name || '').toLowerCase().includes(q) ||
      (log.student_name || '').toLowerCase().includes(q) ||
      (log.student_roll || '').toLowerCase().includes(q) ||
      (log.component_name || log.entity_name || log.action || '').toLowerCase().includes(q) ||
      (log.reason || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
            Tamper-Evident Academic Audit Log
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Complete chronological audit trail of all score modifications, bulk uploads, rule revisions, and freeze locks.
            </p>
            <div style={{ position: 'relative', width: '240px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="input input-sm"
                style={{ paddingLeft: '2rem' }}
                placeholder="Filter logs..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', maxHeight: '420px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading audit trail...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No audit entries found matching query.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredLogs.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: idx < filteredLogs.length - 1 ? '1px solid var(--border)' : 'none',
                      backgroundColor: idx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-blue" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          {item.source || item.action || 'MODIFY'}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                          {item.changed_by_name || item.user_name || 'System'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({item.changed_by_role || item.user_role || 'faculty'})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <Clock size={12} />
                        <span>{item.timestamp || 'Recent'}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <strong>Assessment:</strong> {item.component_name || item.entity_name}
                      {item.student_name && (
                        <span style={{ marginLeft: '0.5rem', color: 'var(--text-primary)' }}>
                          &bull; <strong>Student:</strong> {item.student_name} ({item.student_roll})
                        </span>
                      )}
                      {item.old_value !== null && item.old_value !== undefined && (
                        <span style={{ marginLeft: '0.75rem' }}>
                          Score: <span style={{ textDecoration: 'line-through', color: 'var(--rose)' }}>{item.old_value}</span>
                          {' '}&rarr;{' '}
                          <span style={{ fontWeight: 700, color: 'var(--emerald)' }}>{item.new_value}</span>
                        </span>
                      )}
                    </div>

                    {item.reason && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        &ldquo;{item.reason}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

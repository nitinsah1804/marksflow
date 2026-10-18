import React from 'react';
import {
  X,
  Sun,
  Moon,
  Sparkles,
  LayoutGrid,
  ListFilter,
  Eye,
  EyeOff,
  Activity,
  Layers,
  Zap,
  Check,
  Sliders,
  Maximize2,
  Minimize2
} from 'lucide-react';

export default function AppearanceModal({
  isOpen,
  onClose,
  theme,
  setTheme,
  accent,
  setAccent,
  density,
  setDensity,
  detailLevel,
  setDetailLevel,
  animations,
  setAnimations
}) {
  if (!isOpen) return null;

  const themes = [
    { id: 'light', label: 'Daylight Light', desc: 'Crisp slate & luminous white cards', icon: Sun },
    { id: 'dark', label: 'Midnight Dark', desc: 'Sleek obsidian & high-contrast glow', icon: Moon }
  ];

  const accents = [
    { id: 'sapphire', label: 'Sapphire Blue', color: '#2563eb', desc: 'Academic Classic' },
    { id: 'emerald', label: 'Emerald Forest', color: '#059669', desc: 'Scientific Precision' },
    { id: 'violet', label: 'Royal Amethyst', color: '#7c3aed', desc: 'Executive Portal' },
    { id: 'crimson', label: 'Crimson Ruby', color: '#e11d48', desc: 'High Contrast Prestige' },
    { id: 'amber', label: 'Tuscan Amber', color: '#d97706', desc: 'Warm Focus & Energy' },
    { id: 'cyan', label: 'Cyber Azure', color: '#0891b2', desc: 'Modern High-Tech' },
    { id: 'rose', label: 'Rose Gold', color: '#be185d', desc: 'Soft Luxury Aesthetic' },
    { id: 'slate', label: 'Obsidian Slate', color: '#475569', desc: 'Bauhaus Minimalist' }
  ];

  const detailModes = [
    {
      id: 'minimal',
      label: 'Streamlined (Show Less Details)',
      desc: 'Hides redundant explanatory notes, verbose subtitles, and secondary helper text for a clean, distraction-free view.',
      icon: EyeOff
    },
    {
      id: 'detailed',
      label: 'Comprehensive (Show More Details)',
      desc: 'Displays all formula explanations, regulatory guidelines, Best-of-N derivation steps, and descriptive metadata.',
      icon: Eye
    }
  ];

  const densities = [
    { id: 'comfortable', label: 'Comfortable', desc: 'Spacious padding & relaxed line height', icon: LayoutGrid },
    { id: 'compact', label: 'Compact Matrix', desc: 'High density, maximum visible rows', icon: ListFilter }
  ];

  const handleToggleAnim = (key) => {
    setAnimations((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={20} style={{ color: 'var(--primary)' }} />
            Appearance &amp; Visual Experience Settings
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.25rem' }}>
          {/* 1. Theme Color Mode */}
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem' }}>
              Interface Lighting Mode
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {themes.map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    className="card"
                    onClick={() => setTheme(t.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                        color: isSelected ? 'white' : 'var(--text-secondary)',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {t.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {t.desc}
                      </div>
                    </div>
                    {isSelected && <Check size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Color Palettes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Curated Color Palettes ({accents.length})
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                Aesthetic Theming
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
              {accents.map((a) => {
                const isSelected = accent === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAccent(a.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.75rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? `2px solid ${a.color}` : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: a.color,
                        boxShadow: isSelected ? `0 0 0 3px rgba(0,0,0,0.12), 0 0 10px ${a.color}` : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {a.label}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.1 }}>
                      {a.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Detail Level: Show Less or More Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Information Clarity &amp; Detail Level
              </div>
              <span className={`badge ${detailLevel === 'minimal' ? 'badge-emerald' : 'badge-blue'}`} style={{ fontSize: '0.65rem' }}>
                {detailLevel === 'minimal' ? 'Clean & Uncluttered' : 'Full Governance'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {detailModes.map((dm) => {
                const Icon = dm.icon;
                const isSelected = detailLevel === dm.id;
                return (
                  <button
                    key={dm.id}
                    className="card"
                    onClick={() => setDetailLevel(dm.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                          color: isSelected ? 'white' : 'var(--text-secondary)'
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      {isSelected && <Check size={16} style={{ color: 'var(--primary)' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {dm.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '0.2rem' }}>
                        {dm.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Animations & Micro-Interactions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Animations &amp; Motion Transitions
              </div>
              <span className={`badge ${animations?.enabled ? 'badge-emerald' : 'badge-slate'}`} style={{ fontSize: '0.65rem' }}>
                {animations?.enabled ? 'Fluid Motion Active' : 'Reduced Motion'}
              </span>
            </div>

            {/* Master Switch */}
            <div
              className="card"
              style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
                backgroundColor: animations?.enabled ? 'var(--bg-card)' : 'var(--bg-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: animations?.enabled ? 'var(--primary-light)' : 'var(--bg-subtle)',
                    color: animations?.enabled ? 'var(--primary)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Zap size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                    Interface Animations Master Toggle
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Enable smooth transitions, hover effects, and keyframe animations
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`btn btn-sm ${animations?.enabled ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleToggleAnim('enabled')}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                {animations?.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Granular Animation Controls (visible if enabled) */}
            {animations?.enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="card"
                  onClick={() => handleToggleAnim('tabTransitions')}
                  style={{
                    padding: '0.65rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: animations?.tabTransitions ? '1px solid var(--primary-border)' : '1px solid var(--border)',
                    backgroundColor: animations?.tabTransitions ? 'var(--primary-light)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <Layers size={15} style={{ color: animations?.tabTransitions ? 'var(--primary)' : 'var(--text-muted)' }} />
                    {animations?.tabTransitions && <Check size={14} style={{ color: 'var(--primary)' }} />}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>Tab Transitions</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Slide &amp; fade entrance</div>
                </button>

                <button
                  type="button"
                  className="card"
                  onClick={() => handleToggleAnim('hoverEffects')}
                  style={{
                    padding: '0.65rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: animations?.hoverEffects ? '1px solid var(--primary-border)' : '1px solid var(--border)',
                    backgroundColor: animations?.hoverEffects ? 'var(--primary-light)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <Maximize2 size={15} style={{ color: animations?.hoverEffects ? 'var(--primary)' : 'var(--text-muted)' }} />
                    {animations?.hoverEffects && <Check size={14} style={{ color: 'var(--primary)' }} />}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>Card Hover Float</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Elevates on cursor hover</div>
                </button>

                <button
                  type="button"
                  className="card"
                  onClick={() => handleToggleAnim('badgePulse')}
                  style={{
                    padding: '0.65rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: animations?.badgePulse ? '1px solid var(--primary-border)' : '1px solid var(--border)',
                    backgroundColor: animations?.badgePulse ? 'var(--primary-light)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <Activity size={15} style={{ color: animations?.badgePulse ? 'var(--primary)' : 'var(--text-muted)' }} />
                    {animations?.badgePulse && <Check size={14} style={{ color: 'var(--primary)' }} />}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>Badge Alerts Pulse</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Soft breathing indicator</div>
                </button>
              </div>
            )}
          </div>

          {/* 5. Table Density */}
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem' }}>
              Table &amp; Matrix Spacing Density
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {densities.map((d) => {
                const Icon = d.icon;
                const isSelected = density === d.id;
                return (
                  <button
                    key={d.id}
                    className="card"
                    onClick={() => setDensity(d.id)}
                    style={{
                      padding: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)'
                    }}
                  >
                    <Icon size={18} style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                        {d.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {d.desc}
                      </div>
                    </div>
                    {isSelected && <Check size={16} style={{ color: 'var(--primary)' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Preferences automatically saved to your browser session.
          </div>
          <button className="btn btn-primary" onClick={onClose} style={{ minWidth: '110px' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

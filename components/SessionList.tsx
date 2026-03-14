'use client';

export type SessionItem = {
  id: number;
  duration: number;
  startTime: string;
  endTime: string;
  intent?: string | null;
  targetDuration?: number | null;
  subject: {
    name: string;
  };
};

const INTENT_LABELS: Record<string, string> = {
  problem_solving: '🧩 Problem Solving',
  memorising: '🧠 Memorising',
  understanding: '💡 Understanding',
  revising: '📝 Revising',
  others: '✨ Others'
};

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}`;
}

const SUBJECT_COLORS = [
  '#a855f7', '#3b82f6', '#22c55e', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
];

function getSubjectColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

type SessionListProps = {
  sessions: SessionItem[];
  onDelete?: (id: number) => void;
};

export default function SessionList({ sessions, onDelete }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div
        className="glass-panel"
        style={{
          textAlign: 'center',
          padding: '80px 24px',
          color: 'var(--text-muted)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
        <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)' }}>No sessions yet</p>
        <p style={{ fontSize: '13px', marginTop: '4px' }}>Start a study session to see it here.</p>
      </div>
    );
  }

  return (
    <ul style={{ width: '100%', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {sessions.map((session) => {
        const color = getSubjectColor(session.subject.name);
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        const intentLabel = session.intent ? INTENT_LABELS[session.intent] || session.intent : null;

        return (
          <li
            key={session.id}
            className="glass-panel"
            style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              transition: 'all 0.2s ease',
              borderRadius: 'var(--radius-lg)'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLLIElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLLIElement).style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.6)';
              (e.currentTarget as HTMLLIElement).style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLLIElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLLIElement).style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.5)';
              (e.currentTarget as HTMLLIElement).style.borderColor = 'var(--border)';
            }}
          >
            {/* Color indicator */}
            <div
              style={{
                width: '4px',
                height: '48px',
                borderRadius: '2px',
                backgroundColor: color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${color}66`,
              }}
            />

            {/* Badges container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '140px', flexShrink: 0 }}>
              {/* Subject name badge */}
              <div
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  backgroundColor: `${color}22`,
                  border: `1px solid ${color}44`,
                  color: color,
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'inline-block',
                  width: 'fit-content'
                }}
              >
                {session.subject.name}
              </div>

              {/* Intent Tag */}
              {intentLabel && (
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {intentLabel}
                </div>
              )}
            </div>

            {/* Time info */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {start.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                {' — '}
                {end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>

            {/* Duration and Goals */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexShrink: 0,
              }}
            >
              {session.targetDuration != null && session.targetDuration > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '40px', height: '6px', backgroundColor: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.round((session.duration / session.targetDuration) * 100))}%`,
                      height: '100%',
                      backgroundColor: color
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {Math.round((session.duration / session.targetDuration) * 100)}%
                  </span>
                </div>
              )}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {formatSeconds(session.duration)}
              </div>
            </div>

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={() => onDelete(session.id)}
                style={{
                  background: 'none',
                  border: '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '14px',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                title="Delete session"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-red)';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.15)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

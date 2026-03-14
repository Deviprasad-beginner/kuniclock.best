'use client';

import { useEffect, useMemo, useState } from 'react';
import { SessionItem } from '@/components/SessionList';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const CHART_COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
type ViewMode = 'today' | 'week' | 'all';

function AnalyticsContent() {
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('today');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const token = await getToken();
        const filter = viewMode === 'all' ? '' : `?filter=${viewMode}`;
        const res = await fetch(`/api/sessions${filter}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = (await res.json()) as SessionItem[];
        if (isMounted) setSessions(data);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void load();
    return () => { isMounted = false; };
  }, [viewMode, getToken]);

  const totalSeconds = useMemo(() => sessions.reduce((s, ss) => s + ss.duration, 0), [sessions]);

  const bySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of sessions) {
      map.set(session.subject.name, (map.get(session.subject.name) ?? 0) + session.duration);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  const maxSeconds = bySubject[0]?.[1] ?? 1;

  const tabs: { key: ViewMode; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '28px', minHeight: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Analytics Insights</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
            Deep dive into your study patterns
          </p>
        </div>
        {/* Tab toggle */}
        <div className="glass-panel" style={{ display: 'flex', borderRadius: 'var(--radius)', overflow: 'hidden', padding: '4px', gap: '4px' }}>
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setViewMode(key)} style={{
              padding: '8px 16px', border: 'none', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              backgroundColor: viewMode === key ? 'var(--bg-elevated)' : 'transparent',
              color: viewMode === key ? 'var(--text-primary)' : 'var(--text-muted)',
              borderRadius: 'calc(var(--radius) - 2px)',
              boxShadow: viewMode === key ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => <div key={i} className="glass-panel" style={{ height: '100px', borderRadius: 'var(--radius)', opacity: 1 - i * 0.15, animation: 'pulse-glow-purple 2s infinite' }} />)}
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Total Study Time', value: formatSeconds(totalSeconds), icon: '⏱', color: '#a855f7' },
              { label: 'Total Sessions', value: sessions.length.toString(), icon: '📚', color: '#3b82f6' },
              { label: 'Subjects Covered', value: bySubject.length.toString(), icon: '🎯', color: '#22c55e' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '24px', background: `${color}15`, padding: '10px', borderRadius: '12px' }}>{icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>{label}</div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color, letterSpacing: '-0.02em', marginTop: '4px' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* Bar chart */}
              <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '28px', gridColumn: '1 / -1' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#a855f7' }}>📊</span> Time per Subject
                </h2>
                {bySubject.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '15px' }}>
                    No session data available for this period.
                  </div>
                ) : (
                  <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bySubject.map(([name, seconds], i) => ({ name, duration: seconds / 60, fill: CHART_COLORS[i % CHART_COLORS.length] }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}m`} dx={-10} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                            formatter={(value: any) => [`${Math.floor(value / 60)}h ${Math.floor(value % 60)}m`, 'Time Studied']}
                            labelStyle={{ color: 'var(--text-muted)' }}
                        />
                        <Bar dataKey="duration" radius={[6, 6, 0, 0]} maxBarSize={60}>
                            {bySubject.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Pie Chart */}
              {bySubject.length > 0 && (
                <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '28px', display: 'flex', flexDirection: 'column' }}>
                   <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#3b82f6' }}>🍩</span> Subject Distribution
                   </h2>
                   <div style={{ flex: 1, minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={bySubject.map(([name, seconds]) => ({ name, value: seconds }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {bySubject.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid var(--border)', borderRadius: '12px' }}
                            formatter={(value: any) => [formatSeconds(value), 'Duration']}
                            itemStyle={{ color: '#fff', fontWeight: 500 }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              )}
          </div>
        </>
      )}
    </main>
  );
}

export default function AnalyticsPage() {
  return <AuthGuard><AnalyticsContent /></AuthGuard>;
}

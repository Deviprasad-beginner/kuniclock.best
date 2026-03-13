'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Clock from '@/components/Clock';
import SubjectSelect from '@/components/SubjectSelect';
import AuthGuard from '@/components/AuthGuard';
import { useClockStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { useRealTimeClock, useDailyTargetStats } from '@/lib/hooks';

const INTENT_OPTIONS = [
  { id: 'problem_solving', label: '🧩 Problem Solving' },
  { id: 'memorising', label: '🧠 Memorising' },
  { id: 'understanding', label: '💡 Understanding' },
  { id: 'revising', label: '📝 Revising' },
  { id: 'others', label: '✨ Others' }
];

function ClockContent() {
  const { subjectId, intent, startTime, targetDuration: storeTarget, clockMode, isRunning, setSubject, start, stop } = useClockStore();
  const { getToken } = useAuth();
  const [time, setTime] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Local state for intent before starting
  const [selectedIntent, setSelectedIntent] = useState<string>('');

  // Pomodoro states
  const [mode, setMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const [pomodoroMins, setPomodoroMins] = useState<number>(25);
  // Stopwatch target state (optional limit vs infinite)
  const [stopwatchTargetMins, setStopwatchTargetMins] = useState<number | null>(null);

  const currentTimeDisplay = useRealTimeClock();
  const { targetSeconds, streak, todaySeconds, statsLoading, loadStats } = useDailyTargetStats(getToken);

  useEffect(() => {
    if (!isRunning) {
      void loadStats();
    }
  }, [isRunning, loadStats]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, startTime]);

  // Pomodoro auto-stop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const activeMode = isRunning ? clockMode : mode;
    const activeTarget = isRunning ? storeTarget : (pomodoroMins * 60);

    if (isRunning && activeMode === 'pomodoro' && activeTarget && time >= activeTarget) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1.5);
        }
      } catch (e) {
        console.error('Audio playback failed', e);
      }
      void handleStop();
    }
  }, [time, isRunning, mode, clockMode, pomodoroMins, storeTarget]);

  async function handleStart() {
    if (!subjectId || !selectedIntent) return;
    setSaveError(null);
    setLastSaved(null);
    setTime(0); // View visually resets when session exactly starts
    const target = mode === 'pomodoro' ? pomodoroMins * 60 : (stopwatchTargetMins ? stopwatchTargetMins * 60 : null);
    start(subjectId, selectedIntent, mode, target);
  }

  async function handleStop() {
    if (!isRunning || !subjectId || !startTime || !intent) return;
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    const token = await getToken();

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subjectId, intent, startTime, endTime, targetDuration: storeTarget }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setSaveError(payload?.error ?? 'Unable to save session. Please try again.');
        return;
      }

      stop();
      setSelectedIntent(''); // Reset intent after session
      const h = Math.floor(duration / 3600);
      const m = Math.floor((duration % 3600) / 60);
      const s = duration % 60;
      setLastSaved(
        `Session saved! ${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m ` : ''}${s}s`
      );
      if (clockMode === 'pomodoro') {
        setTime(0);
      }
      setSaveError(null);

      // Reload stats after stopping to update progress and streak instantly
      void loadStats();
    } catch {
      setSaveError('Unable to save session. Please check your connection.');
    }
  }

  // Calculate live progress including currently running session
  const effectiveTotal = todaySeconds + (isRunning ? time : 0);
  const targetProgress = Math.min(100, Math.round((effectiveTotal / targetSeconds) * 100)) || 0;

  const formatSecs = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-6 py-6 gap-8">
      <div className="absolute top-6 right-7 text-[15px] font-semibold text-muted font-mono tracking-wider">
        {currentTimeDisplay}
      </div>
      {/* Target & Streak Display */}
      {!statsLoading && (
        <div className="glass-panel flex flex-col items-center gap-2 w-full max-w-[380px] p-5 rounded-lg z-10">
          <div className="flex justify-between w-full text-[13px] font-medium">
            <span className="text-secondary">Daily Target</span>
            <span className="text-primary flex gap-2 items-center">
              <span>{formatSecs(effectiveTotal)} / {formatSecs(targetSeconds)}</span>
              {streak > 0 && <span className="text-orange-500 font-semibold text-sm">🔥 {streak}</span>}
            </span>
          </div>
          <div className="w-full h-2 rounded bg-elevated overflow-hidden">
            <div style={{
              height: '100%',
              width: `${targetProgress}%`,
              backgroundColor: targetProgress >= 100 ? 'var(--accent-green)' : 'var(--accent-purple)',
              borderRadius: '4px',
              transition: 'width 1s ease-out, background-color 0.5s ease'
            }} />
          </div>
        </div>
      )}

      <div className="text-center z-10">
        <h1 className="text-[44px] font-extrabold tracking-tighter mb-2 bg-gradient-to-b from-white to-[#a1a1aa] bg-clip-text text-transparent drop-shadow-md">
          {isRunning && intent ? INTENT_OPTIONS.find(o => o.id === intent)?.label : 'Focus Timer'}
        </h1>
        <p className="text-[15px] text-muted">
          {isRunning ? 'Stay focused. You can do this.' : 'Select a subject and intent, then start.'}
        </p>
      </div>

      <div className="glass-panel flex flex-col gap-4 w-full max-w-[380px] items-center p-6 rounded-lg z-10">
        {/* Mode Toggle */}
        {!isRunning && (
          <div className="flex gap-2 p-1.5 bg-elevated rounded border border-border-subtle">
            <button
              onClick={() => setMode('stopwatch')}
              className={`px-5 py-2 rounded-md font-semibold text-sm transition-all duration-200 border-none cursor-pointer ${mode === 'stopwatch' ? 'bg-surface text-primary shadow-sm' : 'bg-transparent text-muted'}`}
            >
              ⏱️ Stopwatch
            </button>
            <button
              onClick={() => setMode('pomodoro')}
              className={`px-5 py-2 rounded-md font-semibold text-sm transition-all duration-200 border-none cursor-pointer ${mode === 'pomodoro' ? 'bg-surface text-primary shadow-sm' : 'bg-transparent text-muted'}`}
            >
              🍅 Pomodoro
            </button>
          </div>
        )}

        {/* Pomodoro Settings */}
        {!isRunning && mode === 'pomodoro' && (
          <div className="glass-panel-elevated flex items-center gap-3 w-full px-5 py-4 rounded border border-border">
            <span className="text-sm text-secondary">Focus Duration:</span>
            <select
              value={pomodoroMins}
              onChange={(e) => setPomodoroMins(Number(e.target.value))}
              className="ml-auto px-2 py-1 rounded bg-elevated text-primary text-sm border border-border-subtle outline-none cursor-pointer"
            >
              {[1, 5, 10, 15, 20, 25, 30, 45, 60, 90, 120].map(min => (
                <option key={min} value={min}>{min} min</option>
              ))}
            </select>
          </div>
        )}

        {/* Stopwatch Goal Settings (Optional) */}
        {!isRunning && mode === 'stopwatch' && (
          <div className="glass-panel-elevated flex items-center gap-3 w-full px-5 py-4 rounded border border-border">
            <span className="text-sm text-secondary">Goal (Optional):</span>
            <select
              value={stopwatchTargetMins || ''}
              onChange={(e) => setStopwatchTargetMins(e.target.value ? Number(e.target.value) : null)}
              className="ml-auto px-2 py-1 rounded bg-elevated text-primary text-sm border border-border-subtle outline-none cursor-pointer"
            >
              <option value="">No goal (Infinite)</option>
              {[5, 10, 15, 20, 25, 30, 45, 60, 90, 120].map(min => (
                <option key={min} value={min}>{min} min</option>
              ))}
            </select>
          </div>
        )}

        <SubjectSelect value={subjectId} onChange={(id) => setSubject(id)} disabled={isRunning} />

        {!isRunning && (
          <div className="w-full relative">
            <select
              value={selectedIntent}
              onChange={(e) => setSelectedIntent(e.target.value)}
              disabled={isRunning || !subjectId}
              className={`glass-panel-elevated w-full px-5 py-4 rounded text-[15px] font-medium appearance-none outline-none transition-colors duration-150 focus:border-purple border border-border ${selectedIntent ? 'text-primary' : 'text-muted'} ${isRunning || !subjectId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <option value="" disabled>Select your intent...</option>
              {INTENT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted text-xs">▾</span>
          </div>
        )}
      </div>

      <Clock
        time={time}
        isRunning={isRunning}
        canStart={Boolean(subjectId) && Boolean(selectedIntent)}
        mode={isRunning ? clockMode : mode}
        targetSeconds={isRunning ? storeTarget : (mode === 'pomodoro' ? pomodoroMins * 60 : (stopwatchTargetMins ? stopwatchTargetMins * 60 : null))}
        onStart={handleStart}
        onStop={handleStop}
      />

      {saveError && (
        <div className="max-w-[400px] text-center text-sm text-red px-4 py-2.5 rounded bg-red-500/10 border border-red-500/25">
          {saveError}
        </div>
      )}

      {lastSaved && !isRunning && (
        <div className="max-w-[400px] text-center text-sm text-green px-4 py-2.5 rounded bg-green-500/10 border border-green-500/25">
          ✓ {lastSaved}
        </div>
      )}

      <div className="flex gap-4 z-10">
        {[
          { href: '/history', label: '📋 History' },
          { href: '/analytics', label: '📊 Analytics' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="glass-panel px-6 py-3 rounded text-secondary text-sm no-underline font-semibold transition-all duration-200 hover:text-primary hover:border-white/20"
          >
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}

export default function ClockPage() {
  return (
    <AuthGuard>
      <ClockContent />
    </AuthGuard>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';

type TimeFormat = '12' | '24';
type DateFormat = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
type Theme = 'light' | 'dark' | 'auto';
type Size = 'sm' | 'md' | 'lg';

interface Settings {
  timeFormat: TimeFormat;
  showSeconds: boolean;
  showDate: boolean;
  dateFormat: DateFormat;
  timezone: string;
  theme: Theme;
  size: Size;
}

const defaultSettings: Settings = {
  timeFormat: '24',
  showSeconds: true,
  showDate: true,
  dateFormat: 'DD.MM.YYYY',
  timezone: 'auto',
  theme: 'auto',
  size: 'md',
};

const timezones = [
  { label: 'Авто', value: 'auto' },
  { label: 'UTC', value: 'UTC' },
  { label: 'Москва', value: 'Europe/Moscow' },
  { label: 'Лондон', value: 'Europe/London' },
  { label: 'Нью-Йорк', value: 'America/New_York' },
  { label: 'Лос-Анджелес', value: 'America/Los_Angeles' },
  { label: 'Токио', value: 'Asia/Tokyo' },
];

export default function ClockWidget() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [now, setNow] = useState<Date>(new Date());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      if (settings.theme === 'auto') {
        const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(dark ? 'dark' : 'light');
      } else {
        setResolvedTheme(settings.theme);
      }
    };
    updateTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', updateTheme);
    return () => mq.removeEventListener('change', updateTheme);
  }, [settings.theme]);

  const getTimeString = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.timeFormat === '12',
      timeZone: settings.timezone === 'auto' ? undefined : settings.timezone,
    };
    if (settings.showSeconds) options.second = '2-digit';
    return new Intl.DateTimeFormat('en-US', options).format(now);
  };

  const getDateString = () => {
    const timeZone = settings.timezone === 'auto' ? undefined : settings.timezone;
    const parts = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone,
    }).formatToParts(now);

    const d = parts.find((p) => p.type === 'day')?.value || '';
    const m = parts.find((p) => p.type === 'month')?.value || '';
    const y = parts.find((p) => p.type === 'year')?.value || '';

    switch (settings.dateFormat) {
      case 'DD.MM.YYYY':
        return `${d}.${m}.${y}`;
      case 'MM/DD/YYYY':
        return `${m}/${d}/${y}`;
      case 'YYYY-MM-DD':
        return `${y}-${m}-${d}`;
    }
  };

  const sizeClasses = {
    sm: { padding: '20px 24px', time: '32px', date: '12px' },
    md: { padding: '28px 36px', time: '48px', date: '14px' },
    lg: { padding: '40px 56px', time: '72px', date: '18px' },
  };

  const s = sizeClasses[settings.size];
  const isDark = resolvedTheme === 'dark';

  const colors = {
    bg: isDark ? 'rgba(28, 28, 30, 0.72)' : 'rgba(255, 255, 255, 0.72)',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    text: isDark ? '#f5f5f7' : '#1d1d1f',
    subtext: isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
    controlBg: isDark ? 'rgba(120, 120, 128, 0.24)' : 'rgba(120, 120, 128, 0.16)',
    controlActive: isDark ? '#0a84ff' : '#007aff',
    shadow: isDark
      ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255,255,255,0.05) inset'
      : '0 20px 60px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0,0,0,0.05) inset',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
        background: isDark
          ? 'radial-gradient(ellipse at top, #1c1c1e 0%, #000 100%)'
          : 'radial-gradient(ellipse at top, #f5f5f7 0%, #e8e8ed 100%)',
        transition: 'background 0.6s ease',
      }}
    >
      <div
        ref={widgetRef}
        style={{
          position: 'relative',
          background: colors.bg,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${colors.border}`,
          borderRadius: '32px',
          boxShadow: colors.shadow,
          padding: s.padding,
          minWidth: '280px',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Time display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            key={getTimeString()}
            style={{
              fontSize: s.time,
              fontWeight: 200,
              letterSpacing: '-0.04em',
              color: colors.text,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              transition: 'all 0.3s ease',
              animation: 'tick 1s ease',
            }}
          >
            {getTimeString()}
          </div>

          {settings.showDate && (
            <div
              style={{
                fontSize: s.date,
                fontWeight: 500,
                letterSpacing: '0.02em',
                color: colors.subtext,
                textTransform: 'uppercase',
                transition: 'all 0.4s ease',
              }}
            >
              {getDateString()}
            </div>
          )}
        </div>

        {/* Settings toggle */}
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          aria-label="Настройки"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: colors.controlBg,
            color: colors.subtext,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            transform: settingsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.controlActive;
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.controlBg;
            e.currentTarget.style.color = colors.subtext;
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {/* Settings panel */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            left: '50%',
            transform: `translateX(-50%) ${settingsOpen ? 'translateY(0)' : 'translateY(-10px)'}`,
            opacity: settingsOpen ? 1 : 0,
            pointerEvents: settingsOpen ? 'auto' : 'none',
            background: colors.bg,
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: `1px solid ${colors.border}`,
            borderRadius: '24px',
            boxShadow: colors.shadow,
            padding: '20px',
            width: '320px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <SettingRow label="Формат времени">
              <SegmentedControl
                options={[
                  { label: '24ч', value: '24' },
                  { label: '12ч', value: '12' },
                ]}
                value={settings.timeFormat}
                onChange={(v) => setSettings({ ...settings, timeFormat: v as TimeFormat })}
                colors={colors}
              />
            </SettingRow>

            <SettingRow label="Секунды">
              <Toggle
                checked={settings.showSeconds}
                onChange={(v) => setSettings({ ...settings, showSeconds: v })}
                colors={colors}
              />
            </SettingRow>

            <SettingRow label="Дата">
              <Toggle
                checked={settings.showDate}
                onChange={(v) => setSettings({ ...settings, showDate: v })}
                colors={colors}
              />
            </SettingRow>

            {settings.showDate && (
              <SettingRow label="Формат даты">
                <SegmentedControl
                  options={[
                    { label: 'ДД.ММ.ГГГГ', value: 'DD.MM.YYYY' },
                    { label: 'ММ/ДД/ГГГГ', value: 'MM/DD/YYYY' },
                    { label: 'ГГГГ-ММ-ДД', value: 'YYYY-MM-DD' },
                  ]}
                  value={settings.dateFormat}
                  onChange={(v) => setSettings({ ...settings, dateFormat: v as DateFormat })}
                  colors={colors}
                />
              </SettingRow>
            )}

            <SettingRow label="Часовой пояс">
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                style={{
                  background: colors.controlBg,
                  color: colors.text,
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </SettingRow>

            <SettingRow label="Тема">
              <SegmentedControl
                options={[
                  { label: 'Светлая', value: 'light' },
                  { label: 'Тёмная', value: 'dark' },
                  { label: 'Авто', value: 'auto' },
                ]}
                value={settings.theme}
                onChange={(v) => setSettings({ ...settings, theme: v as Theme })}
                colors={colors}
              />
            </SettingRow>

            <SettingRow label="Размер">
              <SegmentedControl
                options={[
                  { label: 'S', value: 'sm' },
                  { label: 'M', value: 'md' },
                  { label: 'L', value: 'lg' },
                ]}
                value={settings.size}
                onChange={(v) => setSettings({ ...settings, size: v as Size })}
                colors={colors}
              />
            </SettingRow>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes tick {
          0% { opacity: 0.6; transform: translateY(-2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  children: React.ReactNode;
}

function SettingRow({ label, children }: SettingRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'inherit',
          opacity: 0.7,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

interface SegmentedControlProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  colors: any;
}

function SegmentedControl({ options, value, onChange, colors }: SegmentedControlProps) {
  return (
    <div
      style={{
        display: 'flex',
        background: colors.controlBg,
        borderRadius: '10px',
        padding: '2px',
        gap: '2px',
      }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            background: value === opt.value ? colors.controlActive : 'transparent',
            color: value === opt.value ? '#fff' : colors.text,
            border: 'none',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  colors: any;
}

function Toggle({ checked, onChange, colors }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '26px',
        borderRadius: '13px',
        background: checked ? colors.controlActive : colors.controlBg,
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.25s ease',
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '20px' : '2px',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </button>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';
import { NotificationSettings } from '@/components';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, settings, updateSettings } = useUserStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#a0a0b0', marginBottom: '16px' }}>Please log in to access settings</p>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              padding: '12px 24px',
              background: '#22d3bf',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: '#0a0a0f',
      padding: '32px 24px',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <button
            onClick={() => router.back()}
            onMouseEnter={() => setHoveredItem('back')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: hoveredItem === 'back' ? '#242424' : 'transparent',
              border: '1px solid #333333',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#ffffff',
          }}>
            Settings
          </h1>
        </div>

        {/* Display Settings */}
        <SettingsSection title="Display">
          <ToggleSetting
            label="Dark Theme"
            description="Use dark color scheme"
            value={settings.theme === 'dark'}
            onChange={(value) => updateSettings({ theme: value ? 'dark' : 'light' })}
            isHovered={hoveredItem === 'theme'}
            onHover={() => setHoveredItem('theme')}
            onLeave={() => setHoveredItem(null)}
          />
          <ToggleSetting
            label="Show Frequencies"
            description="Display action frequencies in ranges"
            value={settings.showFrequencies}
            onChange={(value) => updateSettings({ showFrequencies: value })}
            isHovered={hoveredItem === 'frequencies'}
            onHover={() => setHoveredItem('frequencies')}
            onLeave={() => setHoveredItem(null)}
          />
        </SettingsSection>

        {/* Sound Settings */}
        <SettingsSection title="Sound">
          <ToggleSetting
            label="Sound Effects"
            description="Play sounds for actions and feedback"
            value={settings.soundEnabled}
            onChange={(value) => updateSettings({ soundEnabled: value })}
            isHovered={hoveredItem === 'sound'}
            onHover={() => setHoveredItem('sound')}
            onLeave={() => setHoveredItem(null)}
          />
        </SettingsSection>

        {/* Notification Settings */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#666666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            paddingLeft: '4px',
          }}>
            Notifications
          </h2>
          <NotificationSettings />
        </div>

        {/* Game Settings */}
        <SettingsSection title="Game Defaults">
          <SliderSetting
            label="Default Stack Size"
            description="Starting stack in big blinds"
            value={settings.defaultStackSize}
            min={20}
            max={200}
            step={10}
            onChange={(value) => updateSettings({ defaultStackSize: value })}
            isHovered={hoveredItem === 'stack'}
            onHover={() => setHoveredItem('stack')}
            onLeave={() => setHoveredItem(null)}
          />
        </SettingsSection>

        {/* Account Section */}
        <SettingsSection title="Account">
          <div
            onMouseEnter={() => setHoveredItem('profile')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => router.push('/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: hoveredItem === 'profile' ? '#1a1a24' : 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <div>
              <p style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>View Profile</p>
              <p style={{ fontSize: '13px', color: '#666666' }}>Manage your account information</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
          <div
            onMouseEnter={() => setHoveredItem('subscription')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => router.push('/pricing')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: hoveredItem === 'subscription' ? '#1a1a24' : 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <div>
              <p style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>Subscription</p>
              <p style={{ fontSize: '13px', color: '#666666' }}>
                Current plan: <span style={{ color: '#22d3bf', textTransform: 'capitalize' }}>{user.subscription}</span>
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{
        fontSize: '14px',
        fontWeight: 600,
        color: '#666666',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '12px',
        paddingLeft: '4px',
      }}>
        {title}
      </h2>
      <div style={{
        background: '#12121a',
        border: '1px solid #333333',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  value,
  onChange,
  isHovered,
  onHover,
  onLeave,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        background: isHovered ? '#1a1a24' : 'transparent',
        borderBottom: '1px solid #333333',
        transition: 'background 0.15s ease',
      }}
    >
      <div>
        <p style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>{label}</p>
        <p style={{ fontSize: '13px', color: '#666666' }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '48px',
          height: '28px',
          borderRadius: '14px',
          background: value ? '#22d3bf' : '#333333',
          border: 'none',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        <span style={{
          position: 'absolute',
          top: '2px',
          left: value ? '22px' : '2px',
          width: '24px',
          height: '24px',
          borderRadius: '12px',
          background: '#ffffff',
          transition: 'left 0.2s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }} />
      </button>
    </div>
  );
}

function SliderSetting({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
  isHovered,
  onHover,
  onLeave,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        padding: '16px',
        background: isHovered ? '#1a1a24' : 'transparent',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>{label}</p>
          <p style={{ fontSize: '13px', color: '#666666' }}>{description}</p>
        </div>
        <span style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#22d3bf',
          minWidth: '60px',
          textAlign: 'right',
        }}>
          {value} BB
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '4px',
          borderRadius: '2px',
          background: `linear-gradient(to right, #22d3bf 0%, #22d3bf ${((value - min) / (max - min)) * 100}%, #333333 ${((value - min) / (max - min)) * 100}%, #333333 100%)`,
          appearance: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

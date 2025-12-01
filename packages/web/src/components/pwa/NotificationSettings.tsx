'use client';

import { usePushNotifications } from '@/hooks';
import './NotificationSettings.css';

export default function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    showNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="notification-settings">
        <div className="notification-header">
          <div className="notification-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="notification-info">
            <h3>推送通知</h3>
            <p className="not-supported">您的浏览器不支持推送通知</p>
          </div>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleTest = async () => {
    await showNotification('GTO Play', {
      body: '这是一条测试通知',
      tag: 'test-notification',
      data: { url: '/' },
    });
  };

  return (
    <div className="notification-settings">
      <div className="notification-header">
        <div className="notification-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div className="notification-info">
          <h3>推送通知</h3>
          <p>
            {permission === 'denied'
              ? '通知权限已被拒绝，请在浏览器设置中启用'
              : isSubscribed
              ? '已开启推送通知'
              : '开启后将收到练习提醒和社区消息'}
          </p>
        </div>
        <button
          className={`notification-toggle ${isSubscribed ? 'active' : ''}`}
          onClick={handleToggle}
          disabled={permission === 'denied'}
        >
          <span className="toggle-slider" />
        </button>
      </div>

      {isSubscribed && (
        <div className="notification-options">
          <div className="notification-types">
            <h4>通知类型</h4>
            <label className="notification-type">
              <input type="checkbox" defaultChecked />
              <span>每日练习提醒</span>
            </label>
            <label className="notification-type">
              <input type="checkbox" defaultChecked />
              <span>PK对战邀请</span>
            </label>
            <label className="notification-type">
              <input type="checkbox" defaultChecked />
              <span>社区回复通知</span>
            </label>
            <label className="notification-type">
              <input type="checkbox" defaultChecked />
              <span>学习小组活动</span>
            </label>
          </div>

          <button className="test-notification-btn" onClick={handleTest}>
            发送测试通知
          </button>
        </div>
      )}

      {permission === 'denied' && (
        <div className="notification-blocked">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>请在浏览器地址栏左侧点击锁图标，将通知权限设为"允许"</span>
        </div>
      )}
    </div>
  );
}

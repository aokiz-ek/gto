'use client';

import { useState } from 'react';
import { useWechatShare } from '@/hooks';

interface ShareButtonProps {
  title: string;
  desc: string;
  link?: string;
  imgUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function ShareButton({
  title,
  desc,
  link,
  imgUrl,
  className = '',
  size = 'md',
  variant = 'primary',
  showIcon = true,
  children,
}: ShareButtonProps) {
  const { share, isWeChat } = useWechatShare();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleShare = async () => {
    try {
      await share({
        title,
        desc,
        link: link || (typeof window !== 'undefined' ? window.location.href : ''),
        imgUrl: imgUrl || (typeof window !== 'undefined' ? `${window.location.origin}/share-icon.png` : ''),
      });

      // Show success toast (in WeChat, share menu opens automatically)
      if (!isWeChat) {
        setToastMessage('链接已复制到剪贴板');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    } catch {
      setToastMessage('分享失败，请重试');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className={`share-btn share-btn-${size} share-btn-${variant} ${className}`}
      >
        {showIcon && (
          <svg
            className="share-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        )}
        {children || '分享'}
      </button>

      {showToast && (
        <div className="share-toast">
          {toastMessage}
        </div>
      )}

      <style jsx>{`
        .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .share-btn:hover {
          transform: translateY(-1px);
        }

        .share-btn:active {
          transform: translateY(0);
        }

        /* Sizes */
        .share-btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .share-btn-md {
          padding: 10px 20px;
          font-size: 14px;
        }

        .share-btn-lg {
          padding: 14px 28px;
          font-size: 16px;
        }

        /* Variants */
        .share-btn-primary {
          background: linear-gradient(135deg, #00f5d4, #00c9a7);
          color: #0a0a0f;
        }

        .share-btn-primary:hover {
          background: linear-gradient(135deg, #00c9a7, #00f5d4);
          box-shadow: 0 4px 15px rgba(0, 245, 212, 0.4);
        }

        .share-btn-secondary {
          background: rgba(155, 93, 229, 0.2);
          color: #9b5de5;
          border: 1px solid rgba(155, 93, 229, 0.3);
        }

        .share-btn-secondary:hover {
          background: rgba(155, 93, 229, 0.3);
          box-shadow: 0 4px 15px rgba(155, 93, 229, 0.3);
        }

        .share-btn-ghost {
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .share-btn-ghost:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .share-icon {
          width: 16px;
          height: 16px;
        }

        .share-btn-sm .share-icon {
          width: 14px;
          height: 14px;
        }

        .share-btn-lg .share-icon {
          width: 18px;
          height: 18px;
        }

        .share-toast {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          padding: 12px 24px;
          border-radius: 24px;
          font-size: 14px;
          z-index: 10000;
          animation: toastIn 0.3s ease;
        }

        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </>
  );
}

export default ShareButton;

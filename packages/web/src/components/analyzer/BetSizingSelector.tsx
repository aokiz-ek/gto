'use client';

import { useState } from 'react';

interface BetSizingSelectorProps {
  selectedSize: number;
  onSizeChange: (size: number) => void;
  potSize?: number;
  disabled?: boolean;
}

const BET_SIZES = [
  { value: 0.33, label: '33%', description: '小注' },
  { value: 0.50, label: '50%', description: '半底池' },
  { value: 0.66, label: '66%', description: '中注' },
  { value: 0.75, label: '75%', description: '标准注' },
  { value: 1.00, label: '100%', description: '底池' },
  { value: 1.50, label: '150%', description: '超池' },
];

export function BetSizingSelector({
  selectedSize,
  onSizeChange,
  potSize = 100,
  disabled = false,
}: BetSizingSelectorProps) {
  const [customSize, setCustomSize] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomSubmit = () => {
    const value = parseFloat(customSize);
    if (!isNaN(value) && value > 0 && value <= 500) {
      onSizeChange(value / 100);
      setShowCustom(false);
      setCustomSize('');
    }
  };

  return (
    <div className="bet-sizing-selector">
      <style jsx>{`
        .bet-sizing-selector {
          background: #12121a;
          border-radius: 10px;
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sizing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .sizing-title {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
        }

        .pot-info {
          font-size: 11px;
          color: #666;
        }

        .pot-value {
          color: #22d3bf;
          font-weight: 600;
        }

        .sizing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-bottom: 10px;
        }

        .sizing-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 4px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.15s;
        }

        .sizing-btn:hover:not(.disabled) {
          background: rgba(34, 211, 191, 0.1);
          border-color: rgba(34, 211, 191, 0.3);
        }

        .sizing-btn.active {
          background: rgba(34, 211, 191, 0.15);
          border-color: #22d3bf;
        }

        .sizing-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sizing-label {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 2px;
        }

        .sizing-btn.active .sizing-label {
          color: #22d3bf;
        }

        .sizing-desc {
          font-size: 9px;
          color: #666;
        }

        .sizing-amount {
          font-size: 10px;
          color: #888;
          margin-top: 2px;
          font-family: 'SF Mono', monospace;
        }

        .custom-section {
          display: flex;
          gap: 6px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .custom-btn {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: #888;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .custom-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .custom-input-wrapper {
          display: flex;
          gap: 6px;
          flex: 1;
        }

        .custom-input {
          flex: 1;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 12px;
          font-family: 'SF Mono', monospace;
          outline: none;
        }

        .custom-input:focus {
          border-color: #22d3bf;
        }

        .custom-input::placeholder {
          color: #555;
        }

        .custom-submit {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          background: #22d3bf;
          color: #000;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .custom-submit:hover {
          filter: brightness(1.1);
        }

        .selected-info {
          margin-top: 10px;
          padding: 8px 10px;
          background: rgba(34, 211, 191, 0.08);
          border: 1px solid rgba(34, 211, 191, 0.2);
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .selected-label {
          font-size: 10px;
          color: #888;
        }

        .selected-value {
          font-size: 14px;
          font-weight: 700;
          color: #22d3bf;
          font-family: 'SF Mono', monospace;
        }
      `}</style>

      <div className="sizing-header">
        <span className="sizing-title">下注尺寸</span>
        <span className="pot-info">
          底池: <span className="pot-value">{potSize} BB</span>
        </span>
      </div>

      <div className="sizing-grid">
        {BET_SIZES.map((size) => (
          <button
            key={size.value}
            className={`sizing-btn ${selectedSize === size.value ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onSizeChange(size.value)}
            disabled={disabled}
          >
            <span className="sizing-label">{size.label}</span>
            <span className="sizing-desc">{size.description}</span>
            <span className="sizing-amount">{Math.round(potSize * size.value)} BB</span>
          </button>
        ))}
      </div>

      <div className="custom-section">
        {!showCustom ? (
          <button className="custom-btn" onClick={() => setShowCustom(true)}>
            自定义尺寸...
          </button>
        ) : (
          <div className="custom-input-wrapper">
            <input
              type="number"
              className="custom-input"
              placeholder="输入百分比 (如 125)"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              min="1"
              max="500"
            />
            <button className="custom-submit" onClick={handleCustomSubmit}>
              确认
            </button>
          </div>
        )}
      </div>

      <div className="selected-info">
        <span className="selected-label">当前下注</span>
        <span className="selected-value">{Math.round(potSize * selectedSize)} BB ({Math.round(selectedSize * 100)}%)</span>
      </div>
    </div>
  );
}

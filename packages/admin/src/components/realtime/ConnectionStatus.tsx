/**
 * HOOPERITS CMS - Connection Status Indicator
 * Visual indicator for WebSocket connection state
 */

'use client';

import React, { useState } from 'react';
import { useRealtimeStatus } from '@hooperits/client';
import type { ConnectionStatus as ConnectionStatusType } from '@hooperits/client';

export interface ConnectionStatusProps {
  /** Show text label next to indicator */
  showLabel?: boolean;
  /** Custom class name */
  className?: string;
}

const STATUS_CONFIG: Record<
  ConnectionStatusType,
  { color: string; bgColor: string; label: string; icon: string }
> = {
  connected: {
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    label: 'Connected',
    icon: '●',
  },
  connecting: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500',
    label: 'Connecting...',
    icon: '○',
  },
  authenticating: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500',
    label: 'Authenticating...',
    icon: '◑',
  },
  reconnecting: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500',
    label: 'Reconnecting...',
    icon: '◐',
  },
  disconnected: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-400',
    label: 'Offline',
    icon: '○',
  },
};

/**
 * Connection Status Indicator Component
 */
export function ConnectionStatus({
  showLabel = false,
  className = '',
}: ConnectionStatusProps) {
  const status = useRealtimeStatus();
  const [showTooltip, setShowTooltip] = useState(false);

  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`relative inline-flex items-center gap-1.5 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Status dot */}
      <span
        className={`inline-block w-2 h-2 rounded-full ${config.bgColor} ${
          status === 'reconnecting' || status === 'connecting' || status === 'authenticating'
            ? 'animate-pulse'
            : ''
        }`}
        aria-label={config.label}
      />

      {/* Optional label */}
      {showLabel && (
        <span className={`text-xs ${config.color}`}>{config.label}</span>
      )}

      {/* Tooltip */}
      {showTooltip && !showLabel && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
                     bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50"
        >
          {config.label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

/**
 * Connection Status Badge - larger version with more details
 */
export function ConnectionStatusBadge({ className = '' }: { className?: string }) {
  const status = useRealtimeStatus();
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                  ${status === 'connected' ? 'bg-green-50' : 'bg-gray-100'}
                  ${className}`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${config.bgColor} ${
          status === 'reconnecting' || status === 'connecting' || status === 'authenticating'
            ? 'animate-pulse'
            : ''
        }`}
      />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
}

export default ConnectionStatus;

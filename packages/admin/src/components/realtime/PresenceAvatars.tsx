/**
 * HOOPERITS CMS - Presence Avatars
 * Shows avatars of users currently viewing/editing a document
 */

'use client';

import React, { useState } from 'react';
import { useDocumentPresence, useDocumentEdit } from '@hooperits/client';
import type { PresenceInfo } from '@hooperits/client';

export interface PresenceAvatarsProps {
  /** Document ID to show presence for */
  documentId: string;
  /** Current user ID (to exclude from display) */
  currentUserId?: string;
  /** Maximum avatars to show before "+N" */
  maxAvatars?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
  /** Also track current user's presence */
  trackPresence?: boolean;
  /** Field being edited (for granular presence) */
  currentField?: string;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const OVERLAP_CLASSES = {
  sm: '-ml-2',
  md: '-ml-3',
  lg: '-ml-4',
};

/**
 * Generate initials from user name
 */
function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Generate a consistent color from string
 */
function getColorFromString(str: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Format time ago
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Single Avatar Component
 */
function Avatar({
  user,
  size = 'md',
  showTooltip = true,
}: {
  user: PresenceInfo;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`
          ${SIZE_CLASSES[size]}
          rounded-full
          ${getColorFromString(user.userId)}
          flex items-center justify-center
          text-white font-medium
          border-2 border-white
          shadow-sm
          transition-transform hover:scale-110 hover:z-10
        `}
        title={user.userName}
      >
        {getInitials(user.userName)}
      </div>

      {/* Editing indicator */}
      {user.field && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-yellow-400
                     rounded-full border-2 border-white"
          title={`Editing: ${user.field}`}
        />
      )}

      {/* Tooltip */}
      {showTooltip && isHovered && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2
                     bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50
                     shadow-lg"
        >
          <div className="font-medium">{user.userName}</div>
          <div className="text-gray-400 mt-0.5">
            {user.field ? (
              <span>Editing {user.field}</span>
            ) : (
              <span>Viewing</span>
            )}
            {' · '}
            {formatTimeAgo(user.joinedAt)}
          </div>
          <div
            className="absolute top-full left-1/2 -translate-x-1/2
                       border-4 border-transparent border-t-gray-900"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Presence Avatars Component
 */
export function PresenceAvatars({
  documentId,
  currentUserId,
  maxAvatars = 4,
  size = 'md',
  className = '',
  trackPresence = false,
  currentField,
}: PresenceAvatarsProps) {
  // Use appropriate hook based on trackPresence
  const presenceFromEdit = useDocumentEdit(
    trackPresence ? documentId : null,
    currentField
  );
  const presenceFromView = useDocumentPresence(
    trackPresence ? null : documentId
  );

  const allUsers = trackPresence ? presenceFromEdit : presenceFromView;

  // Filter out current user
  const otherUsers = currentUserId
    ? allUsers.filter((u) => u.userId !== currentUserId)
    : allUsers;

  if (otherUsers.length === 0) {
    return null;
  }

  const visibleUsers = otherUsers.slice(0, maxAvatars);
  const remainingCount = otherUsers.length - maxAvatars;

  return (
    <div className={`flex items-center ${className}`}>
      {visibleUsers.map((user, index) => (
        <div
          key={user.userId}
          className={index > 0 ? OVERLAP_CLASSES[size] : ''}
          style={{ zIndex: visibleUsers.length - index }}
        >
          <Avatar user={user} size={size} />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={`
            ${OVERLAP_CLASSES[size]}
            ${SIZE_CLASSES[size]}
            rounded-full
            bg-gray-200
            flex items-center justify-center
            text-gray-600 font-medium
            border-2 border-white
          `}
          title={`${remainingCount} more`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

/**
 * Presence List - shows all users in a list format
 */
export function PresenceList({
  documentId,
  currentUserId,
  className = '',
}: {
  documentId: string;
  currentUserId?: string;
  className?: string;
}) {
  const allUsers = useDocumentPresence(documentId);

  const otherUsers = currentUserId
    ? allUsers.filter((u) => u.userId !== currentUserId)
    : allUsers;

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        Also viewing ({otherUsers.length})
      </div>
      <div className="space-y-1">
        {otherUsers.map((user) => (
          <div key={user.userId} className="flex items-center gap-2">
            <Avatar user={user} size="sm" showTooltip={false} />
            <div className="text-sm">
              <span className="font-medium">{user.userName}</span>
              {user.field && (
                <span className="text-gray-500 ml-1">· editing {user.field}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PresenceAvatars;

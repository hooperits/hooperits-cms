'use client';

/**
 * HOOPERITS CMS - Header Component
 */

import { signOut, useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          {session?.user && (
            <>
              <span className="text-sm text-gray-600">
                {session.user.name}
                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded">
                  {session.user.role}
                </span>
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

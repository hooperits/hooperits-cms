'use client';

/**
 * HOOPERITS CMS - Sidebar Component
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ContentType {
  name: string;
  label: string;
  labelPlural: string;
  icon?: string;
}

interface SidebarProps {
  contentTypes: ContentType[];
}

const linkStyles = 'flex items-center px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900';

export function Sidebar({ contentTypes }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="sidebar-nav"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-nav"
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white min-h-screen flex flex-col transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-800">
          <Link
            href="/"
            className="text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            onClick={() => setIsOpen(false)}
          >
            HOOPERITS CMS
          </Link>
        </div>

        <nav className="flex-1 p-4" aria-label="Main navigation">
          <div className="mb-6">
            <Link
              href="/"
              className={`${linkStyles} ${
                pathname === '/' ? 'bg-gray-800' : 'hover:bg-gray-800'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </Link>
          </div>

          <div className="mb-2">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Content
            </h3>
          </div>

          <ul className="space-y-1" role="list">
            {contentTypes.map((type) => (
              <li key={type.name}>
                <Link
                  href={`/content/${type.name}`}
                  className={`${linkStyles} ${
                    pathname.startsWith(`/content/${type.name}`)
                      ? 'bg-gray-800'
                      : 'hover:bg-gray-800'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {type.labelPlural}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 mb-2">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Media
            </h3>
          </div>

          <Link
            href="/media"
            className={`${linkStyles} ${
              pathname === '/media' ? 'bg-gray-800' : 'hover:bg-gray-800'
            }`}
            onClick={() => setIsOpen(false)}
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Media Library
          </Link>
        </nav>
      </aside>
    </>
  );
}

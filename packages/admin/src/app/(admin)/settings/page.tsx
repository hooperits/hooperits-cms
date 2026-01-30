/**
 * HOOPERITS CMS - Settings Page
 */

import Link from 'next/link';

const SETTINGS_SECTIONS = [
  {
    title: 'Version Retention',
    description: 'Configure how long document versions are kept for each content type',
    href: '/settings/retention',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-500">
          Configure your CMS settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SETTINGS_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 p-3 bg-blue-100 text-blue-600 rounded-lg">
                {section.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

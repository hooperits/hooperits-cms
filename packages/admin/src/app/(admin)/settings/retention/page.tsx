/**
 * HOOPERITS CMS - Retention Policy Settings Page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RetentionPolicyForm } from '@/components/versioning';

interface ContentType {
  id: string;
  name: string;
  label: string;
}

interface RetentionPolicy {
  id: string;
  contentTypeId: string;
  maxVersions: number | null;
  maxAgeDays: number | null;
  keepNamedVersions: boolean;
  keepPublishVersions: boolean;
  cleanupSchedule: string;
  lastCleanupAt: Date | null;
  updatedBy: { name: string } | null;
  updatedAt: Date;
}

export default function RetentionSettingsPage() {
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [policies, setPolicies] = useState<Record<string, RetentionPolicy>>({});
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch content types
        const typesRes = await fetch('/api/cms/content-types');
        if (!typesRes.ok) throw new Error('Failed to fetch content types');
        const typesData = await typesRes.json();
        setContentTypes(typesData);

        // Fetch retention policies
        const policiesRes = await fetch('/api/cms/retention-policies');
        if (!policiesRes.ok) throw new Error('Failed to fetch retention policies');
        const policiesData = await policiesRes.json();

        // Map policies by content type ID
        const policiesMap: Record<string, RetentionPolicy> = {};
        for (const policy of policiesData) {
          policiesMap[policy.contentTypeId] = policy;
        }
        setPolicies(policiesMap);

        if (typesData.length > 0) {
          setSelectedType(typesData[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSavePolicy = async (typeId: string, updates: Partial<RetentionPolicy>) => {
    const res = await fetch(`/api/cms/retention-policies/${typeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      throw new Error('Failed to save policy');
    }

    const updatedPolicy = await res.json();
    setPolicies((prev) => ({
      ...prev,
      [typeId]: updatedPolicy,
    }));
  };

  const selectedPolicy = selectedType ? policies[selectedType] : null;
  const selectedTypeName = contentTypes.find((t) => t.id === selectedType)?.label || '';

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">
            Settings
          </Link>
          <span>/</span>
          <span className="text-gray-900">Retention Policies</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Version Retention Policies</h1>
        <p className="mt-1 text-gray-500">
          Configure how long versions are kept for each content type
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-4 gap-6">
          {/* Content Type Selector */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Content Types</h3>
              </div>
              <ul className="divide-y">
                {contentTypes.map((type) => (
                  <li key={type.id}>
                    <button
                      onClick={() => setSelectedType(type.id)}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 ${
                        selectedType === type.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {type.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Policy Form */}
          <div className="col-span-3">
            {selectedPolicy ? (
              <RetentionPolicyForm
                policy={selectedPolicy}
                contentTypeName={selectedTypeName}
                onSave={(updates) => handleSavePolicy(selectedType!, updates)}
              />
            ) : selectedType ? (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">
                  No retention policy configured for this content type.
                </p>
                <button
                  onClick={() => handleSavePolicy(selectedType, {
                    maxVersions: null,
                    maxAgeDays: null,
                    keepNamedVersions: true,
                    keepPublishVersions: true,
                    cleanupSchedule: '0 0 * * *',
                  })}
                  className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create Policy
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500">
                  Select a content type to configure its retention policy.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

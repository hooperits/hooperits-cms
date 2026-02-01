'use client';

/**
 * HOOPERITS CMS - Field Groups Renderer (Spec 007)
 * Renders fields organized by groups with support for different layout modes
 */

import { memo, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { SchemaDefinition, LayoutMode, FieldGroup } from '@hooperits/cms';
import { groupFieldsByGroup, getGroupsWithErrors } from '@hooperits/cms';
import { TabNavigation } from './TabNavigation';
import { CollapsibleGroup } from './CollapsibleGroup';

interface FieldGroupsRendererProps {
  /** Schema definition with groups */
  schema: SchemaDefinition;
  /** Function to render a field by name */
  renderField: (fieldName: string) => ReactNode;
  /** Map of field names to error status */
  fieldErrors?: Map<string, boolean> | Record<string, boolean>;
  /** Storage key for persisting collapsed states */
  persistenceKey?: string;
}

// Local storage key prefix for group states
const STORAGE_PREFIX = 'hooperits-cms-groups-';

/**
 * Saves collapsed states to localStorage
 */
function saveCollapsedStates(key: string, states: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(states));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Loads collapsed states from localStorage
 */
function loadCollapsedStates(key: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Main renderer component for grouped fields
 */
export const FieldGroupsRenderer = memo(function FieldGroupsRenderer({
  schema,
  renderField,
  fieldErrors = {},
  persistenceKey,
}: FieldGroupsRendererProps) {
  const layout: LayoutMode = schema.layout || 'default';
  const { groups, ungroupedFields, hasGroups } = groupFieldsByGroup(schema);

  // For tabs mode, track active tab
  const [activeTab, setActiveTab] = useState<string>(
    groups.length > 0 ? groups[0].group.name : ''
  );

  // For accordion mode, track collapsed states
  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>(
    () => (persistenceKey ? loadCollapsedStates(persistenceKey) : {})
  );

  // Get groups with errors
  const groupsWithErrors = getGroupsWithErrors(
    schema,
    fieldErrors instanceof Map
      ? Object.fromEntries(
          Array.from(fieldErrors.entries()).map(([k, v]) => [k, Boolean(v)])
        )
      : Object.fromEntries(
          Object.entries(fieldErrors).map(([k, v]) => [k, Boolean(v)])
        )
  );

  // Persist collapsed states when they change
  useEffect(() => {
    if (persistenceKey) {
      saveCollapsedStates(persistenceKey, collapsedStates);
    }
  }, [persistenceKey, collapsedStates]);

  // Handle collapsed state change for a group
  const handleCollapsedChange = useCallback((groupName: string, collapsed: boolean) => {
    setCollapsedStates((prev) => ({
      ...prev,
      [groupName]: collapsed,
    }));
  }, []);

  // If no groups, render fields directly
  if (!hasGroups) {
    return (
      <div className="space-y-6">
        {ungroupedFields.map(({ name }) => (
          <div key={name}>{renderField(name)}</div>
        ))}
      </div>
    );
  }

  // Render based on layout mode
  switch (layout) {
    case 'tabs':
      return (
        <div className="space-y-6">
          {/* Tab navigation */}
          <TabNavigation
            groups={groups.map((g) => g.group)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            groupsWithErrors={groupsWithErrors}
          />

          {/* Tab panels */}
          {groups.map(({ group, fields }) => (
            <div
              key={group.name}
              id={`tabpanel-${group.name}`}
              role="tabpanel"
              aria-labelledby={`tab-${group.name}`}
              hidden={activeTab !== group.name}
              className={activeTab === group.name ? 'space-y-6' : ''}
            >
              {activeTab === group.name && (
                <>
                  {/* Group description */}
                  {group.description && (
                    <p className="text-sm text-gray-600">{group.description}</p>
                  )}
                  {/* Fields in this group */}
                  {fields.map(({ name }) => (
                    <div key={name}>{renderField(name)}</div>
                  ))}
                </>
              )}
            </div>
          ))}

          {/* Ungrouped fields at the end */}
          {ungroupedFields.length > 0 && (
            <div className="pt-4 border-t border-gray-200 space-y-6">
              <h3 className="text-sm font-medium text-gray-500">Other Fields</h3>
              {ungroupedFields.map(({ name }) => (
                <div key={name}>{renderField(name)}</div>
              ))}
            </div>
          )}
        </div>
      );

    case 'accordion':
      return (
        <div className="space-y-4">
          {/* Groups as collapsible sections */}
          {groups.map(({ group, fields }) => (
            <CollapsibleGroup
              key={group.name}
              group={group}
              defaultCollapsed={collapsedStates[group.name]}
              hasError={groupsWithErrors.includes(group.name)}
              onCollapsedChange={(collapsed) =>
                handleCollapsedChange(group.name, collapsed)
              }
            >
              {fields.map(({ name }) => (
                <div key={name}>{renderField(name)}</div>
              ))}
            </CollapsibleGroup>
          ))}

          {/* Ungrouped fields at the end */}
          {ungroupedFields.length > 0 && (
            <div className="pt-4 space-y-6">
              <h3 className="text-sm font-medium text-gray-500">Other Fields</h3>
              {ungroupedFields.map(({ name }) => (
                <div key={name}>{renderField(name)}</div>
              ))}
            </div>
          )}
        </div>
      );

    case 'default':
    default:
      return (
        <div className="space-y-8">
          {/* Groups as sections */}
          {groups.map(({ group, fields }) => (
            <div key={group.name} className="space-y-4">
              <div
                className={`pb-2 border-b border-gray-200 ${
                  groupsWithErrors.includes(group.name) ? 'border-l-4 border-l-red-500 pl-3' : ''
                }`}
              >
                <h3 className="text-lg font-medium text-gray-900">{group.title}</h3>
                {group.description && (
                  <p className="text-sm text-gray-600">{group.description}</p>
                )}
              </div>
              <div className="space-y-6">
                {fields.map(({ name }) => (
                  <div key={name}>{renderField(name)}</div>
                ))}
              </div>
            </div>
          ))}

          {/* Ungrouped fields at the end */}
          {ungroupedFields.length > 0 && (
            <div className="space-y-6">
              {groups.length > 0 && (
                <h3 className="text-sm font-medium text-gray-500">Other Fields</h3>
              )}
              {ungroupedFields.map(({ name }) => (
                <div key={name}>{renderField(name)}</div>
              ))}
            </div>
          )}
        </div>
      );
  }
});

FieldGroupsRenderer.displayName = 'FieldGroupsRenderer';

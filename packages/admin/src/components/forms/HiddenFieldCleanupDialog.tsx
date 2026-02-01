'use client';

/**
 * HOOPERITS CMS - Hidden Field Cleanup Dialog (Spec 007)
 * Prompts user to decide what to do with values in hidden fields
 */

import { memo } from 'react';

interface HiddenFieldCleanupDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Field names that have values and are now hidden */
  fieldNames: string[];
  /** Field labels for display */
  fieldLabels: Record<string, string>;
  /** Callback when user chooses to keep values */
  onKeep: () => void;
  /** Callback when user chooses to clear values */
  onClear: () => void;
  /** Callback to close dialog */
  onClose: () => void;
}

/**
 * Dialog shown when fields with values become hidden
 * Asks user whether to keep or clear the hidden values
 */
export const HiddenFieldCleanupDialog = memo(function HiddenFieldCleanupDialog({
  isOpen,
  fieldNames,
  fieldLabels,
  onKeep,
  onClear,
  onClose,
}: HiddenFieldCleanupDialogProps) {
  if (!isOpen || fieldNames.length === 0) {
    return null;
  }

  const isSingleField = fieldNames.length === 1;
  const fieldListDisplay = fieldNames
    .map((name) => fieldLabels[name] || name)
    .join(', ');

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cleanup-dialog-title"
    >
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <h2
          id="cleanup-dialog-title"
          className="text-lg font-semibold text-gray-900 mb-2"
        >
          {isSingleField ? 'Hidden field has value' : 'Hidden fields have values'}
        </h2>

        <p className="text-gray-600 mb-4">
          The following {isSingleField ? 'field is' : 'fields are'} now hidden but{' '}
          {isSingleField ? 'still has a value' : 'still have values'}:
        </p>

        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <ul className="list-disc list-inside text-sm text-gray-700">
            {fieldNames.map((name) => (
              <li key={name}>{fieldLabels[name] || name}</li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Would you like to keep {isSingleField ? 'this value' : 'these values'} or
          clear {isSingleField ? 'it' : 'them'}?
        </p>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => {
              onKeep();
              onClose();
            }}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Keep {isSingleField ? 'value' : 'values'}
          </button>
          <button
            type="button"
            onClick={() => {
              onClear();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Clear {isSingleField ? 'value' : 'values'}
          </button>
        </div>
      </div>
    </div>
  );
});

HiddenFieldCleanupDialog.displayName = 'HiddenFieldCleanupDialog';

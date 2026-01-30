/**
 * HOOPERITS CMS - Diff Field Change
 * Displays individual field changes in version comparison
 */

'use client';

interface DiffChange {
  kind: 'added' | 'deleted' | 'modified' | 'array';
  path: string[];
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  items?: Array<{
    kind: 'added' | 'deleted' | 'modified';
    index: number;
    oldValue?: unknown;
    newValue?: unknown;
  }>;
}

interface Props {
  change: DiffChange;
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

const KIND_CONFIG = {
  added: {
    label: 'Added',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    badgeBg: 'bg-green-100',
  },
  deleted: {
    label: 'Deleted',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    badgeBg: 'bg-red-100',
  },
  modified: {
    label: 'Modified',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    badgeBg: 'bg-yellow-100',
  },
  array: {
    label: 'Array Changed',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeBg: 'bg-blue-100',
  },
};

export function DiffFieldChange({ change }: Props) {
  const config = KIND_CONFIG[change.kind];
  const fieldPath = change.path.length > 0
    ? `${change.path.join('.')}.${change.field}`
    : change.field;

  return (
    <div className={`rounded-md border ${config.borderColor} ${config.bgColor} overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-inherit">
        <code className="text-sm font-medium text-gray-900">{fieldPath}</code>
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.badgeBg} ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {change.kind === 'added' && (
          <div>
            <span className="text-xs text-gray-500 uppercase">New Value</span>
            <pre className="mt-1 p-2 bg-green-100 rounded text-sm text-green-800 overflow-auto">
              {formatValue(change.newValue)}
            </pre>
          </div>
        )}

        {change.kind === 'deleted' && (
          <div>
            <span className="text-xs text-gray-500 uppercase">Previous Value</span>
            <pre className="mt-1 p-2 bg-red-100 rounded text-sm text-red-800 overflow-auto line-through">
              {formatValue(change.oldValue)}
            </pre>
          </div>
        )}

        {change.kind === 'modified' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 uppercase">Previous</span>
              <pre className="mt-1 p-2 bg-red-100 rounded text-sm text-red-800 overflow-auto">
                {formatValue(change.oldValue)}
              </pre>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase">New</span>
              <pre className="mt-1 p-2 bg-green-100 rounded text-sm text-green-800 overflow-auto">
                {formatValue(change.newValue)}
              </pre>
            </div>
          </div>
        )}

        {change.kind === 'array' && change.items && (
          <div className="space-y-2">
            {change.items.map((item, idx) => (
              <div key={idx} className="text-sm">
                <span className={`font-medium ${
                  item.kind === 'added' ? 'text-green-700' :
                  item.kind === 'deleted' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  [{item.index}] {item.kind}
                </span>
                {item.kind === 'added' && (
                  <pre className="mt-1 p-2 bg-green-100 rounded text-xs">
                    {formatValue(item.newValue)}
                  </pre>
                )}
                {item.kind === 'deleted' && (
                  <pre className="mt-1 p-2 bg-red-100 rounded text-xs line-through">
                    {formatValue(item.oldValue)}
                  </pre>
                )}
                {item.kind === 'modified' && (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <pre className="p-2 bg-red-100 rounded text-xs">
                      {formatValue(item.oldValue)}
                    </pre>
                    <pre className="p-2 bg-green-100 rounded text-xs">
                      {formatValue(item.newValue)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DiffFieldChange;

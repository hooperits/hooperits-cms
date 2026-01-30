/**
 * HOOPERITS CMS - Inline Text Diff
 * Character-level diff visualization for text content
 */

'use client';

interface TextDiffSegment {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

interface Props {
  segments: TextDiffSegment[];
  showLineNumbers?: boolean;
}

export function InlineTextDiff({ segments, showLineNumbers = false }: Props) {
  if (!segments || segments.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No text differences
      </div>
    );
  }

  return (
    <div className="font-mono text-sm whitespace-pre-wrap p-4 bg-gray-50 rounded-md overflow-auto">
      {segments.map((segment, idx) => {
        let className = '';
        switch (segment.type) {
          case 'insert':
            className = 'bg-green-200 text-green-900';
            break;
          case 'delete':
            className = 'bg-red-200 text-red-900 line-through';
            break;
          default:
            className = 'text-gray-700';
        }

        return (
          <span key={idx} className={className}>
            {segment.text}
          </span>
        );
      })}
    </div>
  );
}

export default InlineTextDiff;

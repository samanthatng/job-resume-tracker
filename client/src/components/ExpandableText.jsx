import { useState } from 'react';

// Read-only text cell (e.g. tailoring notes preview) that can expand on click.
export default function ExpandableText({ text, emptyLabel = '—' }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return <span className="readonly-text">{emptyLabel}</span>;
  }

  return (
    <div>
      <div className={`readonly-text ${expanded ? 'expanded' : ''}`}>{text}</div>
      <button type="button" className="expand-toggle" onClick={() => setExpanded((v) => !v)}>
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}

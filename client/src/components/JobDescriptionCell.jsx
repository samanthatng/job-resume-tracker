import { useState } from 'react';

// Expandable textarea input for the Job Description column.
export default function JobDescriptionCell({ value, onChange, disabled }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <textarea
        className={`cell-input cell-textarea ${expanded ? 'expanded' : ''}`}
        value={value}
        placeholder="Paste job description..."
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" className="expand-toggle" onClick={() => setExpanded((v) => !v)}>
        {expanded ? 'Collapse' : 'Expand'}
      </button>
    </div>
  );
}

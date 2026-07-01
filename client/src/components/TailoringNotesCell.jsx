import { useState } from 'react';

// Expandable bullet list for the auto-filled Tailoring Notes column.
export default function TailoringNotesCell({ notes }) {
  const [expanded, setExpanded] = useState(false);

  if (!notes || notes.length === 0) {
    return <span className="readonly-text">—</span>;
  }

  const visibleNotes = expanded ? notes : notes.slice(0, 1);

  return (
    <div>
      <ul className="notes-list">
        {visibleNotes.map((note, i) => (
          <li key={i}>{note}</li>
        ))}
      </ul>
      {notes.length > 1 && (
        <button type="button" className="expand-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `Show all ${notes.length}`}
        </button>
      )}
    </div>
  );
}

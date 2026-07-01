import { useEffect, useState } from 'react';
import Row from './components/Row.jsx';

const STORAGE_KEY = 'resume-tracker-rows-v1';

function emptyRow() {
  return {
    id: (crypto.randomUUID && crypto.randomUUID()) || `row-${Date.now()}-${Math.random()}`,
    jobUrl: '',
    jobTitle: '',
    company: '',
    jobDescription: '',
    resumeTitle: '',
    driveLink: '',
    tailoringNotes: [],
    status: 'idle',
    errorMessage: '',
  };
}

function loadRows() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [emptyRow()];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return [emptyRow()];
  } catch {
    return [emptyRow()];
  }
}

export default function App() {
  const [rows, setRows] = useState(loadRows);
  const [generatingAll, setGeneratingAll] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function deleteRow(id) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  async function generateRow(id) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;

    updateRow(id, { status: 'generating', errorMessage: '' });

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUrl: row.jobUrl,
          jobTitle: row.jobTitle,
          company: row.company,
          jobDescription: row.jobDescription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      updateRow(id, {
        status: 'done',
        resumeTitle: data.resumeTitle,
        driveLink: data.driveLink,
        tailoringNotes: data.tailoringNotes || [],
        errorMessage: '',
      });
    } catch (err) {
      updateRow(id, { status: 'error', errorMessage: err.message || 'Generation failed.' });
    }
  }

  async function generateAll() {
    setGeneratingAll(true);
    const idleIds = rows.filter((r) => r.status === 'idle' || r.status === 'error').map((r) => r.id);
    for (const id of idleIds) {
      // Sequential by design, mirrors how the batch button is described in the spec.
      // eslint-disable-next-line no-await-in-loop
      await generateRow(id);
    }
    setGeneratingAll(false);
  }

  const anyGenerating = rows.some((r) => r.status === 'generating') || generatingAll;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Job Application Resume Tracker</h1>
          <div className="subtitle">Samantha S. Tng · {rows.length} application{rows.length === 1 ? '' : 's'}</div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={addRow} disabled={anyGenerating}>
            Add Row
          </button>
          <button className="btn" onClick={generateAll} disabled={anyGenerating}>
            {generatingAll ? 'Generating All...' : 'Generate All'}
          </button>
        </div>
      </header>

      <div className="table-scroll">
        <table className="sheet">
          <colgroup>
            <col className="col-url" />
            <col className="col-title" />
            <col className="col-company" />
            <col className="col-jd" />
            <col className="col-resume" />
            <col className="col-link" />
            <col className="col-notes" />
            <col className="col-status" />
            <col className="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Job URL</th>
              <th>Job Title</th>
              <th>Company</th>
              <th>Job Description</th>
              <th>Resume Title</th>
              <th>Google Drive Link</th>
              <th>Tailoring Notes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row
                key={row.id}
                row={row}
                isBusy={anyGenerating}
                onChange={(field, value) => updateRow(row.id, { [field]: value })}
                onGenerate={() => generateRow(row.id)}
                onDelete={() => deleteRow(row.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <footer className="app-footer">
        <button className="btn btn-secondary" onClick={addRow} disabled={anyGenerating}>
          + Add Row
        </button>
      </footer>
    </div>
  );
}

import StatusBadge from './StatusBadge.jsx';
import JobDescriptionCell from './JobDescriptionCell.jsx';
import TailoringNotesCell from './TailoringNotesCell.jsx';

export default function Row({ row, onChange, onGenerate, onDelete, isBusy }) {
  const disabled = row.status === 'generating';

  return (
    <tr>
      <td>
        <input
          className="cell-input"
          value={row.jobUrl}
          placeholder="https://..."
          disabled={disabled}
          onChange={(e) => onChange('jobUrl', e.target.value)}
        />
      </td>
      <td>
        <input
          className="cell-input"
          value={row.jobTitle}
          placeholder="Job title"
          disabled={disabled}
          onChange={(e) => onChange('jobTitle', e.target.value)}
        />
      </td>
      <td>
        <input
          className="cell-input"
          value={row.company}
          placeholder="Company"
          disabled={disabled}
          onChange={(e) => onChange('company', e.target.value)}
        />
      </td>
      <td>
        <JobDescriptionCell
          value={row.jobDescription}
          disabled={disabled}
          onChange={(v) => onChange('jobDescription', v)}
        />
      </td>
      <td>
        <span className="readonly-text expanded">{row.resumeTitle || '—'}</span>
      </td>
      <td>
        {row.driveLink ? (
          <a className="drive-link" href={row.driveLink} target="_blank" rel="noreferrer">
            Open in Drive
          </a>
        ) : (
          <span className="readonly-text">—</span>
        )}
      </td>
      <td>
        <TailoringNotesCell notes={row.tailoringNotes} />
      </td>
      <td>
        <StatusBadge status={row.status} />
        {row.status === 'error' && row.errorMessage && (
          <div className="error-msg">{row.errorMessage}</div>
        )}
      </td>
      <td>
        <div className="row-actions">
          <button
            type="button"
            className="btn btn-small"
            disabled={disabled || isBusy || !row.jobTitle || !row.company || !row.jobDescription}
            onClick={onGenerate}
          >
            {disabled ? 'Working...' : 'Generate'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            disabled={disabled}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

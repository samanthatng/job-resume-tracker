const LABELS = {
  idle: 'Idle',
  generating: 'Generating',
  done: 'Done',
  error: 'Error',
};

export default function StatusBadge({ status }) {
  const key = LABELS[status] ? status : 'idle';
  return <span className={`pill pill-${key}`}>{LABELS[key]}</span>;
}

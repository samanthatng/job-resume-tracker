// Parses the plain-text resume Claude returns into a structured shape the
// docx generator can style. Expects the structure requested in the system
// prompt: name line, contact line, then ALL-CAPS section headers, with
// EXPERIENCE roles formatted as "Title | Company | Dates" followed by
// "- bullet" lines.

function stripEmDashes(text) {
  // No em dashes anywhere in output; fall back to a comma if Claude slips one in.
  return text.replace(/\s*—\s*/g, ', ').replace(/\s*–\s*/g, ', ');
}

function isSectionHeader(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.includes('|')) return false;
  if (trimmed.startsWith('-') || trimmed.startsWith('•')) return false;
  // ALL CAPS (allow spaces, digits, punctuation), reasonably short
  return trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length < 40;
}

function isRoleLine(line) {
  return line.includes('|') && !line.trim().startsWith('-');
}

function isBulletLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('-') || trimmed.startsWith('•');
}

function parseResumeText(rawText) {
  const text = stripEmDashes(rawText).replace(/\r\n/g, '\n');
  const lines = text.split('\n').map((l) => l.trim());
  const nonEmpty = lines.filter((l) => l.length > 0);

  if (nonEmpty.length === 0) {
    return { name: 'Samantha S. Tng', contact: '', sections: [] };
  }

  const name = nonEmpty[0];
  const contact = nonEmpty[1] && !isSectionHeader(nonEmpty[1]) ? nonEmpty[1] : '';
  const consumedLines = contact ? 2 : 1;
  const bodyLines = nonEmpty.slice(consumedLines);

  const sections = [];
  let currentSection = null;
  let currentRole = null;

  for (const line of bodyLines) {
    if (!line) continue;

    if (isSectionHeader(line)) {
      currentSection = { header: line, paragraphs: [], roles: [], items: [] };
      sections.push(currentSection);
      currentRole = null;
      continue;
    }

    if (!currentSection) {
      // Content before any recognised header; treat as summary-like text.
      currentSection = { header: 'PROFESSIONAL SUMMARY', paragraphs: [], roles: [], items: [] };
      sections.push(currentSection);
    }

    const isExperience = currentSection.header.toUpperCase() === 'EXPERIENCE';

    if (isExperience && isRoleLine(line)) {
      const parts = line.split('|').map((p) => p.trim());
      currentRole = {
        title: parts[0] || '',
        company: parts[1] || '',
        dates: parts[2] || '',
        bullets: [],
        description: '',
      };
      currentSection.roles.push(currentRole);
      continue;
    }

    if (isExperience && isBulletLine(line)) {
      const bulletText = line.replace(/^[-•]\s*/, '');
      if (currentRole) {
        currentRole.bullets.push(bulletText);
      } else {
        currentSection.items.push(bulletText);
      }
      continue;
    }

    if (isExperience && currentRole) {
      // Narrative description line directly under a role header (before bullets)
      currentRole.description = currentRole.description
        ? `${currentRole.description} ${line}`
        : line;
      continue;
    }

    if (isBulletLine(line)) {
      currentSection.items.push(line.replace(/^[-•]\s*/, ''));
      continue;
    }

    // Plain paragraph text (summary, education lines, etc.)
    currentSection.paragraphs.push(line);
  }

  return { name, contact, sections };
}

module.exports = { parseResumeText, stripEmDashes };

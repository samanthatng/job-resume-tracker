// Builds filenames like Resume_Samantha_Stripe_BDDirector.docx
function toPascalToken(text) {
  return (text || '')
    .split(/[\s/,.\-_&]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
    .replace(/[^a-zA-Z0-9]/g, '');
}

function buildResumeFilename({ company, jobTitle }) {
  const companyToken = toPascalToken(company) || 'Company';
  const titleToken = toPascalToken(jobTitle) || 'Role';
  return `Resume_Samantha_${companyToken}_${titleToken}.docx`;
}

module.exports = { buildResumeFilename };

const express = require('express');
const cors = require('cors');

const { tailorResume } = require('./lib/claude');
const { generateDocxBuffer } = require('./lib/docxGenerator');
const { uploadResumeToDrive } = require('./lib/drive');
const { buildResumeFilename } = require('./lib/filename');
const { stripEmDashes } = require('./lib/resumeParser');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/generate', async (req, res) => {
  const { jobUrl, jobTitle, company, jobDescription } = req.body || {};

  if (!jobTitle || !company || !jobDescription) {
    return res.status(400).json({ error: 'jobTitle, company, and jobDescription are required.' });
  }

  try {
    const { resume, tailoringNotes } = await tailorResume({ jobUrl, jobTitle, company, jobDescription });
    const cleanResume = stripEmDashes(resume);

    const docxBuffer = await generateDocxBuffer(cleanResume);
    const resumeTitle = buildResumeFilename({ company, jobTitle });

    const driveLink = await uploadResumeToDrive(docxBuffer, resumeTitle);

    res.json({
      resumeTitle,
      driveLink,
      tailoringNotes,
    });
  } catch (err) {
    console.error('Generate failed:', err);
    res.status(500).json({ error: err.message || 'Resume generation failed.' });
  }
});

module.exports = app;

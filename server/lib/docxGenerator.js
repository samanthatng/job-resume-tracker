const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
} = require('docx');
const { parseResumeText } = require('./resumeParser');

const NAVY = '1F3A6E';
const FONT = 'Calibri';

const SECTION_TITLE_MAP = {
  'PROFESSIONAL SUMMARY': 'PROFESSIONAL SUMMARY',
  SUMMARY: 'PROFESSIONAL SUMMARY',
  EXPERIENCE: 'EXPERIENCE',
  EDUCATION: 'EDUCATION',
};

function nameParagraph(name) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 60 },
    children: [
      new TextRun({ text: name, bold: true, size: 34, color: NAVY, font: FONT }),
    ],
  });
}

function contactParagraph(contact) {
  return new Paragraph({
    spacing: { after: 240 },
    children: [new TextRun({ text: contact, size: 20, color: '444444', font: FONT })],
  });
}

function sectionHeaderParagraph(headerText) {
  const label = SECTION_TITLE_MAP[headerText.toUpperCase()] || headerText.toUpperCase();
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 4 },
    },
    children: [
      new TextRun({ text: label, bold: true, size: 22, color: NAVY, font: FONT, allCaps: true }),
    ],
  });
}

function paragraphText(text) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text, size: 22, font: FONT, color: '1A1A1A' })],
  });
}

function roleHeaderParagraph(role) {
  const children = [new TextRun({ text: role.title, bold: true, size: 22, font: FONT, color: '1A1A1A' })];
  if (role.company) {
    children.push(new TextRun({ text: '  |  ', size: 22, font: FONT, color: '666666' }));
    children.push(new TextRun({ text: role.company, italics: true, size: 22, font: FONT, color: '1A1A1A' }));
  }
  if (role.dates) {
    children.push(new TextRun({ text: '  |  ', size: 22, font: FONT, color: '666666' }));
    children.push(new TextRun({ text: role.dates, size: 22, font: FONT, color: '444444' }));
  }
  return new Paragraph({ spacing: { before: 160, after: 40 }, children });
}

function roleDescriptionParagraph(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, italics: true, size: 20, font: FONT, color: '444444' })],
  });
}

function bulletParagraph(text) {
  return new Paragraph({
    indent: { left: 360, hanging: 220 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: '●  ', bold: true, size: 20, font: FONT, color: NAVY }),
      new TextRun({ text, size: 21, font: FONT, color: '1A1A1A' }),
    ],
  });
}

function buildResumeDocument(resumeText) {
  const { name, contact, sections } = parseResumeText(resumeText);

  const children = [nameParagraph(name)];
  if (contact) children.push(contactParagraph(contact));

  for (const section of sections) {
    children.push(sectionHeaderParagraph(section.header));

    for (const paragraph of section.paragraphs) {
      children.push(paragraphText(paragraph));
    }

    for (const item of section.items) {
      children.push(bulletParagraph(item));
    }

    for (const role of section.roles) {
      children.push(roleHeaderParagraph(role));
      if (role.description) children.push(roleDescriptionParagraph(role.description));
      for (const bullet of role.bullets) {
        children.push(bulletParagraph(bullet));
      }
    }
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: '1A1A1A' },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
  });
}

async function generateDocxBuffer(resumeText) {
  const doc = buildResumeDocument(resumeText);
  return Packer.toBuffer(doc);
}

module.exports = { generateDocxBuffer };

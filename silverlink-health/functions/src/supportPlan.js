import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const CONTACT_PREFERENCES = Object.freeze(['Phone', 'Online', 'In person'])
export const MAX_SUPPORT_PLAN_RESOURCES = 3
export const MAX_SUPPORT_PLAN_NOTES_LENGTH = 500

export const SUPPORT_RESOURCES = Object.freeze([
  {
    id: 'lifeline-australia',
    title: 'Lifeline Australia',
    phone: '13 11 14',
    website: 'https://www.lifeline.org.au/',
  },
  {
    id: 'beyond-blue',
    title: 'Beyond Blue Support Service',
    phone: '1300 22 4636',
    website: 'https://www.beyondblue.org.au/',
  },
  {
    id: 'head-to-health',
    title: 'Head to Health',
    phone: '1800 595 212',
    website: 'https://www.headtohealth.gov.au/',
  },
  {
    id: 'friendline',
    title: 'FriendLine',
    phone: '1800 424 287',
    website: 'https://friendline.org.au/',
  },
  {
    id: 'grief-australia',
    title: 'Grief Australia',
    phone: '03 9265 2100',
    website: 'https://www.grief.org.au/',
  },
  {
    id: 'sleep-health-foundation',
    title: 'Sleep Health Foundation',
    phone: '',
    website: 'https://www.sleephealthfoundation.org.au/',
  },
])

const resourceById = new Map(SUPPORT_RESOURCES.map((resource) => [resource.id, resource]))
const allowedPayloadKeys = new Set(['resourceIds', 'contactPreference', 'notes'])
const unsafeControlCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u
const unsafeMarkupPattern = /[<>]/u

export class SupportPlanError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'SupportPlanError'
    this.code = code
  }
}

export function validateSupportPlanPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new SupportPlanError('invalid-argument', 'Enter a valid support plan.')
  }

  if (Object.keys(payload).some((key) => !allowedPayloadKeys.has(key))) {
    throw new SupportPlanError('invalid-argument', 'The support plan contains unsupported fields.')
  }

  const resourceIds = payload.resourceIds

  if (
    !Array.isArray(resourceIds) ||
    resourceIds.length < 1 ||
    resourceIds.length > MAX_SUPPORT_PLAN_RESOURCES ||
    resourceIds.some((id) => typeof id !== 'string' || !resourceById.has(id)) ||
    new Set(resourceIds).size !== resourceIds.length
  ) {
    throw new SupportPlanError(
      'invalid-argument',
      `Choose between 1 and ${MAX_SUPPORT_PLAN_RESOURCES} valid support services.`,
    )
  }

  if (!CONTACT_PREFERENCES.includes(payload.contactPreference)) {
    throw new SupportPlanError('invalid-argument', 'Choose a valid contact preference.')
  }

  if (typeof payload.notes !== 'string') {
    throw new SupportPlanError('invalid-argument', 'Enter valid support plan notes.')
  }

  const notes = payload.notes.trim()

  if (
    notes.length > MAX_SUPPORT_PLAN_NOTES_LENGTH ||
    unsafeControlCharacterPattern.test(notes) ||
    unsafeMarkupPattern.test(notes)
  ) {
    throw new SupportPlanError(
      'invalid-argument',
      `Notes must be plain text with no more than ${MAX_SUPPORT_PLAN_NOTES_LENGTH} characters.`,
    )
  }

  return {
    resourceIds: [...resourceIds],
    contactPreference: payload.contactPreference,
    notes,
  }
}

export function getSupportPlanResources(resourceIds) {
  return resourceIds.map((id) => resourceById.get(id))
}

export function maskEmail(email) {
  const [localPart, domain] = String(email).split('@')

  if (!localPart || !domain) {
    return 'your verified email address'
  }

  return `${localPart.slice(0, 1)}***@${domain}`
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildSupportPlanEmail({ recipientName, plan }) {
  const resources = getSupportPlanResources(plan.resourceIds)
  const resourceText = resources
    .map((resource) => {
      const phone = resource.phone ? ` | ${resource.phone}` : ''
      return `- ${resource.title}${phone} | ${resource.website}`
    })
    .join('\n')
  const resourceHtml = resources
    .map(
      (resource) =>
        `<li><strong>${escapeHtml(resource.title)}</strong>${
          resource.phone ? ` - ${escapeHtml(resource.phone)}` : ''
        }<br><a href="${resource.website}">${resource.website}</a></li>`,
    )
    .join('')
  const notesText = plan.notes || 'No personal notes were added.'
  const notesHtml = plan.notes
    ? escapeHtml(plan.notes).replaceAll('\n', '<br>')
    : 'No personal notes were added.'

  return {
    subject: 'Your SilverLink Health support plan',
    text: [
      `Hello ${recipientName},`,
      '',
      'Your SilverLink Health support plan is attached as a PDF.',
      '',
      `Preferred contact: ${plan.contactPreference}`,
      '',
      'Selected services:',
      resourceText,
      '',
      'Your notes:',
      notesText,
      '',
      'This information does not replace professional medical advice. In immediate danger, call Triple Zero (000).',
    ].join('\n'),
    html: [
      `<p>Hello ${escapeHtml(recipientName)},</p>`,
      '<p>Your SilverLink Health support plan is attached as a PDF.</p>',
      `<p><strong>Preferred contact:</strong> ${escapeHtml(plan.contactPreference)}</p>`,
      `<p><strong>Selected services:</strong></p><ul>${resourceHtml}</ul>`,
      `<p><strong>Your notes:</strong><br>${notesHtml}</p>`,
      '<p>This information does not replace professional medical advice. In immediate danger, call Triple Zero (000).</p>',
    ].join(''),
  }
}

function toPdfText(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[^\u0020-\u007E\u00A0-\u00FF\n]/gu, '?')
}

function wrapPdfText(text, font, size, maxWidth) {
  const lines = []

  for (const paragraph of toPdfText(text).split('\n')) {
    const words = paragraph.trim().split(/\s+/u).filter(Boolean)

    if (!words.length) {
      lines.push('')
      continue
    }

    let line = ''

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word

      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate
        continue
      }

      if (line) {
        lines.push(line)
      }

      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        line = word
        continue
      }

      let chunk = ''

      for (const character of word) {
        const candidateChunk = `${chunk}${character}`

        if (chunk && font.widthOfTextAtSize(candidateChunk, size) > maxWidth) {
          lines.push(chunk)
          chunk = character
        } else {
          chunk = candidateChunk
        }
      }

      line = chunk
    }

    if (line) {
      lines.push(line)
    }
  }

  return lines
}

export async function createSupportPlanPdf({ recipientName, recipientEmail, plan, createdAt }) {
  const document = await PDFDocument.create()
  const regularFont = await document.embedFont(StandardFonts.Helvetica)
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold)
  const resources = getSupportPlanResources(plan.resourceIds)
  const pageWidth = 595.28
  const pageHeight = 841.89
  const margin = 52
  const contentWidth = pageWidth - margin * 2
  let page
  let cursorY

  document.setTitle('SilverLink Health support plan')
  document.setSubject('Personal support service plan')
  document.setAuthor('SilverLink Health')
  document.setCreator('SilverLink Health Firebase Function')
  document.setCreationDate(createdAt)

  function addPage() {
    page = document.addPage([pageWidth, pageHeight])
    cursorY = pageHeight - margin
  }

  function ensureSpace(requiredHeight) {
    if (cursorY - requiredHeight < margin + 18) {
      addPage()
    }
  }

  function drawWrapped(text, { font = regularFont, size = 10.5, colour, gap = 4 } = {}) {
    const lines = wrapPdfText(text, font, size, contentWidth)
    const lineHeight = size * 1.38

    ensureSpace(Math.max(lineHeight, lines.length * lineHeight) + gap)

    for (const line of lines) {
      if (line) {
        page.drawText(line, {
          x: margin,
          y: cursorY,
          size,
          font,
          color: colour || rgb(0.14, 0.2, 0.22),
        })
      }
      cursorY -= lineHeight
    }

    cursorY -= gap
  }

  function drawLabel(label, value) {
    drawWrapped(label, { font: boldFont, size: 9, colour: rgb(0.14, 0.4, 0.37), gap: 2 })
    drawWrapped(value, { size: 10.5, gap: 12 })
  }

  addPage()
  page.drawRectangle({
    x: 0,
    y: pageHeight - 132,
    width: pageWidth,
    height: 132,
    color: rgb(0.92, 0.96, 0.95),
  })
  page.drawText('SilverLink Health', {
    x: margin,
    y: pageHeight - 58,
    size: 13,
    font: boldFont,
    color: rgb(0.14, 0.4, 0.37),
  })
  page.drawText('Your support plan', {
    x: margin,
    y: pageHeight - 92,
    size: 24,
    font: boldFont,
    color: rgb(0.08, 0.15, 0.17),
  })
  cursorY = pageHeight - 164

  drawLabel('Prepared for', `${recipientName} (${recipientEmail})`)
  drawLabel('Created', createdAt.toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }))
  drawLabel('Preferred contact', plan.contactPreference)
  drawWrapped('Selected support services', { font: boldFont, size: 15, gap: 12 })

  for (const resource of resources) {
    ensureSpace(92)
    drawWrapped(resource.title, { font: boldFont, size: 11.5, gap: 3 })
    if (resource.phone) {
      drawWrapped(`Phone: ${resource.phone}`, { size: 10, gap: 2 })
    }
    drawWrapped(`Website: ${resource.website}`, { size: 9.5, gap: 13 })
  }

  drawWrapped('Personal notes', { font: boldFont, size: 15, gap: 8 })
  drawWrapped(plan.notes || 'No personal notes were added.', { size: 10.5, gap: 16 })
  drawWrapped(
    'This support plan is a personal reference and does not replace professional medical advice. In immediate danger, call Triple Zero (000).',
    { font: boldFont, size: 9.5, colour: rgb(0.45, 0.15, 0.15), gap: 0 },
  )

  const pages = document.getPages()
  pages.forEach((currentPage, index) => {
    currentPage.drawText(`SilverLink Health | Page ${index + 1} of ${pages.length}`, {
      x: pageWidth - margin - 145,
      y: 28,
      size: 8,
      font: regularFont,
      color: rgb(0.36, 0.42, 0.44),
    })
  })

  return document.save()
}

export function createResendSender({ apiKey, fromAddress, fetchImpl = fetch }) {
  if (!apiKey || !fromAddress) {
    throw new SupportPlanError('internal', 'The email service is not configured.')
  }

  return async function sendWithResend({ to, subject, html, text, attachment }) {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html,
        text,
        attachments: [
          {
            filename: 'silverlink-support-plan.pdf',
            content: Buffer.from(attachment).toString('base64'),
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new SupportPlanError('unavailable', 'The email service could not send your plan.')
    }

    const result = await response.json()

    if (typeof result?.id !== 'string' || !result.id) {
      throw new SupportPlanError('unavailable', 'The email service returned an invalid response.')
    }

    return result.id
  }
}

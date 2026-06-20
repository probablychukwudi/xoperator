export interface ParsedIcsEvent {
  uid: string
  title: string
  startsAt: string
  endsAt?: string
  allDay: boolean
  location?: string
  description?: string
  url?: string
}

interface IcsProperty {
  name: string
  params: Record<string, string>
  value: string
}

function unfoldLines(text: string) {
  const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const lines: string[] = []

  for (const line of rawLines) {
    if (/^[ \t]/.test(line) && lines.length) {
      lines[lines.length - 1] += line.slice(1)
    } else if (line.trim()) {
      lines.push(line)
    }
  }

  return lines
}

function parseProperty(line: string): IcsProperty | null {
  const valueIndex = line.indexOf(':')
  if (valueIndex < 0) return null
  const left = line.slice(0, valueIndex)
  const value = line.slice(valueIndex + 1)
  const [name, ...paramParts] = left.split(';')
  const params: Record<string, string> = {}

  for (const part of paramParts) {
    const [key, ...rawValue] = part.split('=')
    if (key && rawValue.length) params[key.toUpperCase()] = rawValue.join('=').replace(/^"|"$/g, '')
  }

  return {
    name: name.toUpperCase(),
    params,
    value,
  }
}

function unescapeText(value?: string) {
  return (value || '')
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

function dateFromParts(value: string, utc: boolean) {
  const year = value.slice(0, 4)
  const month = value.slice(4, 6)
  const day = value.slice(6, 8)
  const hour = value.slice(9, 11) || '00'
  const minute = value.slice(11, 13) || '00'
  const second = value.slice(13, 15) || '00'
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${utc ? 'Z' : ''}`
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function parseIcsDate(value: string, params: Record<string, string>) {
  const clean = value.trim()
  if (params.VALUE === 'DATE' || /^\d{8}$/.test(clean)) {
    return {
      value: `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`,
      allDay: true,
    }
  }

  const normalized = clean.replace(/Z$/, '')
  if (/^\d{8}T\d{6}$/.test(normalized)) {
    return {
      value: dateFromParts(normalized, clean.endsWith('Z')),
      allDay: false,
    }
  }

  const date = new Date(clean)
  return {
    value: Number.isNaN(date.getTime()) ? '' : date.toISOString(),
    allDay: false,
  }
}

function eventBlocks(lines: string[]) {
  const blocks: string[][] = []
  let current: string[] | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = []
      continue
    }
    if (line === 'END:VEVENT') {
      if (current) blocks.push(current)
      current = null
      continue
    }
    if (current) current.push(line)
  }

  return blocks
}

export function parseIcsCalendar(text: string): ParsedIcsEvent[] {
  const lines = unfoldLines(text)
  const events: ParsedIcsEvent[] = []

  for (const [index, block] of eventBlocks(lines).entries()) {
    const properties = block.map(parseProperty).filter((property): property is IcsProperty => Boolean(property))
    const property = (name: string) => properties.find((item) => item.name === name)
    const starts = property('DTSTART')
    if (!starts) continue
    const start = parseIcsDate(starts.value, starts.params)
    if (!start.value) continue
    const ends = property('DTEND')
    const end = ends ? parseIcsDate(ends.value, ends.params).value : undefined

    events.push({
      uid: unescapeText(property('UID')?.value) || `event-${index}`,
      title: unescapeText(property('SUMMARY')?.value) || 'External event',
      startsAt: start.value,
      endsAt: end,
      allDay: start.allDay,
      location: unescapeText(property('LOCATION')?.value),
      description: unescapeText(property('DESCRIPTION')?.value),
      url: unescapeText(property('URL')?.value),
    })
  }

  return events
}

export function normalizeCalendarUrl(input: string) {
  const trimmed = input.trim()
  const withProtocol = trimmed.startsWith('webcal://') ? `https://${trimmed.slice('webcal://'.length)}` : trimmed
  const url = new URL(withProtocol)

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Use a calendar URL that starts with https:// or webcal://.')
  }

  return url.toString()
}

export async function fetchIcsCalendar(url: string, signal?: AbortSignal) {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal,
    })

    if (!response.ok) {
      throw new Error(`Calendar returned ${response.status}.`)
    }

    const text = await response.text()
    const events = parseIcsCalendar(text)
    if (!events.length) throw new Error('No events were found in that calendar.')
    return events
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Could not fetch that calendar. Import an .ics file if the provider blocks browser sync.')
    }
    throw error
  }
}

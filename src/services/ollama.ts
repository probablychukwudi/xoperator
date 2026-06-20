import { CAPITAL_BUCKETS, OPPORTUNITY_TYPES, PROJECT_TYPES } from '../store/useAppStore'
import { DOC_TYPES } from '../store/docTypes'

export const OLLAMA_MODEL = 'gemma4:12b-mlx'
export const OLLAMA_HOST = 'http://localhost:11434'

type OllamaRole = 'system' | 'user' | 'assistant'

interface OllamaMessage {
  role: OllamaRole
  content: string
}

interface OllamaChatResponse {
  message?: {
    content?: string
  }
}

export type QuickDropType = 'project' | 'opportunity' | 'person' | 'doc' | 'note' | 'expense'

export interface QuickDropSuggestion {
  type: QuickDropType
  title: string
  summary: string
  docType: string
  opportunityType: string
  capitalDirection: 'spent' | 'received'
  capitalBucket: string
  projectTags: string[]
  deadline: string
  value: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function stringFrom(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function enumValue<T extends string>(value: unknown, options: readonly T[], fallback: T) {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback
}

function inferTypeFromText(text: string, modelType: QuickDropType): QuickDropType {
  const normalized = text.toLowerCase()
  if (/pitch deck|prd|mrd|roadmap|patent|ip brief|one[- ]pager|gtm|go[- ]to[- ]market|business model canvas|feasibility/.test(normalized)) return 'doc'
  if (/deadline|apply|application|accelerator|yc|y combinator|grant|investor|hackathon|contract|proposal|award|partnership|prize/.test(normalized)) {
    return 'opportunity'
  }
  if (/\$|invoice|receipt|spent|paid|cost|expense|revenue|grant money|investment|salary/.test(normalized)) return 'expense'
  if (/linkedin|email|advisor|mentor|candidate|engineer|designer|customer|partner|intro|met with|call with/.test(normalized)) return 'person'
  if (/build|prototype|app|firmware|hardware|ios|macos|web app|experiment|schematic|dataset|model/.test(normalized)) return 'project'
  return modelType
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(content) as unknown
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('The model did not return JSON.')
    return JSON.parse(match[0]) as unknown
  }
}

async function chat(messages: OllamaMessage[], options?: { format?: unknown; temperature?: number; signal?: AbortSignal; timeoutMs?: number }) {
  const timeoutMs = options?.timeoutMs ?? 45000
  const controller = new AbortController()
  const abortFromCaller = () => controller.abort()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  if (options?.signal) {
    if (options.signal.aborted) controller.abort()
    options.signal.addEventListener('abort', abortFromCaller, { once: true })
  }

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        think: false,
        format: options?.format,
        options: {
          temperature: options?.temperature ?? 0.2,
          num_ctx: 8192,
        },
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(body.slice(0, 300) || `Ollama returned ${response.status}.`)
    }

    const payload = (await response.json()) as OllamaChatResponse
    return payload.message?.content?.trim() || ''
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`The local ${OLLAMA_MODEL} request timed out. Make sure Ollama is running, then try again.`)
    }
    if (error instanceof TypeError) {
      throw new Error(`xoperator could not reach Ollama at ${OLLAMA_HOST}. Start Ollama and try again.`)
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
    options?.signal?.removeEventListener('abort', abortFromCaller)
  }
}

export async function suggestQuickDrop(input: {
  text: string
  attachmentCount: number
  signal?: AbortSignal
}): Promise<QuickDropSuggestion> {
  const content = await chat(
    [
      {
        role: 'system',
        content:
          'You are the local xoperator triage assistant. Classify founder input into the best entity type and extract only useful structured fields. Return valid JSON only.',
      },
      {
        role: 'user',
        content: [
          `Today is ${new Date().toISOString().slice(0, 10)}.`,
          `Drop text: ${input.text || '(empty)'}`,
          `Attachment count: ${input.attachmentCount}`,
          'Return one JSON object only. No markdown.',
          'Use these exact keys: type, title, summary, docType, opportunityType, capitalDirection, capitalBucket, projectTags, deadline, value.',
          'Allowed type values: project, opportunity, person, doc, note, expense.',
          `Allowed docType values: ${DOC_TYPES.map((docType) => docType.id).join(', ')}.`,
          `Allowed opportunityType values: ${OPPORTUNITY_TYPES.join(', ')}.`,
          `Allowed capitalBucket values: ${CAPITAL_BUCKETS.join(', ')}.`,
          `Allowed projectTags values: ${PROJECT_TYPES.join(', ')}.`,
          'Choose project for things being built.',
          'Choose opportunity for accelerators, grants, investors, hackathons, contracts, jobs, awards, and partnerships.',
          'Choose person for contacts or relationship notes.',
          'Choose doc for pitch decks, PRDs, roadmaps, GTM plans, patent briefs, and founder documents.',
          'Choose expense for money spent or received.',
          'Choose note only when no stronger entity type fits.',
          'deadline must be yyyy-mm-dd if explicit, otherwise empty string.',
          'summary should be one sentence or empty if the input already says it all.',
        ].join('\n'),
      },
    ],
    { format: 'json', temperature: 0.1, signal: input.signal },
  )

  const parsed = parseJsonObject(content)
  if (!isRecord(parsed)) throw new Error('The model returned an unusable suggestion.')

  const modelType = enumValue(parsed.type, ['project', 'opportunity', 'person', 'doc', 'note', 'expense'], 'note')

  return {
    type: inferTypeFromText(input.text, modelType),
    title: stringFrom(parsed.title, input.text).trim() || input.text.trim() || 'Untitled drop',
    summary: stringFrom(parsed.summary).trim(),
    docType: enumValue(parsed.docType, DOC_TYPES.map((docType) => docType.id), 'custom'),
    opportunityType: enumValue(parsed.opportunityType, OPPORTUNITY_TYPES, 'accelerator'),
    capitalDirection: enumValue(parsed.capitalDirection, ['spent', 'received'], 'spent'),
    capitalBucket: enumValue(parsed.capitalBucket, CAPITAL_BUCKETS, 'other'),
    projectTags: arrayOfStrings(parsed.projectTags).filter((tag) => PROJECT_TYPES.includes(tag)),
    deadline: stringFrom(parsed.deadline).trim(),
    value: stringFrom(parsed.value).trim(),
  }
}

export async function draftDocSection(input: {
  docName: string
  docType: string
  sectionTitle: string
  existingNotes: string
  completedSections: string[]
  signal?: AbortSignal
}) {
  return chat(
    [
      {
        role: 'system',
        content:
          'You draft concise founder operating documents. Write useful Markdown only. No preamble, no apologies, no fake metrics.',
      },
      {
        role: 'user',
        content: [
          `Document: ${input.docName}`,
          `Document type: ${input.docType}`,
          `Section to draft: ${input.sectionTitle}`,
          `Completed sections: ${input.completedSections.join(', ') || 'none yet'}`,
          `Existing notes for this section: ${input.existingNotes || 'none'}`,
          '',
          'Draft this section in 4 to 8 tight bullets or short paragraphs.',
          'Use placeholders like [metric], [customer segment], or [date] when the exact fact is unknown.',
        ].join('\n'),
      },
    ],
    { temperature: 0.35, signal: input.signal },
  )
}

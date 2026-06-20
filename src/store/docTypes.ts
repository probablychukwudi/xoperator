import type { CustomDocTemplate, DocSection, FounderDoc } from '../types'
import { createId } from '../utils/id'

export interface DocTypeDefinition {
  id: string
  label: string
  sections: { title: string; optional?: boolean }[]
  minimumRequired?: number
}

export const DOC_TYPES: DocTypeDefinition[] = [
  {
    id: 'pitch-deck',
    label: 'Pitch deck',
    sections: [
      { title: 'Problem' },
      { title: 'Solution' },
      { title: 'Why now' },
      { title: 'Market size' },
      { title: 'Product' },
      { title: 'Business model' },
      { title: 'Traction' },
      { title: 'Team' },
      { title: 'Ask' },
      { title: 'Appendix' },
    ],
  },
  {
    id: 'prd',
    label: 'Product Requirements Document',
    minimumRequired: 7,
    sections: [
      { title: 'Problem statement' },
      { title: 'Goals and non-goals' },
      { title: 'User personas' },
      { title: 'User stories' },
      { title: 'Functional requirements' },
      { title: 'Non-functional requirements' },
      { title: 'Success metrics' },
      { title: 'Edge cases', optional: true },
      { title: 'Open questions', optional: true },
    ],
  },
  {
    id: 'mrd',
    label: 'Marketing Requirements Document',
    sections: [
      { title: 'Market overview' },
      { title: 'Target segments' },
      { title: 'Competitive landscape' },
      { title: 'Positioning' },
      { title: 'Messaging framework' },
      { title: 'Go-to-market motion' },
      { title: 'Launch channels' },
      { title: 'Success KPIs' },
    ],
  },
  {
    id: 'bmc',
    label: 'Business Model Canvas',
    sections: [
      { title: 'Customer segments' },
      { title: 'Value propositions' },
      { title: 'Channels' },
      { title: 'Customer relationships' },
      { title: 'Revenue streams' },
      { title: 'Key resources' },
      { title: 'Key activities' },
      { title: 'Key partnerships' },
      { title: 'Cost structure' },
    ],
  },
  {
    id: 'feasibility',
    label: 'Feasibility Report',
    sections: [
      { title: 'Problem definition' },
      { title: 'Technical approach' },
      { title: 'Data collection strategy' },
      { title: 'Data requirements' },
      { title: 'Classifier approach' },
      { title: 'Accuracy benchmarks' },
      { title: 'Hardware constraints' },
      { title: 'Timeline' },
      { title: 'Risk assessment' },
      { title: 'Conclusion' },
    ],
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    minimumRequired: 4,
    sections: [
      { title: 'Vision statement' },
      { title: 'Current stage' },
      { title: '30-day milestones' },
      { title: '90-day milestones' },
      { title: '6-month milestones', optional: true },
      { title: '12-month milestones', optional: true },
      { title: 'Key dependencies', optional: true },
      { title: 'Success metrics', optional: true },
    ],
  },
  {
    id: 'ip-brief',
    label: 'IP / Patent brief',
    sections: [
      { title: 'Invention title' },
      { title: 'Field of invention' },
      { title: 'Background' },
      { title: 'Summary' },
      { title: 'Claims independent' },
      { title: 'Claims dependent' },
      { title: 'Abstract' },
      { title: 'Prior art search' },
      { title: 'Filing timeline' },
    ],
  },
  {
    id: 'one-pager',
    label: 'Investor one-pager',
    sections: [
      { title: 'Headline' },
      { title: 'Problem' },
      { title: 'Solution' },
      { title: 'Traction' },
      { title: 'Market' },
      { title: 'Team' },
      { title: 'Ask' },
      { title: 'Contact' },
    ],
  },
  {
    id: 'gtm',
    label: 'Go-to-market plan',
    sections: [
      { title: 'Target segment' },
      { title: 'Beachhead strategy' },
      { title: 'Distribution channels' },
      { title: 'Pricing' },
      { title: 'Launch timeline' },
      { title: 'Metrics' },
      { title: 'Budget' },
    ],
  },
  {
    id: 'customer-discovery',
    label: 'Customer discovery report',
    sections: [
      { title: 'Research questions' },
      { title: 'Interview methodology' },
      { title: 'Participant profiles' },
      { title: 'Key findings' },
      { title: 'Patterns and themes' },
      { title: 'Validated assumptions' },
      { title: 'Invalidated assumptions' },
      { title: 'Next steps' },
    ],
  },
  {
    id: 'custom',
    label: 'Custom',
    sections: [{ title: 'First section' }],
  },
]

export function getAllDocTypes(customTemplates: CustomDocTemplate[] = []): DocTypeDefinition[] {
  return [
    ...DOC_TYPES,
    ...customTemplates.map((template) => ({
      id: template.id,
      label: template.name,
      sections: template.sections.length ? template.sections.map((title) => ({ title })) : [{ title: 'First section' }],
    })),
  ]
}

export function getDocType(docType: string, customTemplates: CustomDocTemplate[] = []) {
  return getAllDocTypes(customTemplates).find((type) => type.id === docType) ?? DOC_TYPES[0]
}

export function makeDocSections(docType: string, customTemplates: CustomDocTemplate[] = []): DocSection[] {
  return getDocType(docType, customTemplates).sections.map((section) => ({
    id: createId('sec'),
    title: section.title,
    done: false,
    optional: section.optional,
  }))
}

export function completionTarget(doc: Pick<FounderDoc, 'docType' | 'sections'>) {
  const definition = DOC_TYPES.find((type) => type.id === doc.docType)
  if (!definition) return doc.sections.filter((section) => !section.optional).length
  return definition.minimumRequired ?? doc.sections.filter((section) => !section.optional).length
}

export function completionCount(doc: Pick<FounderDoc, 'sections'>) {
  return doc.sections.filter((section) => section.done).length
}

export function completionPercent(doc: Pick<FounderDoc, 'docType' | 'sections'>) {
  const target = completionTarget(doc)
  if (!target) return 0
  return Math.min(100, Math.round((completionCount(doc) / target) * 100))
}

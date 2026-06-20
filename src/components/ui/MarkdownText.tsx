import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownText({ text }: { text?: string }) {
  if (!text?.trim()) return <span className="text-gray-400">No notes yet.</span>

  return (
    <div className="prose-founder text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  )
}

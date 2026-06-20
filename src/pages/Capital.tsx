import { FormEvent, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { CAPITAL_BUCKETS, useAppStore } from '../store/useAppStore'
import { formatShortDate, todayInputValue } from '../utils/dates'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyPrompt } from '../components/ui/EmptyPrompt'
import { PageHeading } from '../components/ui/PageHeading'
import { TextArea, TextInput, inputClass } from '../components/ui/TextInput'

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function Capital() {
  const capital = useAppStore((state) => state.capital)
  const addCapitalEntry = useAppStore((state) => state.addCapitalEntry)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<'spent' | 'received'>('spent')
  const [bucket, setBucket] = useState('other')
  const [date, setDate] = useState(todayInputValue())
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const summary = useMemo(() => {
    const spent = capital.filter((entry) => entry.direction === 'spent').reduce((total, entry) => total + entry.amount, 0)
    const received = capital.filter((entry) => entry.direction === 'received').reduce((total, entry) => total + entry.amount, 0)
    return {
      spent,
      received,
      net: received - spent,
    }
  }, [capital])

  const sorted = useMemo(() => [...capital].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)), [capital])

  function submit(event: FormEvent) {
    event.preventDefault()
    const parsedAmount = Number(amount)
    if (!description.trim()) {
      setError('Add a description before logging capital.')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount greater than 0.')
      return
    }
    addCapitalEntry({
      description: description.trim(),
      amount: parsedAmount,
      direction,
      bucket,
      date,
      note,
    })
    setDescription('')
    setAmount('')
    setDirection('spent')
    setBucket('other')
    setDate(todayInputValue())
    setNote('')
    setError('')
  }

  return (
    <div>
      <PageHeading title="Capital" eyebrow="Money in and out" />

      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Total invested</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{money(summary.spent)}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Total received</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{money(summary.received)}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Net position</p>
          <p className={summary.net >= 0 ? 'mt-2 text-2xl font-semibold text-signal' : 'mt-2 text-2xl font-semibold text-red-700'}>{money(summary.net)}</p>
        </div>
      </section>

      <form className="mb-5 rounded-lg border border-line bg-white p-4" onSubmit={submit}>
        <div className="grid gap-3 lg:grid-cols-[1fr_140px_150px_170px_160px]">
          <TextInput
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
              setError('')
            }}
            placeholder="Description"
          />
          <TextInput
            inputMode="decimal"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value)
              setError('')
            }}
            placeholder="Amount"
          />
          <select className={inputClass} value={direction} onChange={(event) => setDirection(event.target.value as 'spent' | 'received')}>
            <option value="spent">spent</option>
            <option value="received">received</option>
          </select>
          <select className={inputClass} value={bucket} onChange={(event) => setBucket(event.target.value)}>
            {CAPITAL_BUCKETS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <TextInput type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <TextArea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" className="min-h-11" />
          <Button variant="primary" type="submit" icon={<Plus size={17} aria-hidden="true" />}>
            Log it
          </Button>
        </div>
        {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      </form>

      {sorted.length ? (
        <div className="space-y-3">
          {sorted.map((entry) => (
            <article key={entry.id} className="grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="mr-2 truncate text-sm font-semibold text-ink">{entry.description}</h2>
                  <Badge tone={entry.direction === 'received' ? 'green' : 'amber'}>{entry.direction}</Badge>
                  <Badge>{entry.bucket}</Badge>
                </div>
                <p className="text-sm text-gray-500">{entry.note || 'No note.'}</p>
                <p className="mt-2 text-xs font-medium text-gray-500">{formatShortDate(entry.date)}</p>
              </div>
              <p className={entry.direction === 'received' ? 'text-lg font-semibold text-signal' : 'text-lg font-semibold text-red-700'}>
                {entry.direction === 'received' ? '+' : '-'}
                {money(entry.amount)}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyPrompt />
      )}
    </div>
  )
}

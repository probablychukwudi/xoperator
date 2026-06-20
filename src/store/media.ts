import { openDB } from 'idb'
import type { Attachment, AttachmentType } from '../types'
import { createId } from '../utils/id'
import { nowIso } from '../utils/dates'

const DB_NAME = 'owo-os-media'
const STORE_NAME = 'blobs'

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    },
  })
}

function attachmentTypeFor(file: File): AttachmentType {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf'
  return 'link'
}

export async function storeMediaBlob(file: File) {
  const db = await getDb()
  const idbKey = createId('media')
  await db.put(STORE_NAME, file, idbKey)
  return idbKey
}

export async function getMediaBlob(idbKey: string) {
  const db = await getDb()
  return db.get(STORE_NAME, idbKey) as Promise<Blob | undefined>
}

export async function deleteMediaBlob(idbKey: string) {
  const db = await getDb()
  await db.delete(STORE_NAME, idbKey)
}

export async function createAttachmentFromFile(file: File): Promise<Attachment> {
  const idbKey = await storeMediaBlob(file)
  return {
    id: createId('att'),
    type: attachmentTypeFor(file),
    label: file.name,
    url: URL.createObjectURL(file),
    idbKey,
    createdAt: nowIso(),
  }
}

export function createLinkAttachment(url: string, label?: string): Attachment {
  return {
    id: createId('att'),
    type: 'link',
    label: label || url,
    url,
    createdAt: nowIso(),
  }
}

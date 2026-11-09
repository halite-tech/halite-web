export type ContextFileMetadata = {
  name: string
  type: string
  size: number
  lastModified: number
}

type StoredContextFile = ContextFileMetadata & { userId: string; blob: Blob }

const DATABASE_NAME = "halite-context"
const STORE_NAME = "files"
const METADATA_PREFIX = "halite-context-metadata:"
export const CONTEXT_CHANGED_EVENT = "halite-context-changed"

function metadataKey(userId: string) {
  return `${METADATA_PREFIX}${userId}`
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Could not open browser file storage"))
  })
}

function readMetadata(userId: string): ContextFileMetadata[] {
  try {
    return JSON.parse(localStorage.getItem(metadataKey(userId)) ?? "[]") as ContextFileMetadata[]
  } catch {
    return []
  }
}

function writeMetadata(userId: string, files: ContextFileMetadata[]) {
  localStorage.setItem(metadataKey(userId), JSON.stringify(files))
}

export async function listContextFiles(userId: string) {
  return readMetadata(userId)
}

export async function saveContextFiles(userId: string, files: File[]) {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    for (const file of files) {
      const key = `${userId}:${file.name}`
      store.put({
        userId,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: Date.now(),
        blob: file,
      } satisfies StoredContextFile, key)
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save files in browser storage"))
  })
  const existing = readMetadata(userId)
  const replacements = new Map(files.map((file) => [
    file.name,
    { name: file.name, type: file.type, size: file.size, lastModified: Date.now() },
  ]))
  writeMetadata(userId, [...existing.filter((file) => !replacements.has(file.name)), ...replacements.values()])
  window.dispatchEvent(new Event(CONTEXT_CHANGED_EVENT))
  database.close()
}

export async function deleteContextFiles(userId: string, names: string[]) {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    names.forEach((name) => store.delete(`${userId}:${name}`))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not delete files from browser storage"))
  })
  const deleted = new Set(names)
  writeMetadata(userId, readMetadata(userId).filter((file) => !deleted.has(file.name)))
  window.dispatchEvent(new Event(CONTEXT_CHANGED_EVENT))
  database.close()
}

export async function readContextFiles(userId: string) {
  const database = await openDatabase()
  const files = await new Promise<StoredContextFile[]>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly")
    const request = transaction.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result.filter((file) => file.userId === userId))
    request.onerror = () => reject(request.error ?? new Error("Could not read files from browser storage"))
  })
  database.close()
  return files.map((file) => new File([file.blob], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  }))
}

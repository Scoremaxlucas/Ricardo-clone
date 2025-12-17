'use client'

import { Calendar, Edit2, FileText, Plus, Trash2, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface UserNote {
  id: string
  note: string
  createdAt: string
  updatedAt: string
  admin: {
    id: string
    email: string
    name: string | null
    firstName: string | null
    lastName: string | null
    nickname: string | null
  }
}

interface UserNotesModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string | null
}

export function UserNotesModal({ isOpen, onClose, userId, userName }: UserNotesModalProps) {
  const [notes, setNotes] = useState<UserNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteText, setEditingNoteText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      loadNotes()
    }
  }, [isOpen, userId])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
      } else {
        toast.error('Fehler beim Laden der Notizen')
      }
    } catch (error) {
      console.error('Error loading notes:', error)
      toast.error('Fehler beim Laden der Notizen')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Notiz darf nicht leer sein')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      })

      if (res.ok) {
        const note = await res.json()
        setNotes([note, ...notes])
        setNewNote('')
        setShowAddForm(false)
        toast.success('Notiz hinzugefügt')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Hinzufügen der Notiz')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Fehler beim Hinzufügen der Notiz')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteText.trim()) {
      toast.error('Notiz darf nicht leer sein')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: editingNoteText }),
      })

      if (res.ok) {
        const updatedNote = await res.json()
        setNotes(notes.map(n => (n.id === noteId ? updatedNote : n)))
        setEditingNoteId(null)
        setEditingNoteText('')
        toast.success('Notiz aktualisiert')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Aktualisieren der Notiz')
      }
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error('Fehler beim Aktualisieren der Notiz')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Möchten Sie diese Notiz wirklich löschen?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}/notes/${noteId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setNotes(notes.filter(n => n.id !== noteId))
        toast.success('Notiz gelöscht')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Fehler beim Löschen der Notiz')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Fehler beim Löschen der Notiz')
    }
  }

  const startEditing = (note: UserNote) => {
    setEditingNoteId(note.id)
    setEditingNoteText(note.note)
  }

  const cancelEditing = () => {
    setEditingNoteId(null)
    setEditingNoteText('')
  }

  const getAdminName = (admin: UserNote['admin']) => {
    return admin.name || `${admin.firstName} ${admin.lastName}` || admin.nickname || admin.email
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notizen</h2>
              <p className="text-sm text-gray-500">
                {userName || 'Benutzer'} - {notes.length} Notiz{notes.length !== 1 ? 'en' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-200px)] overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Note Form */}
              {showAddForm ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <textarea
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="Notiz eingeben..."
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={4}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={handleAddNote}
                      disabled={saving}
                      className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {saving ? 'Speichern...' : 'Hinzufügen'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false)
                        setNewNote('')
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 text-gray-600 hover:border-primary-500 hover:text-primary-600"
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Neue Notiz hinzufügen</span>
                </button>
              )}

              {/* Notes List */}
              {notes.length === 0 && !showAddForm ? (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600">Keine Notizen vorhanden</p>
                </div>
              ) : (
                notes.map(note => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    {editingNoteId === note.id ? (
                      <div>
                        <textarea
                          value={editingNoteText}
                          onChange={e => setEditingNoteText(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          rows={4}
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={saving}
                            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                          >
                            {saving ? 'Speichern...' : 'Speichern'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-3 whitespace-pre-wrap text-sm text-gray-700">
                          {note.note}
                        </p>
                        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {getAdminName(note.admin)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(note.createdAt).toLocaleString('de-CH', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(note)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                              title="Bearbeiten"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}













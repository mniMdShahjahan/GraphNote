import React, { useState, useEffect } from 'react';
import { db, auth, OperationType, handleFirestoreError, Timestamp } from '../lib/firebase';
import { doc, getDoc, addDoc, collection, updateDoc, deleteDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { X, Save, Trash2, Tag, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { suggestRelationships } from '../lib/gemini';

interface NoteEditorProps {
  noteId: string | null;
  onClose: () => void;
}

export default function NoteEditor({ noteId, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (noteId) {
      const fetchNote = async () => {
        try {
          const docRef = doc(db, 'notes', noteId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setTitle(data.title);
            setContent(data.content);
            setTags(data.tags || []);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `notes/${noteId}`);
        }
      };
      fetchNote();
    } else {
      setTitle('');
      // Automatically add date and time to new notes
      const now = new Date();
      const dateStr = now.toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setContent(`### 📅 Knowledge Entry: ${dateStr}\n\n---\n\n`);
      setTags([]);
    }
  }, [noteId]);

  const handleSave = async () => {
    if (!auth.currentUser || !title.trim()) return;
    setLoading(true);

    try {
      const noteData = {
        userId: auth.currentUser.uid,
        title,
        content,
        tags,
        updatedAt: serverTimestamp()
      };

      if (noteId) {
        await updateDoc(doc(db, 'notes', noteId), noteData);
      } else {
        await addDoc(collection(db, 'notes'), {
          ...noteData,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    // Using a simpler check instead of window.confirm to avoid iframe issues
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notes/${noteId}`);
    } finally {
      setLoading(false);
    }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSuggest = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      // Fetch other notes for context
      const q = query(collection(db, 'notes'), where('userId', '==', auth.currentUser?.uid));
      const snapshot = await getDocs(q);
      const existingNotes = snapshot.docs
        .filter(d => d.id !== noteId)
        .map(d => ({ id: d.id, title: d.data().title }));

      const suggestions = await suggestRelationships(title, content, existingNotes);
      if (suggestions && suggestions.length > 0) {
        const first = suggestions[0];
        // Auto-link the first suggestion for now to avoid window.confirm
        await addDoc(collection(db, 'relationships'), {
          userId: auth.currentUser?.uid,
          sourceNoteId: noteId || 'temp',
          targetNoteId: first.targetNoteId,
          relationType: first.relationType,
          description: first.description,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Suggestion failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-bottom flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {noteId ? 'Edit Note' : 'New Knowledge Note'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {noteId && (
              <button
                onClick={handleSuggest}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="AI Suggest Connections"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI Suggest</span>
              </button>
            )}
            {noteId && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setPreview(!preview)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !title.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Note'}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-3xl font-bold border-none focus:ring-0 placeholder:text-slate-300"
          />

          <div className="flex flex-wrap gap-2 items-center">
            <Tag className="w-4 h-4 text-slate-400" />
            {tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-md flex items-center gap-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-indigo-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              className="text-xs border-none focus:ring-0 p-1 w-24"
            />
          </div>

          {preview ? (
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-8 overflow-y-auto">
              <div className="prose max-w-none">
                {content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p className="text-slate-400 italic">No content to preview. Start typing in the editor.</p>
                )}
              </div>
            </div>
          ) : (
            <textarea
              placeholder="Start writing your knowledge... (Markdown supported)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[400px] text-lg border-none focus:ring-0 resize-none placeholder:text-slate-300 font-mono bg-transparent"
            />
          )}
        </div>
      </div>
    </div>
  );
}

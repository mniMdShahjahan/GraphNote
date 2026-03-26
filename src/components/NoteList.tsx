import React, { useState, useEffect } from 'react';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { Search, FileText, Calendar, Tag, Plus } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface NoteListProps {
  onNoteSelect: (id: string) => void;
  onNewNote: () => void;
}

export default function NoteList({ onNoteSelect, onNewNote }: NoteListProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notes'));

    return () => unsubscribe();
  }, []);

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(search.toLowerCase()) ||
    note.content.toLowerCase().includes(search.toLowerCase()) ||
    note.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-white shrink-0">
      <div className="p-4 border-b border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">My Notes</h2>
          <button
            onClick={onNewNote}
            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search knowledge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                <div className="h-3 bg-slate-50 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => onNoteSelect(note.id)}
                className="w-full p-4 text-left hover:bg-slate-50 transition-colors group"
              >
                <h3 className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                  {note.title}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(note.updatedAt)}
                  </span>
                  {note.tags && note.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {note.tags[0]}
                      {note.tags.length > 1 && `+${note.tags.length - 1}`}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <FileText className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">No notes found</p>
          </div>
        )}
      </div>
    </div>
  );
}

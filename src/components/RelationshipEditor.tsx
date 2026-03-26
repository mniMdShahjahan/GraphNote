import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { X, Save, Trash2, Link as LinkIcon } from 'lucide-react';

interface RelationshipEditorProps {
  relationshipId: string | null;
  onClose: () => void;
}

const RELATION_TYPES = [
  { value: 'depends_on', label: 'Depends On' },
  { value: 'related_to', label: 'Related To' },
  { value: 'example_of', label: 'Example Of' },
  { value: 'part_of', label: 'Part Of' },
  { value: 'custom', label: 'Custom' }
];

export default function RelationshipEditor({ relationshipId, onClose }: RelationshipEditorProps) {
  const [relationType, setRelationType] = useState('related_to');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [sourceTitle, setSourceTitle] = useState('');
  const [targetTitle, setTargetTitle] = useState('');

  useEffect(() => {
    if (relationshipId) {
      const fetchRelationship = async () => {
        try {
          const docRef = doc(db, 'relationships', relationshipId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRelationType(data.relationType);
            setDescription(data.description || '');

            // Fetch note titles for context
            const sourceSnap = await getDoc(doc(db, 'notes', data.sourceNoteId));
            const targetSnap = await getDoc(doc(db, 'notes', data.targetNoteId));
            
            if (sourceSnap.exists()) setSourceTitle(sourceSnap.data().title);
            if (targetSnap.exists()) setTargetTitle(targetSnap.data().title);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `relationships/${relationshipId}`);
        }
      };
      fetchRelationship();
    }
  }, [relationshipId]);

  const handleSave = async () => {
    if (!relationshipId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'relationships', relationshipId), {
        relationType,
        description,
        updatedAt: new Date()
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `relationships/${relationshipId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!relationshipId) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'relationships', relationshipId));
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `relationships/${relationshipId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Edit Relationship</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center gap-4 text-sm font-medium text-slate-500">
            <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 truncate max-w-[120px]">{sourceTitle || '...'}</span>
            <span className="text-indigo-400">→</span>
            <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 truncate max-w-[120px]">{targetTitle || '...'}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Relationship Type</label>
            <select
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              {RELATION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How do these notes relate?"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

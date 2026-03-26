import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Auth from './components/Auth';
import GraphView from './components/GraphView';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import RelationshipEditor from './components/RelationshipEditor';
import { Brain, Network, List, Layout, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './lib/firebase';
import { autoGraphKnowledgeBase } from './lib/gemini';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [isAutoGraphing, setIsAutoGraphing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAutoGraph = async () => {
    if (!user) return;
    setIsAutoGraphing(true);
    try {
      const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const notes = snapshot.docs.map(d => ({ 
        id: d.id, 
        title: d.data().title, 
        content: d.data().content 
      }));

      if (notes.length < 2) {
        alert("You need at least 2 notes to auto-graph.");
        return;
      }

      const suggestedRels = await autoGraphKnowledgeBase(notes);
      
      // Batch create relationships (simplified, not using actual WriteBatch for brevity)
      for (const rel of suggestedRels) {
        await addDoc(collection(db, 'relationships'), {
          userId: user.uid,
          sourceNoteId: rel.sourceNoteId,
          targetNoteId: rel.targetNoteId,
          relationType: rel.relationType,
          description: rel.description,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'relationships');
    } finally {
      setIsAutoGraphing(false);
    }
  };

  const handleNoteSelect = (id: string) => {
    setSelectedNoteId(id);
    setIsEditorOpen(true);
  };

  const handleRelationshipSelect = (id: string) => {
    setSelectedRelationshipId(id);
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setIsEditorOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading Knowledge Graph...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="inline-flex p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Personal Knowledge Graph
            </h1>
            <p className="text-slate-500 text-lg">
              Connect your thoughts, visualize your learning, and build your digital second brain.
            </p>
          </div>
          <div className="pt-4">
            <Auth />
          </div>
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <Network className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Graph View</p>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Insights</p>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
              <Layout className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Markdown</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 tracking-tight hidden sm:inline">KnowledgeGraph</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'graph' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Network className="w-4 h-4" />
            <span className="hidden md:inline">Graph</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-4 h-4" />
            <span className="hidden md:inline">Notes</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleAutoGraph}
            disabled={isAutoGraphing}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-md disabled:opacity-50"
          >
            <Wand2 className={`w-4 h-4 ${isAutoGraphing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isAutoGraphing ? 'AI Graphing...' : 'AI Auto-Graph'}</span>
          </button>
          <Auth />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        <div className={`${viewMode === 'list' ? 'w-full' : 'w-80 border-r border-slate-200'} transition-all duration-300`}>
          <NoteList onNoteSelect={handleNoteSelect} onNewNote={handleNewNote} />
        </div>
        
        {viewMode === 'graph' && (
          <div className="flex-1 relative">
            <GraphView onNodeClick={handleNoteSelect} onEdgeClick={handleRelationshipSelect} />
          </div>
        )}

        <AnimatePresence>
          {selectedRelationshipId && (
            <RelationshipEditor 
              relationshipId={selectedRelationshipId} 
              onClose={() => setSelectedRelationshipId(null)} 
            />
          )}
          {isEditorOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NoteEditor 
                noteId={selectedNoteId} 
                onClose={() => setIsEditorOpen(false)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, onSnapshot, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Share2, Plus, Info } from 'lucide-react';

interface GraphViewProps {
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
}

export default function GraphView({ onNodeClick, onEdgeClick }: GraphViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const notesQuery = query(collection(db, 'notes'), where('userId', '==', auth.currentUser.uid));
    const relsQuery = query(collection(db, 'relationships'), where('userId', '==', auth.currentUser.uid));

    const unsubNotes = onSnapshot(notesQuery, (snapshot) => {
      const newNodes = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: { label: doc.data().title },
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        style: { 
          background: '#fff', 
          color: '#333', 
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          fontWeight: '500',
          width: 150,
          textAlign: 'center' as const,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }
      }));
      setNodes(newNodes);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notes'));

    const unsubRels = onSnapshot(relsQuery, (snapshot) => {
      const newEdges = snapshot.docs.map((doc) => ({
        id: doc.id,
        source: doc.data().sourceNoteId,
        target: doc.data().targetNoteId,
        label: doc.data().relationType,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#6366f1', strokeWidth: 2, cursor: 'pointer' },
        labelStyle: { fill: '#6366f1', fontWeight: 700, fontSize: 10 },
        interactionWidth: 20
      }));
      setEdges(newEdges);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'relationships'));

    return () => {
      unsubNotes();
      unsubRels();
    };
  }, [setNodes, setEdges]);

  const onConnect = useCallback(async (params: Connection) => {
    if (!auth.currentUser || !params.source || !params.target) return;

    try {
      const docRef = await addDoc(collection(db, 'relationships'), {
        userId: auth.currentUser.uid,
        sourceNoteId: params.source,
        targetNoteId: params.target,
        relationType: 'related_to',
        createdAt: new Date()
      });
      // Open editor for the new relationship
      onEdgeClick(docRef.id);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'relationships');
    }
  }, [onEdgeClick]);

  return (
    <div className="h-full w-full bg-slate-50 relative">
      <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur p-3 rounded-lg border border-slate-200 shadow-sm max-w-xs">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-1">
          <Share2 className="w-4 h-4 text-indigo-600" />
          Knowledge Graph
        </h3>
        <p className="text-xs text-slate-500">
          Drag nodes to organize. Drag from one node's handle to another to create a relationship.
        </p>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick(node.id)}
        onEdgeClick={(_, edge) => onEdgeClick(edge.id)}
        fitView
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </div>
  );
}

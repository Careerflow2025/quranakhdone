'use client';
import { useState,useEffect } from 'react';
export default function NotesFeed({ studentId }:{ studentId:string }){
  const [notes,setNotes]=useState<any[]>([]);
  useEffect(()=>{(async()=>{
    const res = await fetch(`/api/notes/list?studentId=${studentId}`);
    const j = await res.json(); if(j.ok) setNotes(j.notes);
  })();},[studentId]);
  return (
    <div className="space-y-2 mt-6">
      <h2 className="text-lg font-semibold">Teacher Notes</h2>
      {notes.map(n=>(<div key={n.id} className="border p-2 rounded"><div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</div><p>{n.text}</p></div>))}
    </div>
  );
}
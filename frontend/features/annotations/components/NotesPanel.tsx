'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotesPanel({ studentId }:{ studentId:string }){
  const [notes,setNotes]=useState<any[]>([]);
  const [text,setText]=useState('');
  const [visible,setVisible]=useState(true);
  async function load(){
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/notes/list?studentId=${studentId}&all=1`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    const j = await res.json(); if(j.ok) setNotes(j.notes);
  }
  useEffect(()=>{ load(); },[]);
  async function add(){
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch('/api/notes/add',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body:JSON.stringify({ schoolId:'demo', studentId, authorId:'demo-teacher', text, visibleToParent:visible })
    });
    const j = await res.json(); if(j.ok){ setNotes([j.note,...notes]); setText(''); }
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <textarea className="border w-full p-2 rounded" value={text} onChange={e=>setText(e.target.value)} placeholder="Write feedback..." />
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)} /> Visible to parent</label>
        <button className="border px-3 py-1 rounded" onClick={add}>Add Note</button>
      </div>
      <ul className="space-y-2">
        {notes.map(n=>(<li key={n.id} className="border p-2 rounded"><div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div><p>{n.text}</p><div className="text-xs">Visible: {String(n.visible_to_parent)}</div></li>))}
      </ul>
    </div>
  );
}
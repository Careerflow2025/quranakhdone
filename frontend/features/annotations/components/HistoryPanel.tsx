'use client';
import { useState,useEffect } from 'react';

export default function HistoryPanel({ studentId }:{ studentId:string }){
  const [rows,setRows]=useState<any[]>([]);
  useEffect(()=>{(async()=>{
    const res = await fetch(`/api/renders/history?studentId=${studentId}`);
    const j = await res.json(); if(j.ok) setRows(j.rows);
  })();},[studentId]);

  async function restore(row:any){
    const res = await fetch(`/api/annotations/load?studentId=${studentId}&page=${row.page_number}`);
    const j = await res.json(); console.log('Loaded annotation', j);
    // later: actually load into Fabric
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">History</h2>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {rows.map(r=>(
          <li key={r.id} className="border rounded p-2">
            <img src={`/api/renders/signed-url?path=${encodeURIComponent(r.storage_path)}`} alt={`Page ${r.page_number}`} className="w-full mb-2" />
            <div className="text-xs text-muted-foreground">Page {r.page_number} · {new Date(r.created_at).toLocaleString()}</div>
            <button className="border px-2 py-1 rounded mt-2" onClick={()=>restore(r)}>Restore</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
'use client';
import { useEffect } from 'react';
import { listQueue, clearItem } from '../utils/offlineQueue';

export default function useOfflineSync(){
  useEffect(()=>{
    async function flush(){
      const q = await listQueue();
      for(const item of q){
        try{
          await fetch('/api/annotations/save',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(item) });
          await clearItem(item.id);
        }catch(e){ console.warn('Retry failed', e); }
      }
    }
    function online(){ flush(); }
    window.addEventListener('online', online);
    flush();
    return ()=> window.removeEventListener('online', online);
  },[]);
}
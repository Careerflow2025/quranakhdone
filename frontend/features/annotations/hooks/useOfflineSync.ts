'use client';
import { useEffect } from 'react';
import { listQueue, clearItem } from '../utils/offlineQueue';
import { supabase } from '@/lib/supabase';

export default function useOfflineSync(){
  useEffect(()=>{
    async function flush(){
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No session for offline sync, will retry later');
        return;
      }

      const q = await listQueue();
      for(const item of q){
        try{
          await fetch('/api/annotations/save',{
            method:'POST',
            headers:{
              'Content-Type':'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify(item)
          });
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
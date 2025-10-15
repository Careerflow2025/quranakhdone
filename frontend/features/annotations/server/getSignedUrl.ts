'use server';
import { createSb } from '@/lib/supabase/server';

export async function getSignedUrl(filePath: string, expiresInSec = 3600){
  const sb = createSb();
  const { data, error } = await sb.storage.from(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET!).createSignedUrl(filePath, expiresInSec);
  if(error) throw new Error(error.message);
  return data.signedUrl;
}
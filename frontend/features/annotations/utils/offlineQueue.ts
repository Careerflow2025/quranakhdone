import { openDB } from 'idb';

const DB_NAME = 'quranmate-annotations';
const STORE = 'queue';

async function db(){
  return openDB(DB_NAME, 1, { upgrade(db){ db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true }); } });
}

export async function enqueue(item:any){
  const d = await db();
  await d.add(STORE, { ...item, ts: Date.now() });
}

export async function listQueue(){
  const d = await db();
  return d.getAll(STORE);
}

export async function clearItem(id:number){
  const d = await db();
  await d.delete(STORE, id);
}
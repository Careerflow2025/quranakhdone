import { fabric } from 'fabric';

export function serializeFabric(f: any): object {
  // Save minimal JSON plus custom props (e.g., color, width)
  return f.toJSON(['selectable','strokeWidth','stroke','fill']);
}

export function deserializeFabric(f: any, json: any): Promise<void> {
  return new Promise((resolve)=>{
    f.loadFromJSON(json, ()=>{ f.renderAll(); resolve(); });
  });
}

export function cloneJson(json: any){
  return JSON.parse(JSON.stringify(json));
}

export function roundTrip(json: any){
  // simulate save+load
  return JSON.parse(JSON.stringify(json));
}
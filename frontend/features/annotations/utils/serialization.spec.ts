import { describe, it, expect } from 'vitest';
import { fabric } from 'fabric';
import { serializeFabric, deserializeFabric, roundTrip } from './serialization';

describe('serialization utils', ()=>{
  it('round-trips JSON', ()=>{
    const sample = { objects:[{ type:'rect', left:10, top:20, width:50, height:50, fill:'red' }] };
    const rt = roundTrip(sample);
    expect(rt.objects[0].fill).toBe('red');
  });

  it('serialize and deserialize fabric canvas', async ()=>{
    const f = new fabric.Canvas(undefined);
    const rect = new fabric.Rect({ left:0, top:0, width:40, height:40, fill:'blue' });
    f.add(rect);
    const json = serializeFabric(f);
    expect(json.objects.length).toBe(1);
    const f2 = new fabric.Canvas(undefined);
    await deserializeFabric(f2, json);
    expect(f2.getObjects().length).toBe(1);
  });
});
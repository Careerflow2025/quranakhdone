import { fabric } from 'fabric';
import { compressImage } from './compression';

export async function flattenPdfAndFabric(pageCanvas: HTMLCanvasElement, fabricCanvas: fabric.Canvas): Promise<Blob> {
  // Create temp offscreen canvas
  const offCanvas = document.createElement('canvas');
  offCanvas.width = pageCanvas.width;
  offCanvas.height = pageCanvas.height;
  const ctx = offCanvas.getContext('2d')!;

  // 1. Draw PDF base layer
  ctx.drawImage(pageCanvas, 0, 0);

  // 2. Draw Fabric overlay
  const overlay = fabricCanvas.toCanvasElement();
  ctx.drawImage(overlay, 0, 0);

  // 3. Export as PNG blob with compression
  return new Promise(async (resolve) => {
    offCanvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(blob!);
        return;
      }
      
      // Compress if larger than 500KB
      const compressedBlob = await compressImage(blob, 500, 0.85);
      resolve(compressedBlob);
    }, 'image/png');
  });
}
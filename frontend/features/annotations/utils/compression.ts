import { telemetry } from '../../telemetry/client';

export async function compressImage(
  file: Blob | File, 
  maxSizeKB: number = 500,
  quality: number = 0.8
): Promise<Blob> {
  const originalSizeKB = file.size / 1024;
  
  // If already small enough, return as-is
  if (originalSizeKB <= maxSizeKB) {
    telemetry.logEvent('annotation.compression_skipped', { 
      original_size_kb: Math.round(originalSizeKB),
      target_size_kb: maxSizeKB
    });
    return file;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate optimal dimensions to reduce file size
      const ratio = Math.sqrt(maxSizeKB / originalSizeKB);
      const newWidth = Math.floor(img.width * ratio);
      const newHeight = Math.floor(img.height * ratio);
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw scaled image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to blob with quality adjustment
      canvas.toBlob((compressedBlob) => {
        if (!compressedBlob) {
          resolve(file); // Fallback to original
          return;
        }
        
        const compressedSizeKB = compressedBlob.size / 1024;
        const compressionRatio = originalSizeKB / compressedSizeKB;
        
        telemetry.logEvent('annotation.image_compressed', {
          original_size_kb: Math.round(originalSizeKB),
          compressed_size_kb: Math.round(compressedSizeKB),
          compression_ratio: Math.round(compressionRatio * 100) / 100,
          quality_used: quality
        });
        
        resolve(compressedBlob);
      }, 'image/png', quality);
    };
    
    img.onerror = () => resolve(file); // Fallback to original
    img.src = URL.createObjectURL(file);
  });
}

export async function compressDataUrl(
  dataUrl: string,
  maxSizeKB: number = 500,
  quality: number = 0.8
): Promise<string> {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  
  // Compress the blob
  const compressedBlob = await compressImage(blob, maxSizeKB, quality);
  
  // Convert back to data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(compressedBlob);
  });
}
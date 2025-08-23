import exifr from 'exifr';

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration_seconds?: number;
  capture_at?: string;
  camera_make?: string;
  camera_model?: string;
  gps_lat?: number;
  gps_lon?: number;
  meta?: any;
}

export async function extractImageMetadata(file: File): Promise<MediaMetadata> {
  try {
    // Get image dimensions
    const dimensions = await new Promise<{width: number; height: number}>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });

    // Extract EXIF data (best-effort; returns {} if none)
    const exif = await exifr.parse(file).catch(() => ({})) as any;

    return {
      width: dimensions.width,
      height: dimensions.height,
      capture_at: exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal).toISOString() : undefined,
      camera_make: exif?.Make || undefined,
      camera_model: exif?.Model || undefined,
      gps_lat: exif?.latitude || undefined,
      gps_lon: exif?.longitude || undefined,
      meta: Object.keys(exif).length > 0 ? exif : undefined
    };
  } catch (error) {
    console.error('Error extracting image metadata:', error);
    return {};
  }
}

export async function extractVideoMetadata(file: File): Promise<MediaMetadata> {
  try {
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.src = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      videoEl.onloadedmetadata = () => resolve();
      videoEl.onerror = () => reject(new Error('Cannot load video metadata'));
      
      // Add timeout to prevent hanging
      setTimeout(() => reject(new Error('Video metadata loading timeout')), 10000);
    });

    const metadata: MediaMetadata = {
      width: videoEl.videoWidth || undefined,
      height: videoEl.videoHeight || undefined,
      duration_seconds: isFinite(videoEl.duration) ? Number(videoEl.duration) : undefined,
    };

    // Try to get additional video info - videoTracks is not standard across browsers
    const meta: any = {};
    
    try {
      // @ts-ignore - videoTracks is not in TypeScript definitions but exists in some browsers
      if (videoEl.videoTracks?.length > 0) {
        // @ts-ignore
        meta.codec = videoEl.videoTracks[0]?.label || undefined;
        // @ts-ignore
        meta.track_count = videoEl.videoTracks.length;
      }
    } catch (e) {
      // videoTracks not supported in this browser
    }

    if (Object.keys(meta).length > 0) {
      metadata.meta = meta;
    }

    // Clean up
    URL.revokeObjectURL(videoEl.src);
    
    return metadata;
  } catch (error) {
    console.error('Error extracting video metadata:', error);
    return {};
  }
}

export async function extractAudioMetadata(file: File): Promise<MediaMetadata> {
  try {
    const audioEl = document.createElement('audio');
    audioEl.preload = 'metadata';
    audioEl.src = URL.createObjectURL(file);

    await new Promise<void>((resolve, reject) => {
      audioEl.onloadedmetadata = () => resolve();
      audioEl.onerror = () => reject(new Error('Cannot load audio metadata'));
      
      // Add timeout to prevent hanging
      setTimeout(() => reject(new Error('Audio metadata loading timeout')), 10000);
    });

    const metadata: MediaMetadata = {
      duration_seconds: isFinite(audioEl.duration) ? Number(audioEl.duration) : undefined,
    };

    // Clean up
    URL.revokeObjectURL(audioEl.src);
    
    return metadata;
  } catch (error) {
    console.error('Error extracting audio metadata:', error);
    return {};
  }
}

export async function extractFileMetadata(file: File): Promise<MediaMetadata> {
  const fileType = file.type.toLowerCase();
  
  if (fileType.startsWith('image/')) {
    return await extractImageMetadata(file);
  } else if (fileType.startsWith('video/')) {
    return await extractVideoMetadata(file);
  } else if (fileType.startsWith('audio/')) {
    return await extractAudioMetadata(file);
  }
  
  // For other file types, return empty metadata
  return {};
}
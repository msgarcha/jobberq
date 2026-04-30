import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './platform';

export interface CapturedPhoto {
  /** data:image/...;base64,... ready for <img src> or upload */
  dataUrl: string;
  format: string;
}

/** Take a photo with the device camera (native only). */
export async function takePhoto(): Promise<CapturedPhoto | null> {
  if (!isNative()) {
    console.warn('takePhoto() only works on native iOS/Android.');
    return null;
  }
  const photo = await Camera.getPhoto({
    quality: 80,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    allowEditing: false,
  });
  if (!photo.dataUrl) return null;
  return { dataUrl: photo.dataUrl, format: photo.format };
}

/** Pick an image from the device photo library. */
export async function pickFromLibrary(): Promise<CapturedPhoto | null> {
  if (!isNative()) return null;
  const photo = await Camera.getPhoto({
    quality: 80,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
  });
  if (!photo.dataUrl) return null;
  return { dataUrl: photo.dataUrl, format: photo.format };
}

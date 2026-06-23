export interface LocalFileState {
  file: File;
  preview?: string;
}

export function toFileAttachment(file: LocalFileState | null) {
  if (!file) return undefined;
  return {
    fileName: file.file.name,
    fileSize: `${(file.file.size / 1024).toFixed(0)} KB`,
    previewUrl: file.preview,
  };
}

export const MAX_HRM_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Square crop region for profile avatars — portrait photos keep the top (face) area. */
export function getProfileCropRect(width: number, height: number): { sx: number; sy: number; size: number } {
  const size = Math.min(width, height);
  if (height > width * 1.05) {
    return { sx: 0, sy: 0, size };
  }
  return {
    sx: Math.max(0, (width - size) / 2),
    sy: Math.max(0, (height - size) / 2),
    size,
  };
}

export async function cropProfilePhotoFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const { sx, sy, size } = getProfileCropRect(width, height);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Canvas unavailable');
  }
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, size, size);
  bitmap.close();

  const mime = file.type.startsWith('image/') ? file.type : 'image/jpeg';
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, 0.92));
  if (!blob) throw new Error('Crop failed');

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'profile';
  return new File([blob], `${baseName}.jpg`, { type: blob.type || 'image/jpeg' });
}

export function readImageFile(
  file: File,
  onLoad: (state: LocalFileState) => void,
  onError?: (message: string) => void,
) {
  if (file.size > MAX_HRM_UPLOAD_BYTES) {
    onError?.('File vượt quá 5MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onLoad({ file, preview: reader.result as string });
  reader.onerror = () => onError?.('Không thể đọc file ảnh');
  reader.readAsDataURL(file);
}

export async function readProfileImageFile(
  file: File,
  onLoad: (state: LocalFileState) => void,
  onError?: (message: string) => void,
) {
  if (file.size > MAX_HRM_UPLOAD_BYTES) {
    onError?.('File vượt quá 5MB');
    return;
  }
  try {
    const cropped = await cropProfilePhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => onLoad({ file: cropped, preview: reader.result as string });
    reader.onerror = () => onError?.('Không thể đọc file ảnh');
    reader.readAsDataURL(cropped);
  } catch {
    onError?.('Không thể xử lý ảnh');
  }
}

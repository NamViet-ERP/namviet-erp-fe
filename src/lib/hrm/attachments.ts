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
  reader.readAsDataURL(file);
}

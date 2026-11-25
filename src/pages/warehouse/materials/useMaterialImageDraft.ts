import { useCallback, useEffect, useRef, useState } from 'react';

export function useMaterialImageDraft() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => revokePreview, [revokePreview]);

  const selectFile = useCallback(
    (file: File) => {
      setImageFile(file);
      revokePreview();
      const objectUrl = URL.createObjectURL(file);
      previewUrlRef.current = objectUrl;
      setImagePreview(objectUrl);
    },
    [revokePreview],
  );

  const clearImage = useCallback(() => {
    setImageFile(null);
    revokePreview();
    setImagePreview(null);
  }, [revokePreview]);

  return { imageFile, imagePreview, selectFile, clearImage };
}

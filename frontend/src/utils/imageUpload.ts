/**
 * Convierte una imagen seleccionada en un data URL optimizado para avatares.
 * Mantiene el archivo pequeño antes de enviarlo al backend.
 */
export const readImageAsDataUrl = (
  file: File,
  maxSize = 200,
  quality = 0.85,
): Promise<string> => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) {
    reject(new Error('El archivo seleccionado debe ser una imagen.'));
    return;
  }

  const reader = new FileReader();
  reader.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error('La imagen seleccionada no es válida.'));
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('No se pudo procesar la imagen.'));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.src = reader.result as string;
  };
  reader.readAsDataURL(file);
});

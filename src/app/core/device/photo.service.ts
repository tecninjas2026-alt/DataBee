import { Injectable } from '@angular/core';
import { Camera, CameraErrorCode, MediaTypeSelection } from '@capacitor/camera';

import { APP_CONFIG } from '../config/app-config';
import { AppError } from '../errors/app-error';
import { PhotoSource } from '../models/observation.model';

/** Foto pronta para preview/upload: sempre JPEG reencodado no cliente (sem EXIF/GPS — D10). */
export type PhotoEncodingVersion = 'jpeg-v1' | 'jpeg-v2';

export interface PickedPhoto {
  blob: Blob;
  /** object URL para <img>; quem guarda a foto deve chamar URL.revokeObjectURL ao descartar. */
  previewUrl: string;
  source: PhotoSource;
  mimeType: 'image/jpeg';
  bytes: number;
  width: number;
  height: number;
  /** Hora do dispositivo na captura pelo app. Galeria = null: não inventar data original (D21). */
  capturedAt: string | null;
  /** Kept in local recovery references; never includes photo contents or GPS. */
  encodingVersion?: PhotoEncodingVersion;
}

/**
 * Captura/seleção de UMA foto (Core) com @capacitor/camera 8.x.
 * API usada: takePhoto / chooseFromGallery (getPhoto está deprecated nesta versão).
 * Sem saveToGallery, logo sem permissão extra de armazenamento.
 */
@Injectable({ providedIn: 'root' })
export class PhotoService {
  async pick(source: PhotoSource, encodingVersion: PhotoEncodingVersion = 'jpeg-v2'): Promise<PickedPhoto> {
    const webPath = source === 'camera' ? await this.fromCamera() : await this.fromGallery();
    const original = await this.loadBlob(webPath);
    const { blob, width, height } = await reencodeJpeg(
      original,
      APP_CONFIG.maxPhotoDimension,
      encodingVersion === 'jpeg-v1' ? 0.85 : 0.92,
    );
    if (blob.size === 0) throw new AppError('photo_invalid', 'A imagem selecionada está vazia ou corrompida.');
    if (blob.size > APP_CONFIG.maxPhotoBytes) {
      throw new AppError('photo_too_large', 'A foto ficou maior que 5 MB. Tente outra imagem.');
    }
    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
      source,
      mimeType: 'image/jpeg',
      bytes: blob.size,
      width,
      height,
      capturedAt: source === 'camera' ? new Date().toISOString() : null,
      encodingVersion,
    };
  }

  private async fromCamera(): Promise<string> {
    try {
      const result = await Camera.takePhoto({
        quality: 90,
        correctOrientation: true,
        saveToGallery: false,
        webUseInput: true,
      });
      return requireWebPath(result.webPath);
    } catch (error) {
      throw mapCameraError(error);
    }
  }

  private async fromGallery(): Promise<string> {
    try {
      const { results } = await Camera.chooseFromGallery({
        mediaType: MediaTypeSelection.Photo,
        allowMultipleSelection: false,
      });
      return requireWebPath(results[0]?.webPath);
    } catch (error) {
      throw mapCameraError(error);
    }
  }

  private async loadBlob(webPath: string): Promise<Blob> {
    const response = await fetch(webPath);
    if (!response.ok) throw new AppError('photo_invalid', 'Não foi possível ler a foto selecionada.');
    const blob = await response.blob();
    if (!/^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(blob.type) && blob.type !== '') {
      throw new AppError('photo_invalid', 'Formato não suportado. Use uma foto JPEG ou PNG.');
    }
    return blob;
  }
}

function requireWebPath(webPath: string | undefined): string {
  if (!webPath) throw new AppError('photo_invalid', 'Nenhuma foto foi retornada.');
  return webPath;
}

function mapCameraError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message ?? '';
  if (code === CameraErrorCode.TakePhotoCancelled || /cancel/i.test(message)) {
    return new AppError('photo_cancelled', 'Seleção cancelada.', error);
  }
  if (code === CameraErrorCode.CameraPermissionDenied || code === CameraErrorCode.GalleryPermissionDenied) {
    return new AppError(
      'photo_permission_denied',
      'Permissão negada. Libere o acesso à câmera/fotos nas configurações do aparelho.',
      error,
    );
  }
  if (code === CameraErrorCode.NoCameraAvailable) {
    return new AppError('photo_invalid', 'Nenhuma câmera disponível. Escolha uma foto da galeria.', error);
  }
  return new AppError('photo_invalid', 'Não foi possível obter a foto. Tente novamente.', error);
}

/** Redesenha a imagem num canvas: corrige orientação, limita tamanho e descarta EXIF (inclui GPS). */
async function reencodeJpeg(
  source: Blob,
  maxDimension: number,
  quality = 0.85,
): Promise<{ blob: Blob; width: number; height: number }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  } catch (error) {
    throw new AppError('photo_invalid', 'Não foi possível abrir esta imagem. Use JPEG ou PNG.', error);
  }
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new AppError('photo_invalid', 'Este dispositivo não conseguiu processar a imagem.');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) throw new AppError('photo_invalid', 'Falha ao converter a imagem.');
  return { blob, width, height };
}

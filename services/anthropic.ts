import * as ImageManipulator from 'expo-image-manipulator';
import { getAppApiBase } from '@/constants/Api';
import type { PhotoScanItem, LabelScanResult } from '@/types';

export class AnthropicServiceError extends Error {
  constructor(
    public readonly errorType: 'network' | 'parse' | 'anthropic',
    message: string,
  ) {
    super(message);
    this.name = 'AnthropicServiceError';
  }
}

interface PhotoScanResponse {
  items: PhotoScanItem[];
}

interface ApiErrorResponse {
  error: 'network' | 'parse' | 'anthropic';
  message: string;
}

async function compressToBase64(imageUri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1024 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!result.base64) throw new AnthropicServiceError('network', 'Image compression failed');
  return result.base64;
}

async function callScanApi(type: 'photo' | 'label', imageUri: string): Promise<unknown> {
  let imageBase64: string;
  try {
    imageBase64 = await compressToBase64(imageUri);
  } catch (err) {
    throw err instanceof AnthropicServiceError
      ? err
      : new AnthropicServiceError('network', 'Failed to process image');
  }

  let response: Response;
  try {
    response = await fetch(`${getAppApiBase()}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, imageBase64 }),
    });
  } catch {
    throw new AnthropicServiceError('network', 'Check your connection and try again');
  }

  const data: unknown = await response.json();

  if (!response.ok) {
    const err = data as ApiErrorResponse;
    throw new AnthropicServiceError(
      err.error ?? 'anthropic',
      err.message ?? 'Scan failed — you can enter the details manually',
    );
  }

  return data;
}

export async function scanMealPhoto(imageUri: string): Promise<PhotoScanResponse> {
  const data = await callScanApi('photo', imageUri);
  return data as PhotoScanResponse;
}

export async function scanNutritionLabel(imageUri: string): Promise<LabelScanResult> {
  const data = await callScanApi('label', imageUri);
  return data as LabelScanResult;
}

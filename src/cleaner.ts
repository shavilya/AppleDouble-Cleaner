import { lstat } from 'node:fs/promises';
import path from 'node:path';

export type MoveToTrash = (filePath: string) => Promise<void>;

export async function cleanSidecar(
  sidecarPath: string,
  moveToTrash: MoveToTrash
): Promise<boolean> {
  const sidecarName = path.basename(sidecarPath);
  if (!sidecarName.startsWith('._') || sidecarName.length <= 2) {
    return false;
  }

  let sidecarInfo;
  try {
    sidecarInfo = await lstat(sidecarPath);
  } catch (error) {
    if (isNotFound(error)) {
      return false;
    }
    throw error;
  }

  if (!sidecarInfo.isFile()) {
    return false;
  }

  const originalPath = path.join(path.dirname(sidecarPath), sidecarName.slice(2));
  try {
    await lstat(originalPath);
  } catch (error) {
    if (isNotFound(error)) {
      return false;
    }
    throw error;
  }

  await moveToTrash(sidecarPath);
  return true;
}

function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

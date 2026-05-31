export function thumbPath(storagePath: string): string {
  return storagePath.replace(/\.[^.]+$/, '-thumb.jpg')
}

import { thumbPath } from '@/lib/thumb'

describe('thumbPath', () => {
  it('replaces jpg extension', () => {
    expect(thumbPath('1234-abc.jpg')).toBe('1234-abc-thumb.jpg')
  })

  it('replaces png extension with jpg', () => {
    expect(thumbPath('1234-abc.png')).toBe('1234-abc-thumb.jpg')
  })

  it('replaces webp extension with jpg', () => {
    expect(thumbPath('photo.webp')).toBe('photo-thumb.jpg')
  })

  it('handles dots in filename', () => {
    expect(thumbPath('my.photo.2024.jpg')).toBe('my.photo.2024-thumb.jpg')
  })
})

import { isAllowedImageUrl, openImageInNewTab, sanitizeImageUrl } from './image-url';

describe('OMCT-C16-L2-04.06 Image URL allow list', () => {
  it('allows safe absolute http and https URLs', () => {
    expect(isAllowedImageUrl('https://cdn.example.com/a.png')).toBe(true);
    expect(isAllowedImageUrl('http://example.com/a.jpg')).toBe(true);
  });

  it('allows safe root-relative URLs', () => {
    expect(isAllowedImageUrl('/assets/a.png')).toBe(true);
  });

  it('allows non-SVG data-image URLs', () => {
    expect(isAllowedImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isAllowedImageUrl('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
  });

  it('allows same-origin blob URLs', () => {
    expect(isAllowedImageUrl(`blob:${location.origin}/uuid-1234`)).toBe(true);
  });

  it('blocks svg data URLs, unsafe schemes, and protocol-relative URLs', () => {
    expect(isAllowedImageUrl('data:image/svg+xml,<svg onload=alert(1)>')).toBe(false);
    expect(isAllowedImageUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedImageUrl('vbscript:msgbox')).toBe(false);
    expect(isAllowedImageUrl('//evil.example/a.png')).toBe(false);
    expect(isAllowedImageUrl('images/relative.png')).toBe(false);
    expect(isAllowedImageUrl('')).toBe(false);
  });

  it('blocks cross-origin blob URLs', () => {
    expect(isAllowedImageUrl('blob:https://evil.example/uuid')).toBe(false);
  });

  it('sanitizeImageUrl returns the URL when allowed and null otherwise', () => {
    expect(sanitizeImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(sanitizeImageUrl('data:image/svg+xml,<svg>')).toBeNull();
  });
});

describe('OMCT-C16-L2-04.05 Image opener isolation', () => {
  it('opens allowed images isolated from the opener', () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    openImageInNewTab('https://cdn.example.com/a.png');
    expect(open).toHaveBeenCalledWith(
      'https://cdn.example.com/a.png',
      '_blank',
      'noopener,noreferrer',
    );
    open.mockRestore();
  });

  it('does not open blocked images', () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    openImageInNewTab('data:image/svg+xml,<svg onload=alert(1)>');
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });
});

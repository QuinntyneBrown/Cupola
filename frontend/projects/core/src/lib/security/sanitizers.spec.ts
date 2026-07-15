import {
  neutralizeCsvCell,
  openExternal,
  sanitizeFilename,
  sanitizeRichText,
  sanitizeUrl,
} from './sanitizers';

describe('sanitizeUrl', () => {
  it('accepts http and https URLs', () => {
    expect(sanitizeUrl('https://example.com/page')).toBe('https://example.com/page');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('accepts relative URLs', () => {
    expect(sanitizeUrl('/browse/mine')).toBe('/browse/mine');
    expect(sanitizeUrl('./relative')).toBe('./relative');
    expect(sanitizeUrl('images/photo.png')).toBe('images/photo.png');
  });

  it('rejects script-bearing and non-http schemes', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeUrl('vbscript:msgbox')).toBeNull();
    expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
  });

  it('rejects protocol-relative and empty URLs', () => {
    expect(sanitizeUrl('//evil.example')).toBeNull();
    expect(sanitizeUrl('   ')).toBeNull();
  });
});

describe('sanitizeRichText', () => {
  it('removes script elements', () => {
    expect(sanitizeRichText('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
  });

  it('removes event-handler attributes', () => {
    expect(sanitizeRichText('<img src="x.png" onerror="alert(1)">')).toBe('<img src="x.png">');
  });

  it('removes unsafe href values', () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
  });

  it('keeps safe markup', () => {
    const safe = '<p>note <strong>bold</strong> <a href="https://example.com">link</a></p>';
    expect(sanitizeRichText(safe)).toBe(safe);
  });
});

describe('neutralizeCsvCell', () => {
  it('prefixes formula-leading cells', () => {
    expect(neutralizeCsvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(neutralizeCsvCell('+1')).toBe("'+1");
    expect(neutralizeCsvCell('-1')).toBe("'-1");
    expect(neutralizeCsvCell('@cmd')).toBe("'@cmd");
  });

  it('leaves ordinary cells unchanged', () => {
    expect(neutralizeCsvCell('plain value')).toBe('plain value');
    expect(neutralizeCsvCell('42')).toBe('42');
  });
});

describe('sanitizeFilename', () => {
  it('replaces path separators and reserved characters', () => {
    expect(sanitizeFilename('a/b\\c:d*e?f"g<h>i|j')).toBe('a_b_c_d_e_f_g_h_i_j');
  });

  it('strips leading dots and control characters', () => {
    expect(sanitizeFilename('..\u0000secret')).toBe('secret');
  });
});

describe('openExternal', () => {
  it('opens safe URLs isolated from the opener', () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    openExternal('https://example.com');
    expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('does not open unsafe URLs', () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    openExternal('javascript:alert(1)');
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });
});

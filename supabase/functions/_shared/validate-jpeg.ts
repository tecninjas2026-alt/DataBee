/** Validação estrutural do JPEG tratado no app; nunca retorna nem registra o conteúdo. */
export function validateJpeg(bytes: Uint8Array): void {
  const fail = (): never => {
    throw new Error('invalid_jpeg');
  };
  if (bytes.length < 4 || bytes.length > 5242880 || bytes[0] !== 0xff || bytes[1] !== 0xd8) fail();
  let offset = 2;
  let hasFrame = false;
  let scans = 0;
  while (offset < bytes.length) {
    if (bytes[offset++] !== 0xff) fail();
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9) {
      if (!hasFrame || !scans || offset !== bytes.length) fail();
      return;
    }
    if (marker === undefined || marker === 0 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) fail();
    if (offset + 2 > bytes.length) fail();
    const length = bytes[offset] * 256 + bytes[offset + 1];
    const end = offset + length;
    if (length < 2 || end > bytes.length) fail();
    // Reencode do canvas não precisa de EXIF/XMP/COM. Rejeitar para não guardar GPS oculto.
    if (marker === 0xe1 || marker === 0xed || marker === 0xfe) fail();
    const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isFrame) {
      if (hasFrame || ![0xc0, 0xc2].includes(marker) || length < 11 || bytes[offset + 2] !== 8) fail();
      const height = bytes[offset + 3] * 256 + bytes[offset + 4];
      const width = bytes[offset + 5] * 256 + bytes[offset + 6];
      const components = bytes[offset + 7];
      if (
        width < 1 ||
        height < 1 ||
        width > 2048 ||
        height > 2048 ||
        ![1, 3].includes(components) ||
        length !== 8 + 3 * components
      )
        fail();
      hasFrame = true;
    }
    offset = end;
    if (marker === 0xda) {
      if (!hasFrame || length < 6) fail();
      scans++;
      // Pular dados comprimidos, preservando marcadores e escapes FF00/restart.
      while (offset < bytes.length) {
        if (bytes[offset] !== 0xff) {
          offset++;
          continue;
        }
        const next = bytes[offset + 1];
        if (next === 0 || (next >= 0xd0 && next <= 0xd7)) {
          offset += 2;
          continue;
        }
        break;
      }
    }
  }
  fail();
}

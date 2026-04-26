import QRCode from 'qrcode'

export async function certificateVerifyQrDataUrl(verifyUrl: string): Promise<string> {
  return QRCode.toDataURL(verifyUrl, {
    type: 'image/png',
    width: 160,
    margin: 1,
    errorCorrectionLevel: 'M',
  })
}

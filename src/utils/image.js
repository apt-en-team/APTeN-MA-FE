export function getImageUrl(imageUrl) {
  if (!imageUrl) return ''
  if (imageUrl.startsWith('http')) return imageUrl // 이미 절대 URL인 경우 그대로 반환
  return `http://localhost:8080${imageUrl}`
}
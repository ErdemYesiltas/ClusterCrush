export function resize(
  availWidth: number,
  availHeight: number,
  gameWidth: number,
  gameHeight: number,
  minWidth: number,
  minHeight: number,
) {
  let width = 0,
    height = 0,
    x = 0,
    y = 0;
  if (gameHeight / gameWidth > availHeight / availWidth) {
    if (minHeight / gameWidth > availHeight / availWidth) {
      height = (availHeight * gameHeight) / minHeight;
      width = (height * gameWidth) / gameHeight;
    } else {
      width = availWidth;
      height = (width * gameHeight) / gameWidth;
    }
  } else {
    if (gameHeight / minWidth > availHeight / availWidth) {
      height = availHeight;
      width = (height * gameWidth) / gameHeight;
    } else {
      width = (availWidth * gameWidth) / minWidth;
      height = (width * gameHeight) / gameWidth;
    }
  }

  x = Math.round((availWidth - width) / 2);
  y = Math.round((availHeight - height) / 2);
  const scale = Math.min(width / height, height / width);
  width = Math.round(width);
  height = Math.round(height);

  console.log(`Resize: ${width}x${height} at position (${x}, ${y}) with scale ${scale}`);
  return { x, y, scale, width, height };
}

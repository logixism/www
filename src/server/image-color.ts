import sharp from "sharp";

export async function getAverageImageColorServer(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to load image: ${url} (${response.status} ${response.statusText})`,
    );
  }

  const input = await response.arrayBuffer();

  const {
    data,
    info: { channels },
  } = await sharp(input)
    .resize(64, 64, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let red = 0;
  let green = 0;
  let blue = 0;
  let weight = 0;

  for (let index = 0; index < data.length; index += channels) {
    const alpha = data[index + 3] / 255;

    if (alpha === 0) continue;

    red += data[index] * alpha;
    green += data[index + 1] * alpha;
    blue += data[index + 2] * alpha;
    weight += alpha;
  }

  if (weight === 0) {
    throw new Error("Image contains no visible pixels");
  }

  const color = [red, green, blue]
    .map((channel) =>
      Math.round(channel / weight)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

  return `#${color}`;
}

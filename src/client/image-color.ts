export function getAverageImageColor(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (context === null) {
          reject(new Error("Canvas 2D context is unavailable"));
          return;
        }

        const maxSize = 64;
        const scale = Math.min(1, maxSize / image.naturalWidth, maxSize / image.naturalHeight);
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        let red = 0;
        let green = 0;
        let blue = 0;
        let weight = 0;

        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3] / 255;
          if (alpha === 0) continue;
          red += data[index] * alpha;
          green += data[index + 1] * alpha;
          blue += data[index + 2] * alpha;
          weight += alpha;
        }

        if (weight === 0) {
          reject(new Error("Image contains no visible pixels"));
          return;
        }

        const color = [red, green, blue]
          .map((channel) => Math.round(channel / weight).toString(16).padStart(2, "0"))
          .join("");
        resolve(`#${color}`);
      } catch (error) {
        reject(
          new Error(
            `Could not read image pixels. The image host may not allow CORS. ${
              error instanceof Error ? error.message : ""
            }`,
          ),
        );
      }
    };

    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

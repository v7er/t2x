export const DEFAULT_AVATAR = "/zen-me.jpg";

export function avatarSrc(stored: string | null | undefined): string {
  if (stored && isSafeAvatarSrc(stored)) return stored;
  return DEFAULT_AVATAR;
}

export function isSafeAvatarSrc(src: string): boolean {
  return (
    src.startsWith("data:image/") ||
    src.startsWith("https://") ||
    src.startsWith("http://") ||
    src.startsWith("/")
  );
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

export function rasterizeToAvatar(src: string, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith("http")) img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not draw image"));
        return;
      }
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.84));
    };
    img.onerror = () => reject(new Error("Could not load that image"));
    img.src = src;
  });
}

export async function avatarFromFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file");
  const data = await readFileAsDataUrl(file);
  return rasterizeToAvatar(data);
}

export async function avatarFromUrl(raw: string): Promise<string> {
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Enter a full image URL");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Use an http or https link");
  }
  try {
    return await rasterizeToAvatar(parsed.href);
  } catch {
    return parsed.href;
  }
}

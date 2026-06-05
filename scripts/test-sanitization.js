
function sanitizeKey(fileKey, bucketName) {
  let key = fileKey;

  if (!key) return "";

  // 1. Decode recursively up to 3 levels to handle nested or double-encoded URLs
  let lastKey = "";
  for (let i = 0; i < 3; i++) {
    if (!key.includes('%') || key === lastKey) break;
    try {
      lastKey = key;
      key = decodeURIComponent(key);
    } catch (e) {
      break;
    }
  }

  // 2. Handle full https:// or http:// URLs — extract just the pathname
  if (key.startsWith("https://") || key.startsWith("http://")) {
    try {
      const urlObj = new URL(key);
      key = urlObj.pathname;
    } catch (e) {
      const hostEnd = key.indexOf('/', 8);
      if (hostEnd !== -1) {
        key = key.substring(hostEnd + 1);
      }
    }
  }

  // 3. Handle s3:// URLs
  if (key.startsWith("s3://")) {
    const withoutScheme = key.replace("s3://", "");
    const parts = withoutScheme.split("/");
    key = parts.length > 1 ? parts.slice(1).join("/") : parts[0];
  }

  // Normalization: Ensure no leading slashes
  while (key.startsWith("/")) {
    key = key.slice(1);
  }

  return key;
}

const bucket = "maximize-meet";
const testCases = [
  // Path-style: bucket is first segment of path, folder also named bucket
  "https://0d71f8982a04d4b7325afa19bc44654c.r2.cloudflarestorage.com/maximize-meet/maximize-meet/recordings/file.ogg",
  // Public R2 worker/domain URL
  "https://pub-15e730edd35642e49c44f19e4bdaf5b6.r2.dev/maximize-meet/recordings/file.ogg"
];

console.log("Testing non-aggressive sanitization logic:");
testCases.forEach(tc => {
  console.log(`\nInput: ${tc}`);
  const result = sanitizeKey(tc, bucket);
  console.log(`Output: ${result}`);
});

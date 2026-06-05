
function sanitizeKey(fileKey: string, bucketName?: string): string {
  let key = fileKey;

  // 1. Decode recursively to handle nested/encoded URLs
  while (key.includes('%')) {
    const decoded = decodeURIComponent(key);
    if (decoded === key) break;
    key = decoded;
  }

  // 2. Handle full https:// or http:// URLs
  if (key.startsWith("https://") || key.startsWith("http://")) {
    try {
      const urlObj = new URL(key);
      // pathname starts with "/" — remove it
      key = urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname;
    } catch {
      // not a valid URL, use as-is
    }
  }

  // 3. Handle s3:// URLs
  if (key.startsWith("s3://")) {
    const withoutScheme = key.replace("s3://", "");
    key = withoutScheme.split("/").slice(1).join("/");
  }

  // 4. Strip ALL leading occurrences of the bucket name prefix
  if (bucketName) {
    // Specifically strip the bucket if it's followed by a slash
    // or if the entire key IS the bucket name (though unlikely to be valid for GetObject)
    let changed = true;
    while (changed) {
      changed = false;
      if (key.startsWith(`${bucketName}/`)) {
        key = key.slice(bucketName.length + 1);
        changed = true;
      }
    }
  }

  return key;
}

const bucket = "maximize-meet";
const testCases = [
  "https://0d71f8982a04d4b7325afa19bc44654c.r2.cloudflarestorage.com/maximize-meet/recordings/file.ogg",
  "https://maximize-meet.0d71f8982a04d4b7325afa19bc44654c.r2.cloudflarestorage.com/maximize-meet/recordings/file.ogg",
  "maximize-meet/recordings/file.ogg",
  "recordings/file.ogg",
  "maximize-meet/maximize-meet/https%3A//maximize-meet.0d71f8982a04d4b7325afa19bc44654c.r2.cloudflarestorage.com%252Fmaximize-meet/recordings/file.ogg",
  "https%3A%2F%2Fmaximize-meet.r2.com%2Fmaximize-meet%2Frecordings%2Ffile.ogg"
];

console.log("Testing sanitization logic:");
testCases.forEach(tc => {
  console.log(`\nInput: ${tc}`);
  console.log(`Output: ${sanitizeKey(tc, bucket)}`);
});

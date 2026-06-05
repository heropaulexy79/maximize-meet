
function sanitizeKey(fileKey, bucketName) {
  let key = fileKey;

  // 1. Decode recursively to handle nested/encoded URLs
  while (key.includes('%')) {
    try {
      const decoded = decodeURIComponent(key);
      if (decoded === key) break;
      key = decoded;
    } catch (e) {
      break;
    }
  }

  // 2. Handle full https:// or http:// URLs
  if (key.startsWith("https://") || key.startsWith("http://")) {
    try {
      // Manual host stripping if URL constructor is not available or behaves differently
      const hostEnd = key.indexOf('/', 8);
      if (hostEnd !== -1) {
        key = key.substring(hostEnd + 1);
      }
    } catch (e) {
      // use as-is
    }
  }

  // 3. Handle s3:// URLs
  if (key.startsWith("s3://")) {
    const withoutScheme = key.replace("s3://", "");
    const parts = withoutScheme.split("/");
    if (parts.length > 1) {
      key = parts.slice(1).join("/");
    } else {
      key = "";
    }
  }

  // 4. Strip ALL leading occurrences of the bucket name prefix
  if (bucketName) {
    let changed = true;
    while (changed) {
      changed = false;
      if (key.startsWith(bucketName + "/")) {
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
  const result = sanitizeKey(tc, bucket);
  console.log(`Output: ${result}`);
});

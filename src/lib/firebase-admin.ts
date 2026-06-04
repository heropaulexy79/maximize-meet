import * as admin from "firebase-admin";

console.log("🔍 Checking Firebase Admin initialization...");
if (!admin.apps.length) {
  try {
    const credentialEnv = process.env.GCP_CREDENTIALS;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (credentialEnv && 
        credentialEnv.trim() !== "" && 
        credentialEnv !== "paste-your-service-account-json-here") {
      
      let credentials;
      try {
        let rawCredentials = credentialEnv.trim();
        // Remove wrapping quotes if present
        if ((rawCredentials.startsWith("'") && rawCredentials.endsWith("'")) || 
            (rawCredentials.startsWith('"') && rawCredentials.endsWith('"'))) {
          rawCredentials = rawCredentials.slice(1, -1);
        }
        
        credentials = JSON.parse(rawCredentials);
        
        if (credentials.private_key) {
          credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
        }

        admin.initializeApp({
          credential: admin.credential.cert(credentials),
          projectId: projectId,
        });
        console.log("✅ Firebase Admin initialized successfully with service account.");
      } catch (parseError) {
        console.error("❌ Failed to parse GCP_CREDENTIALS:", parseError);
        admin.initializeApp({ projectId });
      }
    } else {
      admin.initializeApp({
        projectId: projectId || "maximize-meet",
      });
      console.warn("⚠️ Firebase Admin initialized with default project ID only (no credentials).");
    }
  } catch (error) {
    console.error("❌ Firebase admin initialization error:", error);
  }
} else {
  console.log("ℹ️ Firebase Admin already initialized. Apps count:", admin.apps.length);
}

// Ensure these are only called after initializeApp
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();

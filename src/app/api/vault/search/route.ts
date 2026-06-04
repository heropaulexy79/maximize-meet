import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-wrapper";

export const GET = withSecurity(async (req, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase();

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Since Firestore doesn't support native full-text search easily,
    // we'll fetch all replays and filter in-memory for this case,
    // assuming the number of sessions is manageable.
    // For a larger scale, we would use Algolia or Typesense.
    const snapshot = await adminDb.collection("replays").get();
    
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as any))
      .filter(replay => {
        const title = (replay.title || "").toLowerCase();
        const summary = (replay.executiveSummary || "").toLowerCase();
        const transcript = (replay.transcript || "").toLowerCase();
        const tags = (replay.tags || []).map((t: string) => t.toLowerCase());
        const category = (replay.category || "").toLowerCase();

        return (
          title.includes(query) ||
          summary.includes(query) ||
          transcript.includes(query) ||
          tags.some((t: string) => t.includes(query)) ||
          category.includes(query)
        );
      })
      .map(replay => ({
        id: replay.id,
        title: replay.title,
        instructor: replay.instructor,
        date: replay.date,
        category: replay.category,
        thumbnail: replay.thumbnail,
        // Return a snippet of the match if found in transcript
        matchSnippet: getMatchSnippet(replay.transcript, query)
      }));

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error in search API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}, { requireAuth: true });

function getMatchSnippet(text: string, query: string) {
  if (!text) return "";
  const index = text.toLowerCase().indexOf(query);
  if (index === -1) return "";

  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + query.length + 100);
  let snippet = text.substring(start, end);
  
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet += "...";
  
  return snippet;
}

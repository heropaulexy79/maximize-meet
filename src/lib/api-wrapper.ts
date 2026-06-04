import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, rateLimit, AuthenticatedUser } from "./auth-utils";

type ApiHandler = (
  req: NextRequest,
  user: AuthenticatedUser | null,
  params?: any
) => Promise<NextResponse>;

interface WrapperOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  rateLimitKey?: string;
  rateLimitLimit?: number;
  rateLimitWindowMs?: number;
}

/**
 * Global API Wrapper for enforcing security policies.
 * This acts as our "Unified Middleware" for API routes.
 */
export function withSecurity(
  handler: ApiHandler,
  options: WrapperOptions = {}
) {
  return async (req: NextRequest, context: any) => {
    try {
      // 1. Rate Limiting
      const ip = req.headers.get("x-forwarded-for") || "anonymous";
      const rlKey = options.rateLimitKey || `global-${ip}`;
      const limit = options.rateLimitLimit || 60; // default 60 req/min
      const windowMs = options.rateLimitWindowMs || 60 * 1000;

      if (!rateLimit(rlKey, limit, windowMs)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }

      // 2. Authentication
      const user = await verifyAuth(req);

      if (options.requireAuth && !user) {
        console.warn(`[Security] Unauthorized access attempt to ${req.nextUrl.pathname}`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (options.requireAdmin && user?.role !== "admin") {
        console.warn(`[Security] Forbidden: Admin access required for ${req.nextUrl.pathname}. User role: ${user?.role}`);
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }

      // 3. Execution
      return await handler(req, user, context?.params);
    } catch (error: any) {
      console.error("API Security Wrapper Error:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
}

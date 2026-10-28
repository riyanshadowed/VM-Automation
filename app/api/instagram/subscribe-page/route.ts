import { NextResponse } from "next/server";
import { getSettings } from "@/lib/services/store";

export async function POST() {
  try {
    const settings = await getSettings();
    const token = settings.pageAccessToken;
    const pageId = settings.pageId;
    const igId = settings.instagramAccountId;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Page Access Token missing in settings" },
        { status: 400 }
      );
    }

    const results: Record<string, unknown> = {};

    // 1. Subscribe Facebook Page to App
    if (pageId) {
      try {
        const pageUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(
          pageId
        )}/subscribed_apps?subscribed_fields=feed,messages,mention&access_token=${encodeURIComponent(
          token
        )}`;
        const pageRes = await fetch(pageUrl, { method: "POST" });
        results.pageSubscription = await pageRes.json();
      } catch (err: unknown) {
        results.pageError = err instanceof Error ? err.message : String(err);
      }
    }

    // 2. Subscribe Instagram Business Account to App
    if (igId) {
      try {
        const igUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(
          igId
        )}/subscribed_apps?subscribed_fields=comments,messages,mentions&access_token=${encodeURIComponent(
          token
        )}`;
        const igRes = await fetch(igUrl, { method: "POST" });
        results.instagramSubscription = await igRes.json();
      } catch (err: unknown) {
        results.igError = err instanceof Error ? err.message : String(err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subscription requests dispatched to Meta",
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}


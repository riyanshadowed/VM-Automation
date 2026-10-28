import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/services/store";
import { processInstagramComment } from "@/lib/instagram/api";

/**
 * Meta Webhook Verification Handler (GET)
 * Meta sends GET request with hub.mode, hub.verify_token, hub.challenge
 * When verifying webhook in Meta Developer App Dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const settings = await getSettings();
  const expectedToken =
    settings.metaVerifyToken ||
    process.env.META_VERIFY_TOKEN ||
    "vyapar_automate_verify_token_123";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("Meta Webhook verified successfully!");
    // Meta requires plain text response with the challenge code
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("Meta Webhook verification failed. Token mismatch or bad mode.", {
    mode,
    receivedToken: token,
    expectedToken,
  });

  return new NextResponse("Forbidden: Verification token mismatch", {
    status: 403,
  });
}

interface WebhookChangeValue {
  id?: string;
  text?: string;
  message?: string;
  from?: {
    id: string;
    username?: string;
    name?: string;
  };
  media?: {
    id: string;
    media_product_type?: string;
  };
  post_id?: string;
  item?: string;
  verb?: string;
}

interface WebhookEntry {
  id: string;
  time: number;
  changes?: Array<{
    field: string;
    value: WebhookChangeValue;
  }>;
  messaging?: Array<{
    sender: { id: string };
    recipient: { id: string };
    message?: { text?: string };
  }>;
}

/**
 * Meta Webhook Event Handler (POST)
 * Receives incoming comments, messages, or mentions from Instagram Graph API.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== "instagram" && body.object !== "page") {
      return NextResponse.json({ status: "ignored", reason: "not_instagram" });
    }

    const settings = await getSettings();
    const myInstagramAccountId = settings.instagramAccountId;

    const entries: WebhookEntry[] = body.entry || [];

    for (const entry of entries) {
      // 1. Process Instagram comment changes
      if (entry.changes && Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          if (change.field === "comments" || change.field === "feed") {
            const val = change.value;
            if (!val) continue;

            const commentId = val.id;
            const commentText = val.text || val.message;
            const fromUser = val.from?.username || "instagram_user";
            const fromUserId = val.from?.id;
            const mediaId = val.media?.id || val.post_id || "";

            // Avoid replying to our own account's comments (infinite loop protection)
            if (myInstagramAccountId && fromUserId === myInstagramAccountId) {
              continue;
            }

            if (commentId && commentText) {
              // Asynchronously or synchronously process comment automation
              await processInstagramComment({
                commentId,
                commentText,
                username: fromUser,
                mediaId,
                isSimulated: false,
              });
            }
          }
        }
      }
    }

    // Meta expects a quick 200 OK response
    return NextResponse.json({ status: "ok", received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Webhook processing error:", message);
    // Still return 200 OK so Meta doesn't disable the webhook endpoint
    return NextResponse.json({ status: "error", error: message }, { status: 200 });
  }
}


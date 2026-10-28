import { NextRequest, NextResponse } from "next/server";
import { getRules, createRule } from "@/lib/services/store";

export async function GET() {
  try {
    const rules = await getRules();
    return NextResponse.json({ success: true, rules });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.dmMessage) {
      return NextResponse.json(
        { success: false, error: "Rule name and DM message are required" },
        { status: 400 }
      );
    }

    // Process trigger keywords
    let keywords: string[] = [];
    if (Array.isArray(body.triggerKeywords)) {
      keywords = body.triggerKeywords;
    } else if (typeof body.triggerKeywords === "string") {
      keywords = body.triggerKeywords
        .split(",")
        .map((k: string) => k.trim())
        .filter(Boolean);
    }

    if (keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one trigger keyword is required" },
        { status: 400 }
      );
    }

    // Process comment reply variations
    let replies: string[] = [];
    if (Array.isArray(body.commentReplies)) {
      replies = body.commentReplies.map((r: string) => r.trim()).filter(Boolean);
    } else if (typeof body.commentReplies === "string") {
      replies = body.commentReplies
        .split("\n")
        .map((r: string) => r.trim())
        .filter(Boolean);
    }

    if (replies.length === 0) {
      replies = ["Check your DM! 📩", "Sent you a message! Check inbox ✨"];
    }

    const created = await createRule({
      name: body.name.trim(),
      triggerKeywords: keywords,
      matchType: body.matchType === "exact" ? "exact" : "contains",
      mediaId: body.mediaId?.trim() || "all",
      dmMessage: body.dmMessage.trim(),
      commentReplies: replies,
      autoLike: body.autoLike !== false,
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, rule: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}


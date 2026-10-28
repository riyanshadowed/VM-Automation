import { NextRequest, NextResponse } from "next/server";
import { processInstagramComment } from "@/lib/instagram/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentText, username, mediaId } = body;

    if (!commentText) {
      return NextResponse.json(
        { success: false, error: "Comment text is required" },
        { status: 400 }
      );
    }

    const testCommentId = "sim_" + Math.random().toString(36).substring(2, 9);
    const testUsername = (username || "test_user").replace(/^@/, "").trim();

    const result = await processInstagramComment({
      commentId: testCommentId,
      commentText: commentText.trim(),
      username: testUsername,
      mediaId: mediaId?.trim() || "reel_test",
      isSimulated: true,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}


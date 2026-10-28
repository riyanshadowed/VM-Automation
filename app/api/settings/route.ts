import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/services/store";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      success: true,
      settings: {
        metaAppId: settings.metaAppId,
        metaVerifyToken: settings.metaVerifyToken,
        instagramAccountId: settings.instagramAccountId,
        pageId: settings.pageId,
        pageAccessToken: settings.pageAccessToken || "",
        hasPageAccessToken: Boolean(settings.pageAccessToken),
        pageAccessTokenMasked: settings.pageAccessToken
          ? settings.pageAccessToken.substring(0, 10) +
            "..." +
            settings.pageAccessToken.substring(
              Math.max(0, settings.pageAccessToken.length - 6)
            )
          : "",
        hasAppSecret: Boolean(settings.metaAppSecret),
      },
    });
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

    const updated = await saveSettings({
      metaAppId: body.metaAppId,
      metaAppSecret: body.metaAppSecret,
      metaVerifyToken: body.metaVerifyToken,
      pageAccessToken: body.pageAccessToken,
      instagramAccountId: body.instagramAccountId,
      pageId: body.pageId,
    });

    return NextResponse.json({
      success: true,
      settings: {
        metaAppId: updated.metaAppId,
        metaVerifyToken: updated.metaVerifyToken,
        instagramAccountId: updated.instagramAccountId,
        pageId: updated.pageId,
        pageAccessToken: updated.pageAccessToken || "",
        hasPageAccessToken: Boolean(updated.pageAccessToken),
        pageAccessTokenMasked: updated.pageAccessToken
          ? updated.pageAccessToken.substring(0, 10) +
            "..." +
            updated.pageAccessToken.substring(
              Math.max(0, updated.pageAccessToken.length - 6)
            )
          : "",
        hasAppSecret: Boolean(updated.metaAppSecret),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}


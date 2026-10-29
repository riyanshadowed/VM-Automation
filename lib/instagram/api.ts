import {
  getRules,
  addLog,
  getSettings,
  incrementRuleTriggerCount,
  AutomationRule,
} from "../services/store";

export interface CommentEvent {
  commentId: string;
  commentText: string;
  username: string;
  mediaId?: string;
  isSimulated?: boolean;
}

export interface AutomationResult {
  matched: boolean;
  ruleName?: string;
  matchedKeywords?: string[];
  replySent: boolean;
  replyText?: string;
  dmSent: boolean;
  dmText?: string;
  status: "success" | "ignored" | "failed";
  errorMessage?: string;
  isSimulated?: boolean;
}

/**
 * Format message template with user variables
 */
export function formatTemplate(
  template: string,
  variables: { username: string; [key: string]: string }
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, "gi"), value);
  }
  return result;
}

/**
 * Select a random reply from a list of variations to prevent spam detection
 */
export function getRandomReply(replies: string[]): string {
  if (!replies || replies.length === 0) {
    return "Check your DM! 📩";
  }
  const index = Math.floor(Math.random() * replies.length);
  return replies[index];
}

/**
 * Match a comment text against active rules
 */
export function findMatchingRule(
  rules: AutomationRule[],
  commentText: string,
  mediaId?: string
): { rule: AutomationRule; matchedKeywords: string[] } | null {
  const normalizedComment = commentText.toLowerCase().trim();

  for (const rule of rules) {
    if (!rule.isActive) continue;

    // Check media filter if specified
    if (rule.mediaId && rule.mediaId !== "all" && mediaId) {
      if (rule.mediaId !== mediaId) {
        continue;
      }
    }

    const matchedKeywords: string[] = [];

    for (const rawKeyword of rule.triggerKeywords) {
      const keyword = rawKeyword.toLowerCase().trim();
      if (!keyword) continue;

      if (keyword === "*" || keyword === "all") {
        matchedKeywords.push(keyword);
        continue;
      }

      if (rule.matchType === "exact") {
        if (normalizedComment === keyword) {
          matchedKeywords.push(keyword);
        }
      } else {
        // "contains" match
        // Word boundary or substring match
        const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
        if (regex.test(normalizedComment) || normalizedComment.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
      }
    }

    if (matchedKeywords.length > 0) {
      return { rule, matchedKeywords };
    }
  }

  return null;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Official Meta Graph API: Send public comment reply
 * Endpoint: POST https://graph.facebook.com/v21.0/{comment_id}/replies
 */
export async function sendPublicCommentReply(
  commentId: string,
  message: string,
  accessToken: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(
      commentId
    )}/replies?access_token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      console.error("Meta Graph API comment reply error:", data.error);
      return {
        success: false,
        error: data.error?.message || "Failed to send comment reply",
      };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("sendPublicCommentReply exception:", message);
    return { success: false, error: message };
  }
}

/**
 * Official Meta Graph API: Send Private DM to commenter
 * Endpoint: POST https://graph.facebook.com/v21.0/me/messages
 * Recipient format: { "comment_id": commentId }
 */
export async function sendPrivateReplyDM(
  commentId: string,
  message: string,
  accessToken: string,
  targetId?: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    // Prefer Page ID or Instagram Account ID instead of 'me'
    const endpointId = targetId && targetId !== "me" ? targetId : "me";
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(
      endpointId
    )}/messages?access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: {
          comment_id: commentId,
        },
        message: {
          text: message,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      console.error("Meta Graph API private DM error:", data.error);
      return {
        success: false,
        error: data.error?.message || "Failed to send private DM",
      };
    }

    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("sendPrivateReplyDM exception:", message);
    return { success: false, error: message };
  }
}

/**
 * Official Meta Graph API: Auto-like commenter's comment
 * Endpoint: POST https://graph.facebook.com/v21.0/{comment_id}/likes
 */
export async function likeInstagramComment(
  commentId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(
      commentId
    )}/likes?access_token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ access_token: accessToken }),
    });
    const data = await response.json();
    return { success: response.ok && !data.error };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Core Automation Orchestrator
 * Evaluates comment against rules, handles simulated or live Meta API execution, and logs outcome.
 */
export async function processInstagramComment(
  event: CommentEvent
): Promise<AutomationResult> {
  const { commentId, commentText, username, mediaId, isSimulated } = event;

  const rules = await getRules();
  const settings = await getSettings();

  const match = findMatchingRule(rules, commentText, mediaId);

  if (!match) {
    const ignoredResult: AutomationResult = {
      matched: false,
      replySent: false,
      dmSent: false,
      status: "ignored",
      errorMessage: "No trigger keyword matched in comment",
      isSimulated,
    };

    await addLog({
      commentId,
      mediaId: mediaId || "",
      username,
      commentText,
      replySent: false,
      dmSent: false,
      status: "ignored",
      errorMessage: "No trigger keyword matched in comment",
      isSimulated,
    });

    return ignoredResult;
  }

  const { rule, matchedKeywords } = match;
  const replyText = getRandomReply(rule.commentReplies);
  const formattedReply = formatTemplate(replyText, { username });
  const formattedDM = formatTemplate(rule.dmMessage, { username });

  // If this is a simulated test or Meta access token is not configured yet,
  // simulate the success and log it.
  const hasLiveToken = Boolean(settings.pageAccessToken);

  let replySuccess = false;
  let dmSuccess = false;
  let errorMessage: string | undefined = undefined;

  if (isSimulated || !hasLiveToken) {
    // Simulated mode / Local preview mode
    replySuccess = true;
    dmSuccess = true;
  } else {
    // Live Meta Graph API mode
    const token = settings.pageAccessToken;

    // 1. Send public comment reply
    const replyRes = await sendPublicCommentReply(commentId, formattedReply, token);
    replySuccess = replyRes.success;
    if (!replyRes.success) {
      errorMessage = `Reply error: ${replyRes.error}`;
    }

    // 2. Send private DM
    const targetId = settings.pageId || settings.instagramAccountId;
    let dmRes = await sendPrivateReplyDM(commentId, formattedDM, token, targetId);
    if (!dmRes.success && settings.instagramAccountId && targetId !== settings.instagramAccountId) {
      dmRes = await sendPrivateReplyDM(commentId, formattedDM, token, settings.instagramAccountId);
    }
    dmSuccess = dmRes.success;
    if (!dmRes.success) {
      errorMessage = errorMessage
        ? `${errorMessage} | DM error: ${dmRes.error}`
        : `DM error: ${dmRes.error}`;
    }

    // 3. Optional auto-like
    if (rule.autoLike) {
      likeInstagramComment(commentId, token).catch(() => {});
    }
  }

  const finalStatus: "success" | "failed" =
    replySuccess || dmSuccess ? "success" : "failed";

  const result: AutomationResult = {
    matched: true,
    ruleName: rule.name,
    matchedKeywords,
    replySent: replySuccess,
    replyText: formattedReply,
    dmSent: dmSuccess,
    dmText: formattedDM,
    status: finalStatus,
    errorMessage,
    isSimulated: isSimulated || !hasLiveToken,
  };

  // Record log
  await addLog({
    commentId,
    mediaId: mediaId || "",
    username,
    commentText,
    matchedRuleName: rule.name,
    matchedKeywords,
    replySent: replySuccess,
    replyText: formattedReply,
    dmSent: dmSuccess,
    dmText: formattedDM,
    status: finalStatus,
    errorMessage,
    isSimulated: isSimulated || !hasLiveToken,
  });

  // Increment rule trigger count
  await incrementRuleTriggerCount(rule._id);

  return result;
}


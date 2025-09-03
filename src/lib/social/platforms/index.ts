/* lib/social/get-platform-operations.ts */
import { FacebookPlatform  } from "./facebook";
import { GoogleBusinessPlatform } from "./google-business";
import { InstagramPlatform } from "./instagram";
import { LinkedInPlatform } from "./linkedin";
import { PinterestPlatform } from "./pinterest";
import { PlatformOperations, PostHistory, SocialAccount, SocialPage } from "./platform-types";
import { YouTubePlatform } from "./youtube";
import { TikTokPlatform } from "./tiktok";

/* Consolidated provider-side env config */
const ENV = {
  facebook : {
    clientId     : process.env.FACEBOOK_CLIENT_ID     ?? "",
    clientSecret : process.env.FACEBOOK_CLIENT_SECRET ?? "",
    redirectUri  : process.env.FACEBOOK_REDIRECT_URI  ?? "",
  },
  instagram: {
    clientId     : process.env.INSTAGRAM_CLIENT_ID     ?? "",
    clientSecret : process.env.INSTAGRAM_CLIENT_SECRET ?? "",
    redirectUri  : process.env.INSTAGRAM_REDIRECT_URI  ?? "",
  },
  pinterest: {
    clientId     : process.env.PINTEREST_CLIENT_ID     ?? "",
    clientSecret : process.env.PINTEREST_CLIENT_SECRET ?? "",
    redirectUri  : process.env.PINTEREST_REDIRECT_URI  ?? "",
    baseUrl      : process.env.PINTEREST_API_BASE      ?? "https://api.pinterest.com",
  },
  linkedin: {
    clientId     : process.env.LINKEDIN_CLIENT_ID     ?? "",
    clientSecret : process.env.LINKEDIN_CLIENT_SECRET ?? "",
    redirectUri  : process.env.LINKEDIN_REDIRECT_URI  ?? "",
    baseUrl      : process.env.LINKEDIN_API_BASE      ?? "https://api.linkedin.com",
  },
  youtube: {
    clientId     : process.env.YOUTUBE_CLIENT_ID     ?? "",
    clientSecret : process.env.YOUTUBE_CLIENT_SECRET ?? "",
    redirectUri  : process.env.YOUTUBE_REDIRECT_URI  ?? "",
  },
  google: {
    clientId     : process.env.GOOGLE_CLIENT_ID     ?? "",
    clientSecret : process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri  : process.env.GOOGLE_REDIRECT_URI  ?? "",
  },
  tiktok: {
    clientId     : process.env.TIKTOK_CLIENT_ID     ?? "",
    clientSecret : process.env.TIKTOK_CLIENT_SECRET ?? "",
    redirectUri  : process.env.TIKTOK_REDIRECT_URI  ?? "",
  }
} as const;

/* Factory */
export function getPlatformOperations(p: keyof typeof ENV, method?: string): PlatformOperations | null {
  switch (p) {
    case "facebook":  return new FacebookPlatform (ENV.facebook);
    case "instagram": 
      if (method?.toLowerCase() == 'instagram_business') {
        return new InstagramPlatform(ENV.instagram, 'instagram_business');
      } else {
        return new InstagramPlatform({clientId: ENV.facebook.clientId, clientSecret: ENV.facebook.clientSecret, redirectUri: ENV.instagram.redirectUri}, 'facebook');
      }
    case "pinterest": return new PinterestPlatform(
                         ENV.pinterest.clientId,
                         ENV.pinterest.clientSecret,
                         ENV.pinterest.redirectUri,
                       );
    case "linkedin":  return new LinkedInPlatform(ENV.linkedin);
    case "tiktok":    return new TikTokPlatform(ENV.tiktok);
    case "youtube":   return new YouTubePlatform(
                         ENV.youtube.clientId,
                         ENV.youtube.clientSecret,
                         ENV.youtube.redirectUri,
                       );
    case "google":    return new GoogleBusinessPlatform({
                         clientId: ENV.google.clientId,
                         clientSecret: ENV.google.clientSecret,
                         redirectUri: ENV.google.redirectUri,
                       });
    default:          return null;
  }
}

export async function fetchJSON<T = any>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const r = await fetch(url, init);
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error?.message ?? r.statusText);
  return j;
}
/*—— “Boards = Pages” for Pinterest ———————————*/
async function listPages(acc: SocialAccount): Promise<SocialPage[]> {
  type Boards = { items: { id: string; name: string }[] };
  const data: Boards = await fetchJSON(
    `${ENV.pinterest.baseUrl}/v5/boards?page_size=250`,
    { headers: { Authorization: `Bearer ${acc.authToken}` } },
  );

  return data.items.map<SocialPage>((b) => ({
    id        : crypto.randomUUID(),
    platform  : 'pinterest',
    entityType: 'board',
    name      : b.name,
    pageId    : b.id,          // keep old name for now
    authToken : acc.authToken,
    connected : true,
    status    : 'active',
    statusUpdatedAt: new Date(),
    accountId : acc.id,
  }));
}

async function publishPost(
  pg: SocialPage,
  post: { content: string; mediaUrls?: string[] }
): Promise<PostHistory> {
  if (!post.mediaUrls?.length) throw new Error('Pinterest needs an image');

  const body = {
    board_id    : pg.pageId,
    title       : post.content.slice(0, 100),
    description : post.content,
    media_source: { source_type: 'image_url', url: post.mediaUrls[0] },
  };

  const res = await fetchJSON<{ id: string }>(
    `${ENV.pinterest.baseUrl}/v5/pins`,
    {
      method : 'POST',
      headers: {
        Authorization : `Bearer ${pg.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  return {
    id         : res.id,
    pageId     : pg.id,
    postId     : res.id,
    content    : post.content,
    mediaUrls  : post.mediaUrls,
    status     : 'published',
    publishedAt: new Date(),
  };
}


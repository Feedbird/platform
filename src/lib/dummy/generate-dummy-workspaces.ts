"use server";

import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from 'uuid';
import {
  Workspace,
  Brand,
  Post,
  Block,
  Version,
  BaseComment,
  VersionComment,
  Activity,
  Board,
  Status,
} from "@/lib/store/use-feedbird-store";
import { 
  Platform, 
  FileKind,
  SocialPage as SocialPageType,
  ContentFormat
} from "@/lib/social/platforms/platform-types";

/* all possible socials */
const ALL_PLATFORMS: Platform[] = [
  "facebook",
  "instagram",
  "linkedin",
  "pinterest",
  "youtube",
  "tiktok",
  "google",
];

const SAMPLE_IMAGES = [
  "https://farm3.staticflickr.com/2220/1572613671_7311098b76_z_d.jpg",
  "https://farm2.staticflickr.com/1090/4595137268_0e3f2b9aa7_z_d.jpg",
  "https://farm4.staticflickr.com/3075/3168662394_7d7103de7d_z_d.jpg",
  "https://farm9.staticflickr.com/8505/8441256181_4e98d8bff5_z_d.jpg",
];
const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const STATUSES: Status[] = [
  "Draft",
  "Pending Approval",
  "Needs Revisions",
  "Revised",
  "Approved",
  "Scheduled",
  "Published",
  "Failed Publishing",
];

/**
 * Determines the correct post status based on publish date and current status
 * If publish date is in the past, status should be 'Published' or 'Failed Publishing'
 * If publish date is in the future or null, status should be one of the other statuses
 */
function determineCorrectStatus(currentStatus: Status, publish_date: Date | null): Status {
  // If no publish date, keep current status
  if (!publish_date) {
    return currentStatus;
  }

  // Convert to Date object if it's a string (due to JSON serialization)
  const publishDateObj = publish_date instanceof Date ? publish_date : new Date(publish_date);
  
  // Check if the date is valid
  if (isNaN(publishDateObj.getTime())) {
    return currentStatus;
  }

  const now = new Date();
  const isPast = publishDateObj < now;
  if (isPast) {
    // If publish date is in the past, status should be 'Published' or 'Failed Publishing'
    // Only change if current status is not already one of these
    if (currentStatus === "Published" || currentStatus === "Failed Publishing") {
      return currentStatus; // Keep as is
    }
    // For other statuses, change to Published (unless it was Failed Publishing)
    return "Published";
  } else {
    // If publish date is in the future, keep current status
    // Only change if current status is past-related and publish date is in future
    if (currentStatus === "Published" || currentStatus === "Failed Publishing") {
      return "Scheduled";
    }
    return currentStatus;
  }
}

function rInt(min: number, max: number) {
  return faker.number.int({ min, max });
}

/** Possibly mark as revision. */
function makeBaseComment(author?: string): BaseComment {
  return {
    id: uuidv4(),
    parentId: undefined,
    createdAt: faker.date.recent({ days: 12 }),
    author: author || faker.person.firstName(),
    text: faker.lorem.sentence(),
    revisionRequested: faker.datatype.boolean()
  };
}

/** 
 * Make nested base comments 
 * e.g. top-level + replies. 
*/
function buildNestedBaseComments(minTop: number, maxTop: number): BaseComment[] {
  const result: BaseComment[] = [];
  const topCount = rInt(minTop, maxTop);
  for (let i=0; i<topCount; i++){
    const top = makeBaseComment();
    result.push(top);
    // random replies
    const repCount = rInt(0,2);
    for (let r=0; r<repCount; r++){
      const reply = makeBaseComment("ReplyUser");
      reply.parentId = top.id;
      result.push(reply);
    }
  }
  return result;
}

/** 
 * Similar approach for version comments. 
 * Possibly bounding rect, same random nesting. 
*/
function makeVersionComment(author?: string): VersionComment {
  const base = makeBaseComment(author);
  const vc: VersionComment = {
    ...base,
  };
  if (faker.datatype.boolean()) {
    vc.rect = {
      x: rInt(40, 220),
      y: rInt(40, 220),
      w: rInt(40, 100),
      h: rInt(40, 100),
    };
  }
  return vc;
}
function buildNestedVersionComments(minTop: number, maxTop: number): VersionComment[] {
  const results: VersionComment[] = [];
  const topCount = rInt(minTop, maxTop);
  for (let i=0; i<topCount; i++){
    const top = makeVersionComment();
    results.push(top);
    // possible replies
    const reps = rInt(0,2);
    for (let j=0; j<reps; j++){
      const rep = makeVersionComment("SubReplier");
      rep.parentId = top.id;
      results.push(rep);
    }
  }
  return results;
}

/** 
 * Make a single version 
*/
function makeVersion(kind: FileKind, idx: number): Version {
  const isVid = kind==="video";
  return {
    id: uuidv4(),
    createdAt: faker.date.past(),
    by: faker.person.firstName(),
    caption: idx===0 ? "Initial" : `Revision ${idx}`,
    file: {
      kind,
      url: isVid 
        ? SAMPLE_VIDEO
        : faker.helpers.arrayElement(SAMPLE_IMAGES),
    },
    comments: buildNestedVersionComments(0, 5),
  };
}

/** 
 * Build a block with X versions + block-level nested comments 
*/
function makeBlock(kind: FileKind): Block {
  const isVid    = kind === "video";
  const versCnt  = rInt(3, 4);
  const versions: Version[] = [];
  for (let i = 0; i < versCnt; i++) versions.push(makeVersion(kind, i));

  return {
    id: uuidv4(),
    kind,
    currentVersionId: versions[versions.length - 1].id,
    versions,
    comments: buildNestedBaseComments(0, 3),
  };
}



/**
 * Build a single post and assign it to a board
 */
function makePost(
  workspaceId: string, 
  boardId: string, 
  brandPlatforms: Platform[],
  brandPages: SocialPageType[],
  month: number
): Post {
  const postPlatforms = faker.helpers.arrayElements(brandPlatforms, { min: 1, max: 3 })
  const availablePages = brandPages.filter(p => postPlatforms.includes(p.platform) && p.connected);
  const selectedPages = faker.helpers.arrayElements(availablePages, { min: 1, max: Math.min(availablePages.length, 3) });
  
  const statuses: Status[] = ["Draft", "Pending Approval", "Approved", "Published", "Needs Revisions", "Revised"];
  const formats: ContentFormat[] = ["image", "video", "carousel", "story", "email"];
  
  const post: Post = {
    id: uuidv4(),
    workspaceId,
    boardId,
    caption: {
      synced: true,
      default: faker.lorem.sentence(),
    },
    status: faker.helpers.arrayElement(statuses),
    format: faker.helpers.arrayElement(formats),
    publish_date: faker.datatype.boolean() ? faker.date.future() : null,
    updatedAt: faker.date.recent(),
    platforms: postPlatforms,
    pages: selectedPages.map(p => p.id),
    billingMonth: faker.date.month(),
    month,
    settings: {
      
      thumbnail: faker.datatype.boolean(),
      locationTags: faker.datatype.boolean() ? [faker.location.city()] : [],
      taggedAccounts: faker.datatype.boolean() ? [faker.internet.userName()] : [],
    },
    hashtags: {
      synced: true,
      default: faker.lorem.words(3).split(' ').map(w => `#${w}`).join(' '),
    },
    blocks: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => makeBlock(faker.helpers.arrayElement(['image', 'video'] as FileKind[]))),
    comments: buildNestedBaseComments(1, 3),
    activities: []
  };

  // Apply business rule to determine correct status
  post.status = determineCorrectStatus(post.status, post.publish_date);
  
  return post;
}

/** 
 * Make brand with random set of platforms + pages + 4..8 posts 
*/
function makeBrand(): Brand {
  const bid = uuidv4();
  const brandPlatforms = faker.helpers.arrayElements(ALL_PLATFORMS, {
    min: 2,
    max: 5,
  });
  // pages
  function makePagesFor(platform: Platform): SocialPageType[] {
    const howMany = rInt(3, 5);
    const arr: SocialPageType[] = [];
    const statuses: ("active" | "expired" | "pending" | "disconnected")[] = ["active", "expired", "pending", "disconnected"];
    
    for (let i=0; i<howMany; i++){
      const status = i === 0 ? "active" : faker.helpers.arrayElement(statuses);
      const connected = status === "active" ? true : false;
      
      arr.push({
        id: uuidv4(),
        name: faker.company.name(),
        pageId: uuidv4(),
        platform,
        authToken: faker.string.uuid(),
        connected,
        status,
        postCount: faker.number.int({ min: 10, max: 100 }),
        followerCount: faker.number.int({ min: 100, max: 10000 }),
        entityType: "page",
        accountId: uuidv4()
      });
    }
    return arr;
  }
  const pages = brandPlatforms.flatMap((c)=> makePagesFor(c));
  // posts – boardId will be filled later when workspace boards are known
  const posts: Post[] = [];
  return {
    id: uuidv4(),
    name: faker.company.name(),
    logo: faker.image.avatarGitHub(),
    styleGuide: {
      fonts: [faker.internet.domainWord()],
      colors: [faker.internet.color()],
    },
    platforms: brandPlatforms,
    socialAccounts: [],
    socialPages: pages,
    link: faker.internet.url(),
    voice: faker.company.buzzPhrase(),
    prefs: faker.lorem.sentence(),
  };
}

/** Build 1..N workspaces */
export async function generateDummyWorkspaces(count=2): Promise<Workspace[]> {
  const results: Workspace[] = [];
  for (let i=0; i<count; i++){
    const wid = uuidv4();
    const brandCount = rInt(2,3);
    const brandArr: Brand[] = [];
    for (let j=0; j<brandCount; j++){
      brandArr.push(makeBrand());
    }

    // Create boards (clone default boards with unique ids per workspace if needed)
    const boards: Board[] = DEFAULT_BOARDS.map((b) => ({ 
      ...b, 
      posts: [] 
    }));

    // To ensure 20 posts are visible per board, we'll assign all posts to the boards.
    if (brandArr.length > 0) {
      const primaryBrand = brandArr[0];
      for (const board of boards) {
        // 10 posts for Month 1
        for (let p = 0; p < 10; p++) {
          const post = makePost(wid, board.id, primaryBrand.platforms ?? [], primaryBrand.socialPages, 1);
          board.posts.push(post);
        }
        // 10 posts for Month 2
        for (let p = 0; p < 10; p++) {
          const post = makePost(wid, board.id, primaryBrand.platforms ?? [], primaryBrand.socialPages, 2);
          board.posts.push(post);
        }
      }
    }

    results.push({
      id: wid,
      name: faker.company.name(),
      logo: faker.image.avatarGitHub(),
      createdby: uuidv4(), // Dummy creator ID for demo purposes
      boards,
      brand: brandArr[0]
    });
  }
  return results;
}

function makeComment(author: string): BaseComment {
  return {
    id: uuidv4(),
    createdAt: faker.date.recent(),
    author,
    text: faker.lorem.sentence(),
    revisionRequested: faker.datatype.boolean(),
  };
}

// Default boards (same as app startup)
const DEFAULT_BOARDS: Board[] = [
  { 
    id: "static-posts", 
    name: "Static Posts", 
    image: "/images/boards/static-posts.svg", 
    color: "#125AFF",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: -1,
      ongoingMonth: -1,
      approvalDays: 7,
    },
    createdAt: new Date('2025-01-01'),
    posts: [],
  },
  { 
    id: "short-form-videos", 
    name: "Short-Form Videos", 
    image: "/images/boards/short-form-videos.svg", 
    color: "#125AFF",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 3,
      ongoingMonth: 2,
      approvalDays: 7,
    },
    createdAt: new Date('2025-01-01'),
    posts: [],
  },
  { 
    id: "email-design", 
    name: "Email Design", 
    image: "/images/boards/email-design.svg", 
    color: "#125AFF",
    rules: {
      autoSchedule: true,
      revisionRules: true,
      approvalDeadline: true,
      groupBy: "month",
      sortBy: "status",
      rowHeight: "Large",
      firstMonth: 3,
      ongoingMonth: 2,
      approvalDays: 7,
    },
    createdAt: new Date('2025-01-01'),
    posts: [],
  },
];

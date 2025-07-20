"use server";

import { faker } from "@faker-js/faker";
import { nanoid } from "nanoid";
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
} from "@/lib/store/use-feedbird-store";
import { 
  Platform, 
  Status, 
  FileKind,
  SocialPage as SocialPageType 
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

function rInt(min: number, max: number) {
  return faker.number.int({ min, max });
}

/** Possibly mark as revision. */
function makeBaseComment(author?: string): BaseComment {
  return {
    id: nanoid(),
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
    id: nanoid(),
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
    id: nanoid(),
    kind,
    currentVersionId: versions[versions.length - 1].id,
    versions,
    comments: buildNestedBaseComments(0, 3),
  };
}

/** 
 * Random activity 
*/
function makeActivity(postId: string): Activity {
  const actions = [
    "uploaded a new version",
    "approved the post",
    "requested changes",
    "scheduled the post",
    "left a comment",
  ];
  return {
    id: nanoid(),
    postId,
    actor: faker.person.firstName(),
    action: faker.helpers.arrayElement(actions),
    at: faker.date.recent({ days:5 }),
  };
}

/**
 * Build a single post and assign it to a board
 */
function makePost(brandId: string, boardId: string, brandPlatforms: Platform[]): Post {
  // 20% chance the format is empty (not yet determined)
  const random = faker.number.int({ min: 0, max: 9 });
  const format = random < 4
    ? "" // empty / undetermined format
    : faker.helpers.arrayElement<
        "static" | "carousel" | "story" | "video" | "email" | "blog"
      >(["static", "carousel", "story", "video", "email", "blog"]);

  /* match format → file kind */
  const fileKind: FileKind = format === "video" ? "video" : "image";

  /* now build blocks with the chosen kind */
  const blocks = Array.from(
    { length: faker.number.int({ min: 1, max: 3 }) },
    () => makeBlock(fileKind),
  );

  /* … everything else stays exactly the same … */
  return {
    id: nanoid(),
    brandId,
    boardId,
    caption: {
      synced: true,
      default: faker.lorem.sentence(),
      perPlatform: {},
    },
    status: faker.helpers.arrayElement(STATUSES),
    format,
    // publishDate: null as unknown as Date,
    publishDate: faker.date.recent({ days: 3 }),
    updatedAt: null as unknown as Date,
    platforms: faker.helpers.arrayElements(brandPlatforms, { min: 1, max: 3 }),
    pages: [],
    month: faker.number.int({ min: 1, max: 50 }),
    blocks,
    comments: Array.from(
      { length: faker.number.int({ min: 0, max: 3 }) },
      () => makeComment("Me"),
    ),
    activities: Array.from(
      { length: faker.number.int({ min: 1, max: 5 }) },
      () => makeActivity(nanoid()),
    ),
  };
}

/** 
 * Make brand with random set of platforms + pages + 4..8 posts 
*/
function makeBrand(): Brand {
  const bid = nanoid();
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
      const connected = status === "active" ? faker.datatype.boolean() : false;
      
      arr.push({
        id: nanoid(),
        name: faker.company.name(),
        pageId: nanoid(),
        platform,
        authToken: faker.string.uuid(),
        connected,
        status,
        postCount: faker.number.int({ min: 10, max: 100 }),
        followerCount: faker.number.int({ min: 100, max: 10000 }),
        entityType: "page",
        accountId: nanoid()
      });
    }
    return arr;
  }
  const pages = brandPlatforms.flatMap((c)=> makePagesFor(c));
  // posts – boardId will be filled later when workspace boards are known
  const posts: Post[] = [];
  return {
    id: bid,
    name: faker.company.name(),
    logo: faker.image.avatarGitHub(),
    styleGuide: {
      fonts: ["Inter","Roboto","Georgia"],
      colors:["#000","#fff","#ff6900"]
    },
    platforms: brandPlatforms,
    socialAccounts: [],
    socialPages: pages,
    link: faker.internet.url(),
    voice: faker.company.buzzPhrase(),
    prefs: faker.lorem.sentence(),
    contents: posts,
  };
}

/** Build 1..N workspaces */
export async function generateDummyWorkspaces(count=2): Promise<Workspace[]> {
  const results: Workspace[] = [];
  for (let i=0; i<count; i++){
    const wid = nanoid();
    const brandCount = rInt(3,5);
    const brandArr: Brand[] = [];
    for (let j=0; j<brandCount; j++){
      brandArr.push(makeBrand());
    }

    // Create boards (clone default boards with unique ids per workspace if needed)
    const boards = DEFAULT_BOARDS.map((b) => ({ ...b }));

    // Assign posts to boards now – iterate each brand & generate posts
    for (const brand of brandArr){
      const postCount = rInt(20, 30);
      for (let p=0; p<postCount; p++){
        const boardPick = faker.helpers.arrayElement(boards);
        const post = makePost(brand.id, boardPick.id, brand.platforms ?? []);
        brand.contents.push(post);
      }
    }

    results.push({
      id: wid,
      name: faker.company.name(),
      logo: faker.image.avatarGitHub(),
      boards,
      brands: brandArr
    });
  }
  return results;
}

function makeComment(author: string): BaseComment {
  return {
    id: nanoid(),
    createdAt: faker.date.recent(),
    author,
    text: faker.lorem.sentence(),
    revisionRequested: faker.datatype.boolean(),
  };
}

// Default boards (same as app startup)
const DEFAULT_BOARDS: Board[] = [
  { id: "static-posts", name: "Static Posts", image: "/images/boards/static-posts.svg" },
  { id: "short-form-videos", name: "Short-Form Videos", image: "/images/boards/short-form-videos.svg" },
  { id: "email-design", name: "Email Design", image: "/images/boards/email-design.svg" },
];

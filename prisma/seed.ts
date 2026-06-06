import { PrismaClient, ForumRole, PostType, NotificationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with nostalgic 2010 items...");

  // Clean existing tables (in order of dependencies)
  await prisma.privateMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.commentLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postBookmark.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  await prisma.forumMember.deleteMany();
  await prisma.forum.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing database tables.");

  // Password for all seeded users
  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Users
  const usersData = [
    {
      username: "ModeratorBob",
      email: "bob@retrolink.net",
      passwordHash,
      bio: "Site administrator and tech collector. Keep it civil in the threads! Under construction [gif].",
      reputation: 250,
      avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=bob",
    },
    {
      username: "xX_TrollFace_Xx",
      email: "troll@retrolink.net",
      passwordHash,
      bio: "Problem? U MAD BRO? Rage comics are life. Banned 3 times on phpBB boards.",
      reputation: -15, // A true negative reputation troll
      avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=troll",
    },
    {
      username: "CSS_Wizard_2010",
      email: "wizard@retrolink.net",
      passwordHash,
      bio: "Custom MySpace profile decorator. I write tables in my sleep. IE6 must die.",
      reputation: 180,
      avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=css",
    },
    {
      username: "WinampLover",
      email: "winamp@retrolink.net",
      passwordHash,
      bio: "It really whips the llama's ass! Winamp 5.6 is peak media player software. Skins collector.",
      reputation: 95,
      avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=winamp",
    },
    {
      username: "MinecraftAlpha_Player",
      email: "minecraft@retrolink.net",
      passwordHash,
      bio: "Did you hear about the new Nether update in Minecraft? Watch out for Herobrine...",
      reputation: 130,
      avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=steve",
    },
    {
      username: "Sk8rBoi_92",
      email: "skater@retrolink.net",
      passwordHash,
      bio: "Punk rock, skateboarding, and coding on my Intel Core 2 Duo laptop. Rawr xD.",
      reputation: 60,
      avatarUrl: "https://api.dicebear.com/7.x/pixel-art/svg?seed=skater",
    },
  ];

  const users: any[] = [];
  for (const u of usersData) {
    const user = await prisma.user.create({ data: u });
    users.push(user);
  }

  const bob = users[0];
  const troll = users[1];
  const wizard = users[2];
  const winamp = users[3];
  const steve = users[4];
  const skater = users[5];

  console.log(`Created ${users.length} retro users.`);

  // 2. Create Forums (Communities)
  const forumsData = [
    {
      name: "General Chit-Chat",
      slug: "general-chit-chat",
      description: "The official off-topic lounge. Introduce yourself, post memes, and talk about whatever! No flaming.",
      rules: "1. Respect members. 2. No spam or double posting. 3. Put heavy images in spoiler tags.",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=general",
      ownerId: bob.id,
    },
    {
      name: "Technology & OS Corner",
      slug: "tech-corner",
      description: "Windows 7 vs Vista, Linux distros, building custom desktop PCs, and smartphone talk (iPhone 4 vs Nexus One).",
      rules: "Keep code snippets clean. Use syntax highlighters. No illegal downloads links.",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=tech",
      ownerId: bob.id,
    },
    {
      name: "Gaming Zone Classic",
      slug: "gaming-zone",
      description: "PC gaming, Xbox 360 Halo nights, PS3, Wii hacking, and indie hits (Minecraft, Super Meat Boy).",
      rules: "Keep console war arguments friendly. Use spoiler tags for game plots.",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=game",
      ownerId: bob.id,
    },
    {
      name: "Web Dev & Custom CSS Shop",
      slug: "web-dev",
      description: "Making tables look good, custom MySpace background codes, jQuery tricks, and complaining about Internet Explorer.",
      rules: "Do not post malicious Javascript. Validate your XHTML!",
      logoUrl: "https://api.dicebear.com/7.x/identicon/svg?seed=cssdev",
      ownerId: wizard.id,
    },
  ];

  const forums: any[] = [];
  for (const f of forumsData) {
    const forum = await prisma.forum.create({ data: f });
    forums.push(forum);
  }

  const general = forums[0];
  const tech = forums[1];
  const gaming = forums[2];
  const webdev = forums[3];

  console.log(`Created ${forums.length} forums.`);

  // 3. Create Forum Memberships
  const memberships = [
    // General
    { userId: bob.id, forumId: general.id, role: ForumRole.OWNER },
    { userId: troll.id, forumId: general.id, role: ForumRole.MEMBER },
    { userId: wizard.id, forumId: general.id, role: ForumRole.MEMBER },
    { userId: winamp.id, forumId: general.id, role: ForumRole.MEMBER },
    { userId: steve.id, forumId: general.id, role: ForumRole.MEMBER },
    { userId: skater.id, forumId: general.id, role: ForumRole.MEMBER },
    
    // Tech
    { userId: bob.id, forumId: tech.id, role: ForumRole.OWNER },
    { userId: winamp.id, forumId: tech.id, role: ForumRole.MODERATOR },
    { userId: wizard.id, forumId: tech.id, role: ForumRole.MEMBER },
    { userId: troll.id, forumId: tech.id, role: ForumRole.MEMBER },
    
    // Gaming
    { userId: bob.id, forumId: gaming.id, role: ForumRole.OWNER },
    { userId: steve.id, forumId: gaming.id, role: ForumRole.MODERATOR },
    { userId: skater.id, forumId: gaming.id, role: ForumRole.MEMBER },
    { userId: troll.id, forumId: gaming.id, role: ForumRole.MEMBER },

    // WebDev
    { userId: wizard.id, forumId: webdev.id, role: ForumRole.OWNER },
    { userId: bob.id, forumId: webdev.id, role: ForumRole.MEMBER },
    { userId: skater.id, forumId: webdev.id, role: ForumRole.MEMBER },
  ];

  for (const m of memberships) {
    await prisma.forumMember.create({ data: m });
  }

  // Update forum member counts
  await prisma.forum.update({ where: { id: general.id }, data: { memberCount: 6 } });
  await prisma.forum.update({ where: { id: tech.id }, data: { memberCount: 4 } });
  await prisma.forum.update({ where: { id: gaming.id }, data: { memberCount: 4 } });
  await prisma.forum.update({ where: { id: webdev.id }, data: { memberCount: 3 } });

  console.log("Created forum memberships.");

  // 4. Create Posts
  const postsData = [
    // General Forum Posts
    {
      title: "Welcome to Retrolink! Read before posting!",
      content: "Hello everyone and welcome to Retrolink! This is a social board blending the classic, cozy feeling of phpBB/vBulletin forums with a direct, conversational community feed.\n\n" +
               "Please check the pinned threads, upload your custom pixel-art avatars, and fill out your DMs profile. Let us know where you are from and what your very first operating system was!\n\n" +
               "Best regards,\nBob - Administrator",
      type: PostType.TEXT,
      viewCount: 154,
      likeCount: 4,
      commentCount: 3,
      userId: bob.id,
      forumId: general.id,
      createdAt: new Date("2026-05-15T12:00:00Z"),
    },
    {
      title: "Who remembers the 'Forever Alone' rage comic? xD",
      content: "I was browsing my archive of funny pictures from 2010 and found this gems folder. Trollface, Forever Alone, Me Gusta, FFUUUU...\n" +
               "Honestly, internet humor back then was so simple and amazing. Here is one of my favorites!",
      type: PostType.IMAGE,
      mediaUrl: "https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?auto=format&fit=crop&w=800&q=80", // A generic placeholder image representing nostalgic art
      viewCount: 92,
      likeCount: 2,
      commentCount: 2,
      userId: skater.id,
      forumId: general.id,
      createdAt: new Date("2026-05-20T16:30:00Z"),
    },
    {
      title: "Awesome YouTube Video: Evolution of Dance!",
      content: "This video has over 100 million views! It is crazy how fast it became viral. I can check this on repeat all day! Check it out guys.",
      type: PostType.LINK,
      linkUrl: "https://www.youtube.com/watch?v=dMH0bHeiRNg",
      viewCount: 68,
      likeCount: 3,
      commentCount: 1,
      userId: winamp.id,
      forumId: general.id,
      createdAt: new Date("2026-05-22T09:15:00Z"),
    },

    // Tech Forum Posts
    {
      title: "Is Windows 7 really the peak OS? (Vista is garbage)",
      content: "I upgraded my custom desktop (Core 2 Quad, 4GB RAM, Nvidia GTS 250) from Vista to Windows 7 Home Premium yesterday.\n\n" +
               "The Aero glass effect is much faster, boot times are halved, and the new Superbar taskbar is absolute genius. Vista was constantly hogging my RAM and hard drive. Who else has made the jump?",
      type: PostType.DISCUSSION,
      viewCount: 210,
      likeCount: 5,
      commentCount: 4,
      userId: winamp.id,
      forumId: tech.id,
      createdAt: new Date("2026-05-18T14:40:00Z"),
    },
    {
      title: "My custom Winamp skin collection (Screenshots inside)",
      content: "Sharing is caring! I have compiled over 50 skins from the early 2000s, including classic silver, alienware green, and anime themes. Winamp 5.6 classic layout is simply the greatest media player ever engineered. No bloated web browsers, just pure MP3 playback! Let me know if you want the zip archive.",
      type: PostType.TEXT,
      viewCount: 88,
      likeCount: 4,
      commentCount: 2,
      userId: winamp.id,
      forumId: tech.id,
      createdAt: new Date("2026-05-25T11:20:00Z"),
    },

    // Gaming Forum Posts
    {
      title: "Minecraft Beta 1.7.3 - The ultimate version?",
      content: "Before they added the hunger bar, experience points, and potions, Minecraft was a completely different survival experience. The classic neon green grass, simple world generator, and pure block mining felt so cozy. Does anyone still host standard Beta 1.7.3 servers? Let's connect!",
      type: PostType.DISCUSSION,
      viewCount: 135,
      likeCount: 6,
      commentCount: 3,
      userId: steve.id,
      forumId: gaming.id,
      createdAt: new Date("2026-05-19T21:05:00Z"),
    },

    // WebDev Forum Posts
    {
      title: "Complaining about Internet Explorer 8 (CSS bugs)",
      content: "Why does `border-radius` still not work in IE8? I'm forced to use multiple nested elements with rounded corners slices in PNG-24 with `filter: progid:DXImageTransform.Microsoft.AlphaImageLoader` to prevent ugly black borders.\n\n" +
               "Microsoft is single-handedly holding the internet back! Here is my CSS workaround for glossy tabs...",
      type: PostType.TEXT,
      viewCount: 75,
      likeCount: 3,
      commentCount: 2,
      userId: wizard.id,
      forumId: webdev.id,
      createdAt: new Date("2026-05-24T18:10:00Z"),
    },
  ];

  const posts: any[] = [];
  for (const p of postsData) {
    const post = await prisma.post.create({ data: p });
    posts.push(post);
  }

  const welcomePost = posts[0];
  const ragePost = posts[1];
  const win7Post = posts[3];
  const mcPost = posts[5];
  const ie8Post = posts[6];

  // Update forum post counts
  await prisma.forum.update({ where: { id: general.id }, data: { postCount: 3 } });
  await prisma.forum.update({ where: { id: tech.id }, data: { postCount: 2 } });
  await prisma.forum.update({ where: { id: gaming.id }, data: { postCount: 1 } });
  await prisma.forum.update({ where: { id: webdev.id }, data: { postCount: 1 } });

  console.log("Created nostalgic posts.");

  // 5. Create Comments (Nested discussion threads)
  // Level 1 Comments
  const c1 = await prisma.comment.create({
    data: {
      content: "Great to be here, Bob! The forum loads fast. Thanks for setting up this board, feels like coming back home after school in 2008.",
      userId: skater.id,
      postId: welcomePost.id,
      createdAt: new Date("2026-05-15T12:30:00Z"),
    },
  });

  const c2 = await prisma.comment.create({
    data: {
      content: "Nice site! Hope we do not get too many trolls around here.",
      userId: wizard.id,
      postId: welcomePost.id,
      createdAt: new Date("2026-05-15T13:10:00Z"),
    },
  });

  const c3 = await prisma.comment.create({
    data: {
      content: "U MAD BRO? Trolls are the soul of the forums! Problem admin? :Trollface:",
      userId: troll.id,
      postId: welcomePost.id,
      createdAt: new Date("2026-05-15T14:05:00Z"),
    },
  });

  // Level 2 Nesting (Replies to replies)
  await prisma.comment.create({
    data: {
      content: "Keep it under control, xX_TrollFace_Xx. I'm watching you! (Already readied the ban hammer).",
      userId: bob.id,
      postId: welcomePost.id,
      parentId: c3.id,
      createdAt: new Date("2026-05-15T15:20:00Z"),
    },
  });

  // Gaming Comments
  const gc1 = await prisma.comment.create({
    data: {
      content: "Absolutely! Minecraft Beta 1.7.3 was gold. No creative flight, no sprinting. You actually feared the night. I have an active server! IP: 127.0.0.1 (use standard launcher). Let's build a classic cobblestone castle.",
      userId: skater.id,
      postId: mcPost.id,
      createdAt: new Date("2026-05-19T21:45:00Z"),
    },
  });

  await prisma.comment.create({
    data: {
      content: "Wait, isn't that the version right before the Adventure Update? I miss the classic green block icons so much.",
      userId: winamp.id,
      postId: mcPost.id,
      parentId: gc1.id,
      createdAt: new Date("2026-05-19T22:15:00Z"),
    },
  });

  // Tech Comments
  const tc1 = await prisma.comment.create({
    data: {
      content: "Windows 7 is incredible. The taskbar preview screenshots are awesome. I will never touch Vista or XP again.",
      userId: wizard.id,
      postId: win7Post.id,
      createdAt: new Date("2026-05-18T15:05:00Z"),
    },
  });

  const tc2 = await prisma.comment.create({
    data: {
      content: "Meh, Windows XP is still the king. Lower footprint and runs all my legacy games perfectly. Windows 7 is just Vista in a prettier costume. Fight me!",
      userId: troll.id,
      postId: win7Post.id,
      createdAt: new Date("2026-05-18T15:30:00Z"),
    },
  });

  await prisma.comment.create({
    data: {
      content: "XP is insecure now and doesn't natively support DX11. Windows 7 is a necessary upgrade, troll. Stop living in 2001.",
      userId: winamp.id,
      postId: win7Post.id,
      parentId: tc2.id,
      createdAt: new Date("2026-05-18T16:00:00Z"),
    },
  });

  console.log("Created nested replies.");

  // 6. Create Post Likes & Bookmarks
  await prisma.postLike.createMany({
    data: [
      { userId: skater.id, postId: welcomePost.id },
      { userId: wizard.id, postId: welcomePost.id },
      { userId: winamp.id, postId: welcomePost.id },
      
      { userId: bob.id, postId: win7Post.id },
      { userId: wizard.id, postId: win7Post.id },
      { userId: skater.id, postId: win7Post.id },
      
      { userId: skater.id, postId: mcPost.id },
      { userId: winamp.id, postId: mcPost.id },
    ],
  });

  await prisma.postBookmark.createMany({
    data: [
      { userId: skater.id, postId: welcomePost.id },
      { userId: winamp.id, postId: win7Post.id },
      { userId: skater.id, postId: mcPost.id },
    ],
  });

  console.log("Created likes and bookmarks.");

  // 7. Follows
  await prisma.follow.createMany({
    data: [
      { followerId: skater.id, followingId: bob.id },
      { followerId: wizard.id, followingId: bob.id },
      { followerId: winamp.id, followingId: wizard.id },
      { followerId: skater.id, followingId: wizard.id },
    ],
  });

  // 8. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: bob.id,
        senderId: skater.id,
        type: NotificationType.LIKE,
        entityId: welcomePost.id,
        content: "skater joined and liked your welcome thread!",
        isRead: false,
      },
      {
        userId: bob.id,
        senderId: skater.id,
        type: NotificationType.FOLLOW,
        content: "Sk8rBoi_92 is now following your dashboard updates.",
        isRead: true,
      },
      {
        userId: wizard.id,
        senderId: winamp.id,
        type: NotificationType.COMMENT,
        entityId: ie8Post.id,
        content: "WinampLover replied to your post about IE8 CSS hacks.",
        isRead: false,
      },
    ],
  });

  // 9. DMs (Private Messages)
  await prisma.privateMessage.createMany({
    data: [
      {
        senderId: skater.id,
        receiverId: bob.id,
        content: "Hey Bob! Quick question, is there any custom subforum layout option or is it standard for everyone? Thanks!",
        createdAt: new Date("2026-05-20T10:00:00Z"),
      },
      {
        senderId: bob.id,
        receiverId: skater.id,
        content: "Hi skater! Right now it is standard blue/gray for everyone. However, I might add custom MySpace-style layout sheets for profiles soon! Stay tuned.",
        isRead: true,
        createdAt: new Date("2026-05-20T10:30:00Z"),
      },
      {
        senderId: troll.id,
        receiverId: bob.id,
        content: "Ban me if you can, admin! Mwahaha.",
        isRead: false,
        createdAt: new Date("2026-05-28T23:59:00Z"),
      },
    ],
  });

  console.log("Database seeded successfully with nostalgic items! password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

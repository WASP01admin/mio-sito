#!/usr/bin/env node
const bcrypt = require("bcryptjs");

async function createTestBlogger() {
  const testPassword = "test1234";
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  const blogger = {
    name: "Test Blogger",
    email: "test-blogger@wasp.local",
    blog_url: "https://example.com/blog",
    bio: "Test blogger for WASP news system",
    password_hash: hashedPassword,
    status: "active",
  };

  console.log("Test Blogger Data:");
  console.log("================");
  console.log(`Email: ${blogger.email}`);
  console.log(`Password: ${testPassword}`);
  console.log(`Name: ${blogger.name}`);
  console.log("");
  console.log("SQL INSERT Command:");
  console.log("===================");
  console.log(`
INSERT INTO news_bloggers (name, email, blog_url, bio, password_hash, status)
VALUES (
  '${blogger.name}',
  '${blogger.email}',
  '${blogger.blog_url}',
  '${blogger.bio}',
  '${hashedPassword}',
  '${blogger.status}'
);
  `);

  console.log("Next Steps:");
  console.log("===========");
  console.log("1. Go to Supabase Dashboard");
  console.log("2. Open SQL Editor");
  console.log("3. Run the INSERT command above");
  console.log("4. Go to /blogger/login");
  console.log(`5. Login with: ${blogger.email} / ${testPassword}`);
}

createTestBlogger().catch(console.error);

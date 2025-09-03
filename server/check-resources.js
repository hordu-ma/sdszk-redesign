import Resource from "./models/Resource.js";
import mongoose from "mongoose";

(async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/sdszk");
    console.log("Connected to MongoDB");

    const resources = await Resource.find().limit(10);
    console.log("Resources found:", resources.length);

    // 统计URL类型
    let horsduRootCount = 0;
    let relativePathCount = 0;
    let otherCount = 0;

    resources.forEach((r) => {
      console.log(`\n--- Resource ${r._id} ---`);
      console.log(`Title: ${r.title}`);
      console.log(`Thumbnail: ${r.thumbnail || "NULL"}`);
      console.log(`FileUrl: ${r.fileUrl || "NULL"}`);
      console.log(`Category: ${r.category}`);
      console.log(`Created: ${r.createdAt}`);

      // 统计thumbnail URL类型
      if (r.thumbnail) {
        if (r.thumbnail.includes("horsduroot.com")) {
          horsduRootCount++;
        } else if (r.thumbnail.startsWith("/uploads/")) {
          relativePathCount++;
        } else {
          otherCount++;
        }
      }
    });

    console.log("\n=== URL类型统计 ===");
    console.log(`horsduroot.com域名: ${horsduRootCount}`);
    console.log(`相对路径: ${relativePathCount}`);
    console.log(`其他类型: ${otherCount}`);

    // 查找所有包含horsduroot.com的资源
    console.log("\n=== 查找horsduroot.com域名的资源 ===");
    const horsduResources = await Resource.find({
      $or: [{ thumbnail: /horsduroot\.com/ }, { fileUrl: /horsduroot\.com/ }],
    });
    console.log(`找到 ${horsduResources.length} 个包含horsduroot.com的资源`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();

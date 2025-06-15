import Resource from "./models/Resource.js";
import mongoose from "mongoose";

(async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/sdszk");
    console.log("Connected to MongoDB");

    const resources = await Resource.find().limit(5);
    console.log("Resources found:", resources.length);

    resources.forEach((r) => {
      console.log(`ID: ${r._id}, Title: ${r.title}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();

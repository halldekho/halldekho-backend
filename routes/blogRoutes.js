const express = require("express");
const multer = require("multer");
const { Octokit } = require("@octokit/rest");
const { body, validationResult } = require("express-validator");
const verifySuperAdmin = require("../middleware/verifySuperAdmin");
const Blog = require("../models/Blog");

const router = express.Router();

// ✅ Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ GitHub Configuration
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const GITHUB_OWNER = "halldekho";
const GITHUB_REPO = "carousel-images";
const GITHUB_BRANCH = "master";

// ✅ Function to upload files to GitHub
const uploadFilesToGitHub = async (files, folderName) => {
  const fileUrls = [];
  for (const file of files) {
    const timestamp = Date.now();
    const filePath = `${folderName}/${timestamp}-${file.originalname}`;
    const content = file.buffer.toString("base64");

    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        path: filePath,
        message: `Add ${folderName} file: ${file.originalname}`,
        content,
        branch: GITHUB_BRANCH,
      });

      const fileUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;
      fileUrls.push(fileUrl);
    } catch (error) {
      console.error(`${folderName} upload error:`, error.response?.data || error.message);
    }
  }
  return fileUrls;
};

// ✅ Create a new blog (Only Super Admin)
const mongoose = require("mongoose");

router.post(
  "/create-blog",
  verifySuperAdmin,
  upload.array("images"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("content").notEmpty().withMessage("Content is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { title, content } = req.body;

      if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: "User ID not found in token" });
      }

      const createdBy = new mongoose.Types.ObjectId(req.user.id); // ✅ FIXED

      const imageFiles = req.files || [];
      const imageUrls = await uploadFilesToGitHub(imageFiles, "blogs");

      if (imageUrls.length === 0) {
        return res.status(500).json({ msg: "Failed to upload images to GitHub" });
      }

      const blog = new Blog({ title, content, images: imageUrls, createdBy });
      await blog.save();

      res.status(201).json({ msg: "Blog created successfully", blog });
    } catch (err) {
      console.error("Server error:", err.message);
      res.status(500).json({ msg: "Internal server error", error: err.message });
    }
  }
);



// ✅ Get all blogs (Public Access)
router.get("/all-blogs", async (req, res) => {
  try {
    const blogs = await Blog.find().populate("createdBy", "name email");
    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching blogs" });
  }
});

// ✅ Get a single blog by ID (Public Access)
router.get("/all-blogs/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy", "name email");
    if (!blog) return res.status(404).json({ msg: "Blog not found" });

    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ msg: "Error fetching blog" });
  }
});

// ✅ Update a blog (Only Super Admin)
router.put(
  "/update-blog/:id",
  verifySuperAdmin,
  upload.array("images"),
  async (req, res) => {
    try {
      const { title, content } = req.body;
      const blog = await Blog.findById(req.params.id);

      if (!blog) return res.status(404).json({ msg: "Blog not found" });

      // ✅ Upload new images if provided
      const imageFiles = req.files || [];
      const imageUrls = imageFiles.length > 0 ? await uploadFilesToGitHub(imageFiles, "blogs") : blog.images;

      blog.title = title || blog.title;
      blog.content = content || blog.content;
      blog.images = imageUrls;

      await blog.save();
      res.status(200).json({ msg: "Blog updated successfully", blog });
    } catch (err) {
      res.status(500).json({ msg: "Error updating blog" });
    }
  }
);

// ✅ Delete a blog (Only Super Admin)
router.delete("/delete-blog/:id", verifySuperAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ msg: "Blog not found" });

    await blog.deleteOne();
    res.status(200).json({ msg: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error deleting blog" });
  }
});

module.exports = router;

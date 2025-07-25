import fs from 'fs'

import Blog from '../models/blog.js'
import Comment from '../models/comment.js'
import main from '../configs/gemini.js'
import axios from 'axios';
import imagekit from '../configs/imageKit.js';
import FormData from "form-data";

export const addBlog = async (req, res) => {
    try {
        const { title, keyword, description, isPublished } = JSON.parse(req.body.blog)
        const imageFile = req.file

        //check if all field present
        if (!title || !description || !imageFile) {

            return res.json({ success: false, message: "Missing required fields" })
        }

        const fileBuffer = fs.readFileSync(imageFile.path)

        //upload image to imagekit
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: "/blogs"
        })
        //optimization through imagekit url transformation 
        const optimizedImageUrl = imagekit.url({
            path: response.filePath,
            transformation: [
                { quality: 'auto' }, //auto compression
                { format: 'webp' }, //modern format
                { width: '1280' } //width resizing
            ]
        });

        const image = optimizedImageUrl;


        await Blog.create({ title, keyword, description, image, isPublished })


        res.json({
            success: true,
            message: "blog added successfully"
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ isPublished: true })
        res.json({ success: true, blogs })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getBlogById = async (req, res) => {
    try {
        const { blogId } = req.params;
        const blog = await Blog.findById(blogId)
        if (!blog) {
            return res.json({ success: false, message: "Blog not found" })
        }
        res.json({ success: true, blog })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const deleteBlogById = async (req, res) => {
    try {
        const { id } = req.body;
        const blog = await Blog.findById(id);

        if (!blog) {
            return res.json({ success: false, message: "Blog not found" });
        }

        await Blog.findByIdAndDelete(id);
        await Comment.deleteMany({ blog: id });

        res.json({ success: true, message: "blog deleted successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const togglePublish = async (req, res) => {
    try {
        const { id } = req.body;
        const blog = await Blog.findById(id);
        blog.isPublished = !blog.isPublished;
        await blog.save();
        res.json({ success: true, message: "blog status updated" })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const addComment = async (req, res) => {
    try {
        const { blog, name, content } = req.body;
        await Comment.create({ blog, name, content });
        res.json({ success: true, message: 'comment add for review' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getBlogComments = async (req, res) => {
    try {
        const { blogId } = req.body;
        const comments = await Comment.find({ blog: blogId, isApproved: true }).sort({ createdAt: -1 })
        res.json({ success: true, comments })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const generateContent = async (req, res) => {
    try {
        const { prompt } = req.body;


        const content = await main(`${prompt}. Generate a blog content for this topic in simple text format.`);

        res.json({ success: true, content });
    } catch (error) {
        console.error("Error generating blog content:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateSeo = async (req, res) => {
    try {
        const { prompt } = req.body;

        //prompt
        const seoPrompt = `
            Generate SEO metadata for the following blog title.
            Blog title: "${prompt}"

            Please respond strictly in the following format:
            Title: <catchy SEO title which should be seo friendly 60 character max>
            Description: <write in rich text format with headings like h1, h2 , h3 and paragraphs, bold, italic and bullets, underlined etc all things can be done etc of engaging blog description seo friendly min 7 paragraph max 10>
            Keywords: <5 comma-separated SEO keyword list>
        `;

        const rawResponse = await main(seoPrompt);

        // Response parsing logic
        const lines = rawResponse.split('\n').filter(Boolean);
        const titleLine = lines.find(line => line.toLowerCase().startsWith('title:'));
        const keywordsLine = lines.find(line => line.toLowerCase().startsWith('keywords:'));

        const descriptionStartIndex = lines.findIndex(line => line.toLowerCase().startsWith('description:'));
        const keywordsIndex = lines.findIndex(line => line.toLowerCase().startsWith('keywords:'));
        const descriptionLines = lines.slice(descriptionStartIndex, keywordsIndex !== -1 ? keywordsIndex : undefined);
        const descriptionText = descriptionLines
            .join('\n')                      // keep line breaks
            .replace(/^description:\s*/i, '') // remove Description label
            .trim();

        const seoData = {
            seoTitle: titleLine?.split(':')[1]?.trim() || '',
            metaDescription: descriptionText || '',
            tags: keywordsLine?.split(':')[1]?.split(',').map(k => k.trim()) || [],
        };

        res.json({ success: true, seo: seoData });
    } catch (error) {
        console.error("Error generating SEO metadata:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const editBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const blogData = JSON.parse(req.body.blog);
        const { title, keyword, description, isPublished } = blogData;
        const imageFile = req.file;

        // Check if blog exists
        const existingBlog = await Blog.findById(id);
        if (!existingBlog) {
            return res.status(404).json({ success: false, message: "Blog not found." });
        }

        const updateData = {
            title,
            keyword,
            description,
            isPublished,
        };

        if (imageFile) {
            // Upload new image
            const fileBuffer = fs.readFileSync(imageFile.path);
            const uploadedImage = await imagekit.upload({
                file: fileBuffer,
                fileName: imageFile.originalname,
                folder: "/blogs"
            });

            // Update with new image URL and ID
            updateData.image = imagekit.url({
                path: uploadedImage.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' }
                ]
            });
            updateData.imageId = uploadedImage.fileId;

            // Delete old image if it exists
            if (existingBlog.imageId) {
                await imagekit.deleteFile(existingBlog.imageId);
            }
        }

        // Update the blog in DB
        const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({
            success: true,
            message: "Blog updated successfully!",
            blog: updatedBlog,
        });

    } catch (error) {
        console.error("Edit Blog Error:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

export const generateImage = async (req, res) => {
  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

  if (!STABILITY_API_KEY) {
    return res.status(500).json({ success: false, message: "API key missing in .env" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ success: false, message: "Prompt is required." });
  }

  try {
    const payload = {
      prompt: `Professional blog thumbnail, cinematic style, for: "${prompt}"`,
      output_format: "jpeg",
    };

    const response = await axios.postForm(
      "https://api.stability.ai/v2beta/stable-image/generate/sd3",
      axios.toFormData(payload, new FormData()),
      {
        validateStatus: undefined,
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: "image/*",
        },
      }
    );

    if (response.status === 200) {
      // Convert image buffer to base64 to send back to frontend
      const base64Image = Buffer.from(response.data).toString("base64");
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;
      res.json({ success: true, imageUrl });
    } else {
      throw new Error(`${response.status}: ${response.data.toString()}`);
    }

  } catch (err) {
    console.error("STABILITY AI ERROR:", err.message);
    res.status(500).json({ success: false, message: "Image generation failed." });
  }
};
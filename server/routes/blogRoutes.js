import express from 'express'

import { addBlog, addComment, deleteBlogById, generateContent, getAllBlogs, getBlogById, getBlogComments, togglePublish, generateSeo, editBlog, generateImage } from '../controllers/blogController.js'

import upload from '../middleware/multer.js'
import auth from '../middleware/auth.js'

const blogRouter = express.Router()

blogRouter.post("/add", upload.single('image'), auth, addBlog)

blogRouter.get('/all', getAllBlogs)
blogRouter.get('/:blogId', getBlogById)
blogRouter.post('/delete', auth, deleteBlogById)

blogRouter.post('/toggle-publish', auth, togglePublish)

blogRouter.post('/add-comment', addComment);
blogRouter.post('/comments', getBlogComments);

blogRouter.post('/generate', auth, generateContent)

blogRouter.post('/generate-seo', auth, generateSeo)
blogRouter.put('/edit/:id', upload.single('image'), auth, editBlog);
// blogRouter.post('/editblog/:id',updateBlog)
blogRouter.post('/generate-image', auth, generateImage);



export default blogRouter
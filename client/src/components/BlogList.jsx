
import React from 'react'
import { useAppContext } from '../context/AppContext'
import BlogCard from './BlogCard'

const BlogList = () => {
  const { blogs, input } = useAppContext()

  const filteredBlogs = () => {
    if (input === '') {
      return blogs
    }
    return blogs.filter((blog) =>
      blog?.title?.toLowerCase().includes(input.toLowerCase()) ||
      blog?.category?.toLowerCase().includes(input.toLowerCase())
    )
  }

  return (
    <div>
      <h2 className='text-2xl font-bold text-center my-10'>All Blogs</h2>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 mb-24 mx-8 sm:mx-16 xl:mx-40'>
        {filteredBlogs().map((blog) => (
          <BlogCard key={blog._id} blog={blog} />
        ))}
      </div>
    </div>
  )

}

export default BlogList

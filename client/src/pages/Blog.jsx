import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { assets, blog_data, comments_data } from '../assets/assets'
import Navbar from '../components/Navbar'
import Moment from 'moment'
import Footer from '../components/Footer'
import Loader from '../components/Loader'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { ClipboardCopy, FileText, FileDown } from 'lucide-react' 


const Blog = () => {
  const { id } = useParams()

  const { axios } = useAppContext()

  const [data, setData] = useState(null)
  const [comments, setComments] = useState([]);

  const [name, setName] = useState('')
  const [content, setContent] = useState('')

  const fetchBlogData = async () => {
    try {
      const { data } = await axios.get(`/api/blog/${id}`)
      data.success ? setData(data.blog) : toast.error(data.message)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const fetchComments = async () => {
    try {
      const { data } = await axios.post('/api/blog/comments', { blogId: id })
      if (data.success) {
        setComments(data.comments)
      }
      else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const addComment = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/blog/add-comment', { blog: id, name, content })
      if (data.success) {
        toast.success(data.message)
        setName('')
        setContent('')
      }
      else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchBlogData()
    fetchComments()
  }, [])

  return data ? (
    <div className='relative'>
      <img src={assets.gradientBackground} alt="" className='absolute -top-20 z-[-1] opacity-50' />
      <Navbar />

      <div className='text-center mt-20 text-gray-600'>
        <p className='text-primary py-4 font-medium'>Published on {Moment(data.createdAt).format('MMMM Do YYYY')}</p>
        <h1 className='text-2xl sm:text-5xl font-semibold max-w-2xl mx-auto text-gray-800'>{data.title}</h1>
        <p className='my-5 inline-block py-1 px-4 rounded-full mb-6 border text-sm border-primary/35 bg-primary/5 font-medium text-primary'>Anuj Mishra</p>
      </div>

      <div className='mx-5 max-w-5xl md:mx-auto my-10 mt-6'>
        <img src={data.image} alt="" className='rounded-3xl mb-5' />

        <div className='rich-text max-w-3xl mx-auto' dangerouslySetInnerHTML={{ __html: data.description }}></div>
        {Array.isArray(data.keyword) && data.keyword.length > 0 && (
          <div className='mt-6 max-w-3xl mx-auto text-gray-500'>
            <p className='font-semibold mb-2'>Tags:</p>
            <div className='flex flex-wrap gap-2'>
              {data.keyword.map((item, index) => (
                <span key={index} className='px-3 py-1 bg-primary/10 text-primary text-sm rounded-full'>
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* comments section */}
        <div className='mt-14 mb-10 max-w-3xl mx-auto'>
          <p className='font-semibold mb-4'>Comments ({Array.isArray(comments) ? comments.length : 0})</p>
          <div className='flex flex-col gap-4'>
            {Array.isArray(comments) && comments.map((item, index) => (
              <div key={index} className='relative bg-primary/2 border border-primary/5 max-w-xl p-4 rounded text-gray-600'>
                <div className='flex items-center gap-2 mb-2'>
                  <img src={assets.user_icon} alt="" className='w-6' />
                  <p className='font-medium'>{item.name}</p>
                </div>
                <p className='text-sm max-w-md ml-8'>{item.content}</p>
                <div className='absolute right-4 bottom-3 flex items-center gap-2 text-xs'>{Moment(item.createdAt).fromNow()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Add comment section */}
        <div className='max-w-3xl mx-auto'>
          <p className='font-semibold mb-4'>Add your comment</p>
          <form onSubmit={addComment} className='flex flex-col items-start gap-4 max-w-lg'>
            <input onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder='Name' required className='w-full p-2 border border-gray-300 rounded outline-none' />
            <textarea onChange={(e) => setContent(e.target.value)} value={content} placeholder='Comment' className='w-full p-2 border border-gray-300 rounded outline-none h-48' required></textarea>

            <button type='submit' className='bg-primary text-white rounded p-2 px-8 hover:scale-102 transition-all cursor-pointer'>Submit</button>
          </form>
        </div>

        {/* Share buttons */}
        <div className='my-20 max-w-3xl mx-auto'>
          <p className='font-semibold my-4'>Share this article on social media</p>
          <div className='flex cursor-pointer'>
            <img src={assets.facebook_icon} width={50} alt="" />
            <img src={assets.twitter_icon} width={50} alt="" />
            <img src={assets.googleplus_icon} width={50} alt="" />
          </div>
        </div>

        <div className='my-20 max-w-3xl mx-auto'>
          <p className='font-semibold mb-4 text-lg text-gray-800'>Export Options</p>
          <div className='flex flex-wrap gap-4'>

            {/* Copy to Clipboard */}
            <button
              onClick={() => {
                const text = `# ${data.title}\n\n${data.description.replace(/<[^>]*>/g, '')}`;
                navigator.clipboard.writeText(text);
                toast.success("Copied to clipboard!");
              }}
              className='flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl hover:scale-105 transition-all shadow-sm border border-primary/20 cursor-pointer'
            >
              <ClipboardCopy size={18} />
              Copy to Clipboard
            </button>

            {/* Download as .md */}
            <button
              onClick={() => {
                const blob = new Blob([`# ${data.title}\n\n${data.description.replace(/<[^>]*>/g, '')}`], { type: "text/markdown" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${data.title.replace(/\s+/g, "_")}.md`;
                link.click();
              }}
              className='flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl hover:scale-105 transition-all shadow-sm border border-primary/20 cursor-pointer'
            >
              <FileDown size={18} />
              Download as .md
            </button>

            {/* Download as .txt */}
            <button
              onClick={() => {
                const blob = new Blob([`${data.title}\n\n${data.description.replace(/<[^>]*>/g, '')}`], { type: "text/plain" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${data.title.replace(/\s+/g, "_")}.txt`;
                link.click();
              }}
              className='flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl hover:scale-105 transition-all shadow-sm border border-primary/20 cursor-pointer'
            >
              <FileText size={18} />
              Download as .txt
            </button>

          </div>
        </div>

      </div>
      <Footer />
    </div>
  ) : <Loader />
}

export default Blog

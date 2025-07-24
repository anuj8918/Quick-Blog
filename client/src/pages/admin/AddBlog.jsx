import React, { useEffect, useRef, useState } from 'react';
import { assets } from '../../assets/assets';
import Quill from 'quill';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { parse } from 'marked';

const AddBlog = () => {
    const { axios } = useAppContext();
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const fileInputRef = useRef(null);

    const [image, setImage] = useState(false);
    const [title, setTitle] = useState('');
    const [keyword, setKeyword] = useState([]);
    const [isPublished, setIsPublished] = useState(false);

    const dataURLtoFile = (dataurl, filename) => {
        let arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const generateImageHandler = async () => {
        if (!title) return toast.error('Please enter a title first');
        setIsGeneratingImage(true);
        try {
            const { data } = await axios.post('/api/blog/generate-image', { prompt: title });
            if (data.success) {
                const imageFile = dataURLtoFile(data.imageUrl, 'ai-thumbnail.png');
                setImage(imageFile);
                toast.success('AI Thumbnail Generated!');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Image generation failed");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const generateSeoData = async () => {
        if (!title) return toast.error("Please enter blog title");
        setLoading(true);
        try {
            const { data } = await axios.post('/api/blog/generate-seo', { prompt: title });
            if (data.success) {
                setTitle(data.seo.seoTitle);
                quillRef.current.root.innerHTML = parse(data.seo.metaDescription);
                setKeyword(data.seo.tags);
                toast.success('SEO metadata generated!');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("SEO generation failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (!image) {
            toast.error("Please upload a thumbnail image.");
            return;
        }
        setIsAdding(true);
        try {
            const blog = {
                title,
                description: quillRef.current.root.innerHTML,
                isPublished,
                keyword,
            };
            const formData = new FormData();
            formData.append('blog', JSON.stringify(blog));
            formData.append('image', image);
            const { data } = await axios.post(`/api/blog/add`, formData);
            if (data.success) {
                toast.success(data.message);
                setImage(false);
                setTitle('');
                quillRef.current.root.innerHTML = '';
                setKeyword([]);
                setIsPublished(false);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsAdding(false);
        }
    };

    useEffect(() => {
        if (!quillRef.current && editorRef.current) {
            quillRef.current = new Quill(editorRef.current, { theme: 'snow' });
        }
    }, []);

    return (
        <form onSubmit={onSubmitHandler} className='flex-1 bg-blue-50/50 text-gray-600 h-full overflow-y-auto'>
            <div className='bg-white w-full max-w-3xl p-4 md:p-10 sm:m-10 shadow rounded'>
                <p>Upload thumbnail</p>

                <div className='mt-2'>
                    <input
                        type="file"
                        id='image'
                        ref={fileInputRef}
                        onChange={(e) => setImage(e.target.files[0])}
                        hidden
                    />
                    <div className='flex items-center gap-2 max-w-lg'>
                        <div className='flex-1 px-3 py-2 border rounded-l-md bg-gray-50 text-sm truncate'>
                            {image ? image.name : "No file selected"}
                        </div>
                        <button
                            type='button'
                            onClick={() => fileInputRef.current.click()}
                            className='px-4 py-2 bg-gray-200 border border-gray-300 rounded-r-md text-sm font-medium hover:bg-gray-300 cursor-pointer'
                        >
                            Browse...
                        </button>
                    </div>
                </div>

                {image && (
                    <div className='mt-4'>
                        <p className='text-sm mb-1'>Image Preview:</p>
                        <img src={URL.createObjectURL(image)} alt="Preview" className='h-28 rounded object-cover border' />
                    </div>
                )}

                <p className='mt-4'>Blog title</p>
                <input
                    type="text"
                    placeholder='Type here'
                    required
                    className='w-full max-w-lg mt-2 p-2 border border-gray-300 outline-none rounded'
                    onChange={e => setTitle(e.target.value)}
                    value={title}
                />

                <div className='flex flex-wrap gap-2 items-center mt-5'>
                    <button disabled={loading || isGeneratingImage} className='text-xs text-white bg-black/70 px-4 py-1.5 rounded hover:underline cursor-pointer' type='button' onClick={generateSeoData}>
                        {loading ? 'Generating...' : 'Autogenerate SEO'}
                    </button>
                    <button disabled={isGeneratingImage || loading} className='text-xs text-white bg-blue-600 px-4 py-1.5 rounded hover:underline cursor-pointer' type='button' onClick={generateImageHandler}>
                        {isGeneratingImage ? 'Generating Image...' : 'Generate Thumbnail with AI'}
                    </button>
                </div>

                <p className='mt-4'>Blog description</p>
                <div className='max-w-lg h-72 pb-16 sm:pb-10 pt-2 relative'>
                    <div ref={editorRef}></div>
                    {loading && (
                        <div className='absolute inset-0 flex items-center justify-center bg-black/10 mt-2'>
                            <div className='w-8 h-8 rounded-full border-2 border-t-white animate-spin'></div>
                        </div>
                    )}
                </div>

                <p className='mt-4'>Tags</p>
                <input
                    type="text"
                    placeholder='Type comma separated tags'
                    required
                    className='w-full max-w-lg mt-2 p-2 border border-gray-300 outline-none rounded'
                    onChange={e => setKeyword(e.target.value.split(','))}
                    value={keyword.join(',')}
                />

                <div className='flex gap-2 mt-4'>
                    <p>Publish Now</p>
                    <input
                        type="checkbox"
                        checked={isPublished}
                        className='scale-125 cursor-pointer'
                        onChange={e => setIsPublished(e.target.checked)}
                    />
                </div>

                <button
                    disabled={isAdding || isGeneratingImage}
                    type='submit'
                    className='mt-8 w-40 h-10 bg-primary text-white rounded cursor-pointer text-sm'
                >
                    {isAdding ? 'Adding...' : 'Add Blog'}
                </button>
            </div>
        </form>
    );
};

export default AddBlog;

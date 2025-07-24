import React from 'react'
import { useNavigate } from 'react-router-dom';

const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};

const BlogCard = ({ blog }) => {

    const { title, description, image, _id } = blog;

    const navigate = useNavigate()
    return (
        <div onClick={() => navigate(`/blog/${_id}`)} className='w-full rounded-lg overflow-hidden shadow hover:scale-105 hover:shadow-primary/25 duration-300 cursor-pointer'>
            <img src={image} alt="" className='aspect-video' />
            <div className='p-5'>
                <h5 className='mb-2 font-medium text-gray-900'>{title}</h5>
                <p className='mb-3 text-xs text-gray-600'>
                    {stripHtml(description).split(" ").slice(0, 15).join(" ") + '...'}
                </p>
            </div>
        </div>
    )
}

export default BlogCard

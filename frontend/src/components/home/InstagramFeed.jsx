import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';
import axios from 'axios';
import config from '../../config';

const InstagramFeed = () => {
  const [posts, setPosts] = useState([]);
  const instagramUrl = "https://www.instagram.com/hoteltenontenstays/";

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${config.API_URL}/api/posts`);
        setPosts(res.data);
      } catch (err) {
        console.error('Error fetching journey posts:', err);
      }
    };
    fetchPosts();
  }, []);

  // Use dummy photos if no posts are uploaded yet
  const displayPosts = posts.length > 0 ? posts : [
    { image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1970&auto=format&fit=crop' },
    { image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1970&auto=format&fit=crop' },
    { image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1970&auto=format&fit=crop' },
    { image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1970&auto=format&fit=crop' },
    { image: 'https://images.unsplash.com/photo-1590490359683-658d3d23f972?q=80&w=1970&auto=format&fit=crop' },
    { image: 'https://images.unsplash.com/photo-1551882547-ff40c66fe561?q=80&w=1970&auto=format&fit=crop' }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-[#BFA37E] text-xs font-bold tracking-[0.4em] uppercase mb-4 block">Social Media</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#0A192F] mb-4">Follow Our Journey</h2>
          <p className="text-sm font-bold tracking-widest text-[#BFA37E]">@hoteltenontenstays</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayPosts.slice(0, 6).map((post, index) => (
            <motion.a
              key={index}
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative aspect-square overflow-hidden group shadow-md"
            >
              <img 
                src={post._id ? `${config.API_URL}${post.image}` : post.image} 
                alt="Instagram post" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-[#0A192F]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.a>
          ))}
        </div>

        <div className="mt-16">
          <a 
            href={instagramUrl} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-3 bg-[#0A192F] text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-[#BFA37E] transition-all shadow-xl"
          >
            <Instagram size={16} />
            Follow on Instagram
          </a>
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;

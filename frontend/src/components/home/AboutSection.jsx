import React from 'react';
import { motion } from 'framer-motion';

const AboutSection = () => {
  return (
    <section className="py-24 bg-[#FDFBF7]">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="section-title">ABOUT HOTEL BHOPAL INN</h2>
          <div className="gold-line" />
          
          <p className="text-sm md:text-base leading-loose text-[#2D241E] font-light text-center px-4">
            Welcome to Hotel Bhopal Inn, a charming boutique retreat where elegance meets comfort. Nestled in a serene location, we offer a personalized stay experience with thoughtfully designed rooms and warm hospitality. Our "Hassle-Free In-Out" policy ensures smooth check-ins and check-outs, making your stay seamless and stress-free. Whether you're traveling for business or leisure, our curated amenities and cozy ambiance cater to all your needs. Discover a blissful escape in the heart of the city—your perfect getaway begins at Hotel Bhopal Inn.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;

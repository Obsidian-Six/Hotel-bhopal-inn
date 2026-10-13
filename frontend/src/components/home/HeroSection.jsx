// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import axios from 'axios';
// import config from '../../config';
// import { Star, DoorOpen, MapPin, Trophy } from 'lucide-react';
// import { Link } from 'react-router-dom';

// const HeroSection = () => {
//   const [images, setImages] = useState([]);
//   const [current, setCurrent] = useState(0);
//   const [loading, setLoading] = useState(true);

//   const defaultImages = [
//     "/banquet_main.jpg",
//     "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop",
//     "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
//     "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop"
//   ];

//   useEffect(() => {
//     const fetchContent = async () => {
//       try {
//         const res = await axios.get(`${config.API_URL}/api/hero-images`);
//         if (res.data && res.data.length > 0) {
//           setImages(res.data); // Now contains objects with url and type
//         } else {
//           setImages(defaultImages.map(url => ({ url, type: 'image' })));
//         }
//       } catch (err) {
//         setImages(defaultImages.map(url => ({ url, type: 'image' })));
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchContent();
//   }, []);

//   const handleNext = () => {
//     if (images.length > 0) {
//       setCurrent((prev) => (prev + 1) % images.length);
//     }
//   };

//   useEffect(() => {
//     if (images.length === 0) return;
    
//     // Only set a timer if the current item is an image
//     // If it's a video, we rely on the onEnded event
//     if (images[current]?.type !== 'video') {
//       const timer = setInterval(handleNext, 6000);
//       return () => clearInterval(timer);
//     }
//   }, [images.length, current]);

//   return (
//     <div className="relative min-h-screen lg:min-h-[125vh] w-full overflow-hidden flex items-center justify-center bg-[#000000]">
//       {/* Background Slider */}
//       <div className="absolute inset-0 z-0">
//         <AnimatePresence mode="wait">
//           {!loading && images.length > 0 && (
//             <motion.div
//               key={current}
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               transition={{ duration: 1.5 }}
//               className="w-full h-full"
//             >
//               {images[current].type === 'video' ? (
//                 <video
//                   src={images[current].url.startsWith('http') ? images[current].url : `${config.API_URL}${images[current].url}`}
//                   autoPlay
//                   muted
//                   playsInline
//                   loop={images.length === 1}
//                   onEnded={handleNext}
//                   preload="metadata"
//                   className="w-full h-full object-cover"
//                 />

//               ) : (
//                 <img
//                   src={images[current].url.startsWith('http') ? images[current].url : `${config.API_URL}${images[current].url}`}
//                   loading="eager"
//                   fetchPriority="high"
//                   decoding="async"
//                   className="w-full h-full object-cover"
//                   alt={`Hero ${current + 1}`}
//                 />
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//         <div className="absolute inset-0 bg-[#000000]/40" />
//       </div>



//       {/* Content */}
//       <div className="relative z-10 container mx-auto px-4 text-center mt-20">
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 1, ease: "easeOut" }}
//           className="flex flex-col items-center"
//         >
//           <motion.p 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-[#BFA37E] text-xs lg:text-xl font-light capitalize tracking-[0.05em] mb-4"
//           >
//             Welcome to Bhopal Inn
//           </motion.p>
          
//           <h1 className="text-4xl md:text-7xl lg:text-8xl font-saoltext text-white mb-8 capitalize leading-[1.1] tracking-[0]">
//             Experience Luxury <br className="hidden md:block"/> At Every Turn
//           </h1>
          
//           <p className="text-white/90 text-sm md:text-lg capitalize tracking-[0.04em] font-bold mb-12 max-w-2xl mx-auto border-l-2 border-[#BFA37E] pl-6 py-2">
//             Premium Boutique Hotel | City Centre | 10 Min from Station
//           </p>

//           <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
//             <Link 
//               to="/booking" 
//               className="bg-[#BFA37E] text-white px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-sm hover:bg-[#a68d6d] transition-all shadow-2xl min-w-[200px]"
//             >
//               Book Now
//             </Link>
//             <Link 
//               to="/rooms" 
//               className="border border-white text-white px-10 py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-sm hover:bg-white hover:text-[#000000] transition-all min-w-[200px]"
//             >
//               Explore Rooms
//             </Link>
//           </div>

//           {/* Trust Strip */}
//           <motion.div 
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 1, duration: 0.8 }}
//             className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-5 border-t border-white/20"
//           >
//             <div className="flex items-center gap-2 text-white/80">
//               <Star size={16} className="text-[#BFA37E]" fill="#BFA37E" />
//               <span className="text-[10px] font-bold tracking-widest uppercase">Google Rating</span>
//             </div>
//             <div className="w-[1px] h-4 bg-white/20 hidden md:block" />
//             <div className="flex items-center gap-2 text-white/80">
//               <DoorOpen size={16} className="text-[#BFA37E]" />
//               <span className="text-[10px] font-bold tracking-widest uppercase">16 Premium Rooms</span>
//             </div>
//             <div className="w-[1px] h-4 bg-white/20 hidden md:block" />
//             <div className="flex items-center gap-2 text-white/80">
//               <MapPin size={16} className="text-[#BFA37E]" />
//               <span className="text-[10px] font-bold tracking-widest uppercase">City Centre Location</span>
//             </div>
//             <div className="w-[1px] h-4 bg-white/20 hidden md:block" />
//             <div className="flex items-center gap-2 text-white/80">
//               <Trophy size={16} className="text-[#BFA37E]" />
//               <span className="text-[10px] font-bold tracking-widest uppercase">Best Budget Hotel Bhopal</span>
//             </div>
//           </motion.div>
//         </motion.div>
//       </div>

//       {/* Slider Indicators */}
//       <div className="absolute bottom-10 left-10 z-20 flex flex-col gap-3">
//         {images.map((_, idx) => (
//           <button
//             key={idx}
//             onClick={() => setCurrent(idx)}
//             className={`h-8 w-[2px] transition-all duration-500 ${current === idx ? 'bg-[#BFA37E] h-12' : 'bg-white/20'}`}
//           />
//         ))}
//       </div>

//       {/* Scroll Down */}
//       <div className="absolute bottom-10 right-10 z-20 hidden md:flex items-center gap-4 rotate-90 origin-right">
//         <span className="text-white/40 text-[10px] font-bold tracking-[0.5em] uppercase whitespace-nowrap">Scroll Down</span>
//         <div className="w-12 h-[1px] bg-[#BFA37E]" />
//       </div>
//     </div>
//   );
// };

// export default HeroSection;



// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
// } from "react";
// import { gsap } from "gsap";
// import axios from "axios";
// import config from "../../config";
// import { Star, DoorOpen, MapPin, Trophy } from "lucide-react";
// import { Link } from "react-router-dom";

// const defaultImages = [
//   "/banquet_main.jpg",
//   "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop",
//   "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
//   "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop",
// ];

// const IMAGE_DURATION = 6000;
// const VIDEO_MIN_DURATION = 8000;

// const normalizeSlide = (item) => ({
//   ...item,
//   type:
//     String(item.type || "image").toLowerCase().includes("video")
//       ? "video"
//       : "image",
// });

// const HeroSection = () => {
//   const [images, setImages] = useState(() =>
//     defaultImages.map((url) => ({ url, type: "image" }))
//   );

//   const [current, setCurrent] = useState(0);
//   const [incomingIndex, setIncomingIndex] = useState(null);
//   const [isPaused, setIsPaused] = useState(false);

//   const heroRef = useRef(null);
//   const incomingRef = useRef(null);
//   const timelineRef = useRef(null);
//   const currentRef = useRef(0);
//   const incomingIndexRef = useRef(null);
//   const animatingRef = useRef(false);
//   const imagesRef = useRef(images);
//   const pausedRef = useRef(false);
//   const videoRef = useRef(null);
//   const videoStartedAtRef = useRef(0);
//   const videoEndedRef = useRef(false);
//   const minimumVideoTimerRef = useRef(null);
//   const imageTimerRef = useRef(null);
//   const failedVideoRef = useRef(false);

//   useEffect(() => {
//     imagesRef.current = images;
//   }, [images]);

//   useEffect(() => {
//     pausedRef.current = isPaused;
//   }, [isPaused]);

//   const getMediaUrl = useCallback((url) => {
//     if (!url) return "";
//     if (/^https?:\/\//i.test(url)) return url;

//     if (url.startsWith("/") && !url.startsWith("/uploads/")) {
//       return url;
//     }

//     const base = String(config.API_URL || "").replace(/\/+$/, "");
//     return `${base}/${url.replace(/^\/+/, "")}`;
//   }, []);

//   // Load API slides without delaying the initial hero.
//   useEffect(() => {
//     let mounted = true;

//     axios
//       .get(`${config.API_URL}/api/hero-images`, { timeout: 12000 })
//       .then((response) => {
//         if (!mounted) return;

//         const data = Array.isArray(response.data)
//           ? response.data.filter((item) => item?.url)
//           : [];
//         console.log("Hero API response:", data);
//         if (data.length) {
//           const slides = data.map(normalizeSlide);
//           imagesRef.current = slides;
//           currentRef.current = 0;
//           setImages(slides);
//           setCurrent(0);
//         }
//       })
//       .catch((error) => {
//         console.error("Hero media API error:", error);
//       });

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   // Animate hero text once. Text is never initially hidden.
//   useEffect(() => {
//     if (!heroRef.current) return;

//     const ctx = gsap.context(() => {
//       gsap.fromTo(
//         ".hero-intro",
//         { y: 14 },
//         {
//           y: 0,
//           duration: 0.65,
//           stagger: 0.08,
//           ease: "power2.out",
//           clearProps: "transform",
//         }
//       );

//       gsap.fromTo(
//         ".hero-trust",
//         { y: 8 },
//         {
//           y: 0,
//           duration: 0.55,
//           stagger: 0.07,
//           delay: 0.25,
//           ease: "power2.out",
//           clearProps: "transform",
//         }
//       );
//     }, heroRef);

//     return () => ctx.revert();
//   }, []);

//   // Right-to-left expanding slide transition.
//   useEffect(() => {
//     if (incomingIndex === null || !incomingRef.current) return;

//     const element = incomingRef.current;

//     const timeline = gsap.timeline({
//       onComplete: () => {
//         currentRef.current = incomingIndex;
//         incomingIndexRef.current = null;
//         animatingRef.current = false;

//         setCurrent(incomingIndex);
//         setIncomingIndex(null);
//       },
//     });

//     timelineRef.current = timeline;

//     gsap.set(element, {
//       clipPath: "inset(0 0 0 100%)",
//       scale: 1.5,
//     });

//     timeline.to(element, {
//       clipPath: "inset(0 0 0 0%)",
//       scale: 1,
//       duration: 1.5,
//       ease: "power3.inOut",
//     });

//     return () => timeline.kill();
//   }, [incomingIndex]);

//   const goToSlide = useCallback((target) => {
//     const slides = imagesRef.current;

//     if (
//       slides.length < 2 ||
//       target < 0 ||
//       target >= slides.length ||
//       target === currentRef.current ||
//       animatingRef.current
//     ) {
//       return;
//     }

//     clearTimeout(imageTimerRef.current);
//     clearTimeout(minimumVideoTimerRef.current);

//     animatingRef.current = true;
//     incomingIndexRef.current = target;
//     setIncomingIndex(target);
//   }, []);

//   const handleNext = useCallback(() => {
//     const slides = imagesRef.current;

//     if (slides.length > 1) {
//       goToSlide((currentRef.current + 1) % slides.length);
//     }
//   }, [goToSlide]);

//   // Reset timers and start each slide according to its media type.
//   useEffect(() => {
//     clearTimeout(imageTimerRef.current);
//     clearTimeout(minimumVideoTimerRef.current);

//     videoEndedRef.current = false;
//     failedVideoRef.current = false;
//     videoStartedAtRef.current = 0;

//     const slide = images[current];

//     if (!slide || isPaused || incomingIndex !== null) return;

//     if (slide.type === "image") {
//       imageTimerRef.current = window.setTimeout(() => {
//         handleNext();
//       }, IMAGE_DURATION);
//     } else {
//       // Allow the video to play for at least 8 seconds.
//       minimumVideoTimerRef.current = window.setTimeout(() => {
//         if (videoEndedRef.current || failedVideoRef.current) {
//           handleNext();
//         }
//       }, VIDEO_MIN_DURATION);
//     }

//     return () => {
//       clearTimeout(imageTimerRef.current);
//       clearTimeout(minimumVideoTimerRef.current);
//     };
//   }, [current, images, isPaused, incomingIndex, handleNext]);

//   // Explicitly request video playback after the element mounts.
//   useEffect(() => {
//     if (
//       incomingIndex !== null ||
//       images[current]?.type !== "video"
//     ) {
//       return;
//     }

//     const video = videoRef.current;
//     if (!video) return;

//     video.muted = true;
//     video.defaultMuted = true;
//     video.playsInline = true;
//     video.setAttribute("playsinline", "");
//     video.setAttribute("webkit-playsinline", "");

//     videoStartedAtRef.current = Date.now();

//     const playPromise = video.play();

//     if (playPromise?.catch) {
//       playPromise.catch((error) => {
//         console.warn("Hero video autoplay failed:", error);
//       });
//     }
//   }, [current, images, incomingIndex]);

//   const handleVideoEnded = () => {
//     videoEndedRef.current = true;

//     const elapsed = Date.now() - videoStartedAtRef.current;
//     const remaining = Math.max(0, VIDEO_MIN_DURATION - elapsed);

//     clearTimeout(minimumVideoTimerRef.current);

//     minimumVideoTimerRef.current = window.setTimeout(() => {
//       if (!pausedRef.current) {
//         handleNext();
//       }
//     }, remaining);
//   };

//   const handleVideoError = () => {
//     failedVideoRef.current = true;

//     // Do not get stuck on a video that cannot be loaded.
//     const elapsed = Date.now() - videoStartedAtRef.current;
//     const remaining = Math.max(0, VIDEO_MIN_DURATION - elapsed);

//     clearTimeout(minimumVideoTimerRef.current);

//     minimumVideoTimerRef.current = window.setTimeout(() => {
//       if (!pausedRef.current) {
//         handleNext();
//       }
//     }, remaining);
//   };

//   const activeSlide = images[current];
//   const incomingSlide =
//     incomingIndex !== null ? images[incomingIndex] : null;

//   const renderMedia = (slide, index, incoming = false) => {
//     if (!slide) return null;

//     const src = getMediaUrl(slide.url);

//     if (slide.type === "video") {
//       return (
//         <video
//           key={`${index}-${slide.url}`}
//           ref={!incoming ? videoRef : undefined}
//           src={src}
//           autoPlay
//           muted
//           playsInline
//           loop={images.length === 1}
//           preload={incoming ? "auto" : "auto"}
//           onEnded={incoming ? undefined : handleVideoEnded}
//           onError={incoming ? undefined : handleVideoError}
//           className="absolute inset-0 h-full w-full object-cover"
//         />
//       );
//     }

//     return (
//       <img
//         key={`${index}-${slide.url}`}
//         src={src}
//         alt={`Bhopal Inn view ${index + 1}`}
//         loading="eager"
//         fetchPriority={!incoming && index === 0 ? "high" : "auto"}
//         decoding="async"
//         className="absolute inset-0 h-full w-full object-cover"
//       />
//     );
//   };

//   return (
//     <section
//       ref={heroRef}
//       className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black text-white lg:min-h-[125vh]"
//     >
//       {/* BACKGROUND SLIDER */}
//       <div className="absolute inset-0 z-0 overflow-hidden bg-black">
//         <div className="absolute inset-0">
//           {renderMedia(activeSlide, current)}

//           <div className="pointer-events-none absolute inset-0 bg-black/40" />
//           <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
//         </div>

//         {incomingSlide && (
//           <div
//             ref={incomingRef}
//             className="absolute inset-0"
//             style={{
//               clipPath: "inset(0 0 0 100%)",
//               transform: "scale(1.08)",
//               willChange: "clip-path, transform",
//             }}
//           >
//             {renderMedia(incomingSlide, incomingIndex, true)}

//             <div className="pointer-events-none absolute inset-0 bg-black/40" />
//             <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
//           </div>
//         )}
//       </div>

//       {/* ORIGINAL HERO CONTENT */}
//       <div className="relative z-10 container mx-auto mt-20 px-4 text-center">
//         <div className="flex flex-col items-center">
//           <p className="hero-intro mb-4 text-xs font-light capitalize tracking-[0.05em] text-[#BFA37E] lg:text-xl">
//             Welcome to Bhopal Inn
//           </p>

//           <h1 className="hero-intro mb-8 font-saoltext text-4xl capitalize leading-[1.1] tracking-normal md:text-7xl lg:text-8xl">
//             Experience Luxury
//             <br className="hidden md:block" /> At Every Turn
//           </h1>

//           <p className="hero-intro mb-12 max-w-2xl border-l-2 border-[#BFA37E] py-2 pl-6 text-sm font-bold capitalize tracking-[0.04em] text-white/90 md:text-lg">
//             Premium Boutique Hotel | City Centre | 10 Min from Station
//           </p>

//           <div className="hero-intro mb-10 flex flex-col items-center gap-6 sm:flex-row">
//             <Link
//               to="/booking"
//               className="flex min-w-[200px] items-center justify-center rounded-sm bg-[#BFA37E] px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-2xl transition-colors hover:bg-[#a68d6d]"
//             >
//               Book Now
//             </Link>

//             <Link
//               to="/rooms"
//               className="flex min-w-[200px] items-center justify-center rounded-sm border border-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black"
//             >
//               Explore Rooms
//             </Link>
//           </div>

//           {/* TRUST STRIP */}
//           <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-white/20 py-5">
//             <div className="hero-trust flex items-center gap-2">
//               <Star size={16} className="text-[#BFA37E]" fill="#BFA37E" />
//               <span className="text-[10px] font-bold uppercase tracking-widest">
//                 Google Rating
//               </span>
//             </div>

//             <div className="hidden h-4 w-px bg-white/20 md:block" />

//             <div className="hero-trust flex items-center gap-2">
//               <DoorOpen size={16} className="text-[#BFA37E]" />
//               <span className="text-[10px] font-bold uppercase tracking-widest">
//                 16 Premium Rooms
//               </span>
//             </div>

//             <div className="hidden h-4 w-px bg-white/20 md:block" />

//             <div className="hero-trust flex items-center gap-2">
//               <MapPin size={16} className="text-[#BFA37E]" />
//               <span className="text-[10px] font-bold uppercase tracking-widest">
//                 City Centre Location
//               </span>
//             </div>

//             <div className="hidden h-4 w-px bg-white/20 md:block" />

//             <div className="hero-trust flex items-center gap-2">
//               <Trophy size={16} className="text-[#BFA37E]" />
//               <span className="text-[10px] font-bold uppercase tracking-widest">
//                 Best Budget Hotel Bhopal
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* SLIDER INDICATORS */}
//       {images.length > 1 && (
//         <div className="absolute bottom-10 left-10 z-20 flex flex-col gap-3">
//           {images.map((item, index) => (
//             <button
//               key={`${item.url}-${index}`}
//               type="button"
//               onClick={() => goToSlide(index)}
//               aria-label={`Go to slide ${index + 1}`}
//               aria-current={current === index ? "true" : undefined}
//               className={`h-8 w-[2px] transition-all duration-300 ${
//                 current === index
//                   ? "h-12 bg-[#BFA37E]"
//                   : "bg-white/30 hover:bg-white"
//               }`}
//             />
//           ))}

//           <button
//             type="button"
//             onClick={() => setIsPaused((prev) => !prev)}
//             className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/70 hover:text-[#BFA37E]"
//           >
//             {isPaused ? "Play" : "Pause"}
//           </button>
//         </div>
//       )}

//       {/* SCROLL DOWN */}
//       <div className="absolute bottom-10 right-10 z-20 hidden origin-right rotate-90 items-center gap-4 md:flex">
//         <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
//           Scroll Down
//         </span>
//         <div className="h-px w-12 bg-[#BFA37E]" />
//       </div>
//     </section>
//   );
// };

// export default HeroSection;





import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { gsap } from "gsap";
import axios from "axios";
import config from "../../config";
import { Star, DoorOpen, MapPin, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

const IMAGE_DURATION = 6000;
const TRANSITION_DURATION = 1.1;
const VIDEO_TRANSITION_LEAD = 1.3;

const defaultImages = [
  "/banquet_main.jpg",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070&auto=format&fit=crop",
];

const HeroSection = () => {
  const [images, setImages] = useState(() =>
    defaultImages.map((url) => ({ url, type: "image" }))
  );
  const [current, setCurrent] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState(null);

  const sliderRef = useRef(null);
  const currentVideoRef = useRef(null);
  const incomingVideoRef = useRef(null);
  const timelineRef = useRef(null);
  const timerRef = useRef(null);

  const currentRef = useRef(0);
  const incomingIndexRef = useRef(null);
  const animatingRef = useRef(false);
  const imagesRef = useRef(images);
  const transitionRequestedRef = useRef(false);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const getMediaUrl = useCallback((url) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;

    if (url.startsWith("/") && !url.startsWith("/uploads/")) {
      return url;
    }

    const base = String(config.API_URL || "").replace(/\/+$/, "");
    return `${base}/${url.replace(/^\/+/, "")}`;
  }, []);

  // Fetch media without blocking the initial fallback.
  useEffect(() => {
    let mounted = true;

    axios
      .get(`${config.API_URL}/api/hero-images`, { timeout: 12000 })
      .then((res) => {
        if (!mounted || !Array.isArray(res.data)) return;

        const slides = res.data
          .filter((item) => item?.url)
          .map((item) => ({
            ...item,
            type:
              String(item.type || "image").toLowerCase() === "video"
                ? "video"
                : "image",
          }));

        if (slides.length) {
          imagesRef.current = slides;
          currentRef.current = 0;
          setImages(slides);
          setCurrent(0);
        }
      })
      .catch((error) => {
        console.error("Hero media request failed:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Start the current video and prepare the next video.
  useEffect(() => {
    const video = currentVideoRef.current;

    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      video.play().catch((error) => {
        console.warn("Current hero video could not autoplay:", error);
      });
    }

    const nextIndex = (current + 1) % images.length;
    const next = images[nextIndex];

    if (next?.type === "video") {
      const preloadVideo = document.createElement("video");
      preloadVideo.preload = "auto";
      preloadVideo.muted = true;
      preloadVideo.src = getMediaUrl(next.url);
      preloadVideo.load();

      return () => {
        preloadVideo.removeAttribute("src");
        preloadVideo.load();
      };
    }
  }, [current, images, getMediaUrl]);

  const changeSlide = useCallback(
    (target) => {
      if (
        target < 0 ||
        target >= imagesRef.current.length ||
        target === currentRef.current ||
        animatingRef.current
      ) {
        return;
      }

      animatingRef.current = true;
      transitionRequestedRef.current = true;
      incomingIndexRef.current = target;
      clearTimeout(timerRef.current);
      setIncomingIndex(target);
    },
    []
  );

  const handleNext = useCallback(() => {
    const slides = imagesRef.current;

    if (slides.length > 1 && !animatingRef.current) {
      changeSlide((currentRef.current + 1) % slides.length);
    }
  }, [changeSlide]);

  // Start incoming video before revealing it.
  useEffect(() => {
    if (incomingIndex === null) return;

    const incoming = incomingVideoRef.current;
    let cancelled = false;

    const startTransition = async () => {
      if (incoming) {
        incoming.muted = true;
        incoming.defaultMuted = true;
        incoming.playsInline = true;
        incoming.currentTime = 0;

        try {
          await incoming.play();
        } catch (error) {
          console.warn("Incoming video autoplay failed:", error);
        }

        // If the video has not buffered enough, wait briefly
        // for data rather than revealing a blank video frame.
        if (
          incoming.readyState < 2 &&
          !incoming.error
        ) {
          await new Promise((resolve) => {
            const finish = () => resolve();

            incoming.addEventListener("loadeddata", finish, {
              once: true,
            });

            window.setTimeout(finish, 1200);
          });
        }
      }

      if (cancelled || !sliderRef.current) return;

      const currentLayer = sliderRef.current.querySelector(
        ".hero-current-layer"
      );
      const incomingLayer = sliderRef.current.querySelector(
        ".hero-incoming-layer"
      );

      if (!currentLayer || !incomingLayer) {
        animatingRef.current = false;
        transitionRequestedRef.current = false;
        return;
      }

      gsap.set(incomingLayer, {
        clipPath: "inset(0 0 0 100%)",
        scale: 1.06,
        zIndex: 2,
        autoAlpha: 1,
      });

      gsap.set(currentLayer, { zIndex: 1 });

      timelineRef.current?.kill();

      timelineRef.current = gsap.timeline({
        onComplete: () => {
          currentRef.current = incomingIndex;
          setCurrent(incomingIndex);
          setIncomingIndex(null);

          animatingRef.current = false;
          transitionRequestedRef.current = false;
        },
      });

      timelineRef.current.to(incomingLayer, {
        clipPath: "inset(0 0 0 0%)",
        scale: 1,
        duration: TRANSITION_DURATION,
        ease: "power2.inOut",
      });
    };

    startTransition();

    return () => {
      cancelled = true;
    };
  }, [incomingIndex]);

  // Images use a timer. Videos start the transition before ending.
  useEffect(() => {
    clearTimeout(timerRef.current);

    if (incomingIndex !== null || images.length < 2) return;

    const slide = images[current];
    if (!slide) return;

    if (slide.type === "image") {
      timerRef.current = window.setTimeout(
        handleNext,
        IMAGE_DURATION
      );
    }

    return () => clearTimeout(timerRef.current);
  }, [current, images, incomingIndex, handleNext]);

  // Keep video transitions near the end of each clip.
  const handleVideoTimeUpdate = (event) => {
    const video = event.currentTarget;

    if (
      animatingRef.current ||
      transitionRequestedRef.current ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0
    ) {
      return;
    }

    const remaining = video.duration - video.currentTime;

    if (remaining <= VIDEO_TRANSITION_LEAD) {
      handleNext();
    }
  };

  const renderMedia = (slide, index, incoming = false) => {
    if (!slide) return null;

    const src = getMediaUrl(slide.url);

    return (
      <div
        key={`${index}-${slide.url}`}
        className={`absolute inset-0 h-full w-full ${
          incoming ? "hero-incoming-layer" : "hero-current-layer"
        }`}
      >
        {slide.type === "video" ? (
          <video
            ref={
              incoming
                ? incomingVideoRef
                : currentVideoRef
            }
            src={src}
            muted
            playsInline
            preload="auto"
            autoPlay
            loop={false}
            onTimeUpdate={
              incoming ? undefined : handleVideoTimeUpdate
            }
            onEnded={incoming ? undefined : handleNext}
            onError={incoming ? undefined : handleNext}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <img
            src={src}
            alt={`Bhopal Inn ${index + 1}`}
            loading="eager"
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-black/40" />
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black lg:min-h-[125vh]">
      {/* BACKGROUND SLIDER */}
      <div
        ref={sliderRef}
        className="absolute inset-0 z-0 overflow-hidden"
      >
        {images.length > 0 && (
          <>
            {renderMedia(images[current], current)}

            {incomingIndex !== null &&
              renderMedia(
                images[incomingIndex],
                incomingIndex,
                true
              )}
          </>
        )}
      </div>

      {/* ORIGINAL CONTENT */}
      <div className="relative z-10 container mx-auto mt-20 px-4 text-center">
        <div className="flex flex-col items-center">
          <p className="mb-4 text-xs font-light capitalize tracking-[0.05em] text-[#BFA37E] lg:text-xl">
            Welcome to Bhopal Inn
          </p>

          <h1 className="mb-8 font-saoltext text-4xl capitalize leading-[1.1] tracking-[0] text-white md:text-7xl lg:text-8xl">
            Experience Luxury
            <br className="hidden md:block" /> At Every Turn
          </h1>

          <p className="mx-auto mb-12 max-w-2xl border-l-2 border-[#BFA37E] py-2 pl-6 text-sm font-bold capitalize tracking-[0.04em] text-white/90 md:text-lg">
            Premium Boutique Hotel | City Centre | 10 Min from Station
          </p>

          <div className="mb-10 flex flex-col items-center gap-6 sm:flex-row">
            <Link
              to="/booking"
              className="min-w-[200px] rounded-sm bg-[#BFA37E] px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:bg-[#a68d6d]"
            >
              Book Now
            </Link>

            <Link
              to="/rooms"
              className="min-w-[200px] rounded-sm border border-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-white hover:text-black"
            >
              Explore Rooms
            </Link>
          </div>

          {/* TRUST STRIP */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-white/20 py-5">
            <div className="flex items-center gap-2 text-white/80">
              <Star size={16} className="text-[#BFA37E]" fill="#BFA37E" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Google Rating
              </span>
            </div>

            <div className="hidden h-4 w-px bg-white/20 md:block" />

            <div className="flex items-center gap-2 text-white/80">
              <DoorOpen size={16} className="text-[#BFA37E]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                16 Premium Rooms
              </span>
            </div>

            <div className="hidden h-4 w-px bg-white/20 md:block" />

            <div className="flex items-center gap-2 text-white/80">
              <MapPin size={16} className="text-[#BFA37E]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                City Centre Location
              </span>
            </div>

            <div className="hidden h-4 w-px bg-white/20 md:block" />

            <div className="flex items-center gap-2 text-white/80">
              <Trophy size={16} className="text-[#BFA37E]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Best Budget Hotel Bhopal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SLIDER INDICATORS */}
      <div className="absolute bottom-10 left-10 z-20 flex flex-col gap-3">
        {images.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => changeSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={current === idx ? "true" : undefined}
            className={`h-8 w-[2px] transition-all duration-500 ${
              current === idx
                ? "h-12 bg-[#BFA37E]"
                : "bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* SCROLL DOWN */}
      <div className="absolute bottom-10 right-10 z-20 hidden origin-right rotate-90 items-center gap-4 md:flex">
        <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.5em] text-white/40">
          Scroll Down
        </span>
        <div className="h-px w-12 bg-[#BFA37E]" />
      </div>
    </div>
  );
};

export default HeroSection;

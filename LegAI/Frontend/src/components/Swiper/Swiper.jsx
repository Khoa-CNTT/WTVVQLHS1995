import React, { useState, useEffect, useRef } from 'react';
import styles from './Swiper.module.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Swiper = ({ 
  children, 
  slidesPerView = 1, 
  spaceBetween = 20, 
  loop = false, 
  autoplay = false, 
  autoplayDelay = 3000,
  pagination = true,
  navigation = true,
  effect = 'slide', // slide, fade
  className = '', 
  onSlideChange = () => {} 
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const autoplayTimerRef = useRef(null);
  const slidesRef = useRef([]);
  
  const childrenArray = React.Children.toArray(children);
  const totalSlides = childrenArray.length;
  
  // Tính toán số slide hiển thị dựa trên kích thước màn hình
  const [visibleSlides, setVisibleSlides] = useState(slidesPerView);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleSlides(1);
      } else if (window.innerWidth < 992) {
        setVisibleSlides(Math.min(2, slidesPerView));
      } else {
        setVisibleSlides(slidesPerView);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [slidesPerView]);
  
  // Autoplay
  useEffect(() => {
    if (autoplay) {
      startAutoplay();
    }
    
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [autoplay, activeIndex, totalSlides]);
  
  const startAutoplay = () => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }
    
    autoplayTimerRef.current = setInterval(() => {
      goToNext();
    }, autoplayDelay);
  };
  
  const stopAutoplay = () => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }
  };
  
  // Điều hướng
  const goToPrev = () => {
    setActiveIndex((prev) => {
      const newIndex = prev - 1;
      if (newIndex < 0) {
        return loop ? totalSlides - visibleSlides : 0;
      }
      return newIndex;
    });
    onSlideChange(activeIndex - 1);
    
    if (autoplay) {
      stopAutoplay();
      startAutoplay();
    }
  };
  
  const goToNext = () => {
    setActiveIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex > totalSlides - visibleSlides) {
        return loop ? 0 : totalSlides - visibleSlides;
      }
      return newIndex;
    });
    onSlideChange(activeIndex + 1);
    
    if (autoplay) {
      stopAutoplay();
      startAutoplay();
    }
  };
  
  const goToSlide = (index) => {
    setActiveIndex(index);
    onSlideChange(index);
    
    if (autoplay) {
      stopAutoplay();
      startAutoplay();
    }
  };
  
  // Xử lý touch events
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    if (autoplay) stopAutoplay();
  };
  
  const handleTouchMove = (e) => {
    setTouchEndX(e.touches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (touchStartX - touchEndX > 50) {
      goToNext();
    } else if (touchEndX - touchStartX > 50) {
      goToPrev();
    }
    
    if (autoplay) startAutoplay();
  };
  
  // Xử lý transition style dựa trên effect
  const getTransformStyle = () => {
    if (effect === 'fade') {
      return {};
    }
    
    const translateX = -activeIndex * (100 / visibleSlides);
    return {
      transform: `translateX(${translateX}%)`,
    };
  };
  
  // Tạo bullets cho pagination
  const renderPagination = () => {
    const bullets = [];
    const maxBullets = Math.ceil(totalSlides / visibleSlides);
    
    for (let i = 0; i < maxBullets; i++) {
      bullets.push(
        <div
          key={i}
          className={`${styles.swiperPaginationBullet} ${
            i === Math.floor(activeIndex / visibleSlides) ? styles.swiperPaginationBulletActive : ''
          }`}
          onClick={() => goToSlide(i * visibleSlides)}
        />
      );
    }
    
    return <div className={styles.swiperPagination}>{bullets}</div>;
  };
  
  // Tạo wrapper class dựa trên effect
  const getWrapperClass = () => {
    let wrapperClass = styles.swiperWrapper;
    
    if (effect === 'fade') {
      wrapperClass += ` ${styles.fadeEffect}`;
    }
    
    return wrapperClass;
  };
  
  return (
    <div 
      className={`${styles.swiperContainer} ${visibleSlides > 1 ? styles.swiperMulti : ''} ${className}`}
      onMouseEnter={autoplay ? stopAutoplay : undefined}
      onMouseLeave={autoplay ? startAutoplay : undefined}
    >
      <div
        className={getWrapperClass()}
        style={getTransformStyle()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {childrenArray.map((child, index) => {
          const isActive = index >= activeIndex && index < activeIndex + visibleSlides;
          
          return (
            <div
              key={index}
              ref={(el) => (slidesRef.current[index] = el)}
              className={`${styles.swiperSlide} ${
                isActive ? styles.swiperSlideActive : styles.swiperSlideInactive
              } ${effect === 'fade' ? styles.fadeIn : ''}`}
              style={{
                width: visibleSlides > 1 ? `calc(${100 / visibleSlides}% - ${spaceBetween}px)` : '100%',
                marginRight: index < totalSlides - 1 ? `${spaceBetween}px` : 0,
                opacity: effect === 'fade' ? (isActive ? 1 : 0) : 1,
                zIndex: effect === 'fade' ? (isActive ? 2 : 1) : 'auto',
              }}
            >
              {child}
            </div>
          );
        })}
      </div>
      
      {navigation && (
        <>
          <button
            className={styles.swiperButtonPrev}
            onClick={goToPrev}
            disabled={!loop && activeIndex === 0}
          >
            <FaChevronLeft />
          </button>
          <button
            className={styles.swiperButtonNext}
            onClick={goToNext}
            disabled={!loop && activeIndex >= totalSlides - visibleSlides}
          >
            <FaChevronRight />
          </button>
        </>
      )}
      
      {pagination && renderPagination()}
    </div>
  );
};

export default Swiper; 
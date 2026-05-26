import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400',
    title: 'Step Into Style',
    subtitle: 'Discover the latest collection of premium sneakers',
    cta: 'Shop Men\'s',
    link: '/men/mens-shoes',
  },
  {
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1400',
    title: 'Air Max Evolution',
    subtitle: 'Where comfort meets iconic design',
    cta: 'Shop Women\'s',
    link: '/women/womens-shoes',
  },
  {
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1400',
    title: 'New Arrivals',
    subtitle: 'Fresh colourways, timeless silhouettes',
    cta: 'Explore',
    link: '/new-and-featured',
  },
];

const FEATURED_CATEGORIES = [
  { title: "Men's Shoes", image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', link: '/men/mens-shoes' },
  { title: "Women's Shoes", image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', link: '/women/womens-shoes' },
  { title: "Kids' Shoes", image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600', link: '/kids/kids-shoes' },
  { title: "New Arrivals", image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', link: '/new-and-featured' },
];

export default function Home() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    productAPI.getFeatured().then((res) => setFeaturedProducts(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page home-page">
      <section className="hero">
        {HERO_SLIDES.map((slide, i) => (
          <div key={i} className={`hero-slide ${i === slideIndex ? 'active' : ''}`}>
            <div className="hero-image" style={{ backgroundImage: `url(${slide.image})` }} />
            <div className="hero-content">
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-subtitle">{slide.subtitle}</p>
              <Link to={slide.link} className="btn btn-white">{slide.cta}</Link>
            </div>
          </div>
        ))}
        <div className="hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} className={`dot ${i === slideIndex ? 'active' : ''}`} onClick={() => setSlideIndex(i)} />
          ))}
        </div>
      </section>

      <section className="featured-categories container">
        <h2 className="section-title">Shop by Category</h2>
        <div className="category-grid">
          {FEATURED_CATEGORIES.map((cat) => (
            <Link key={cat.title} to={cat.link} className="category-card">
              <div className="category-image" style={{ backgroundImage: `url(${cat.image})` }} />
              <div className="category-overlay">
                <h3 className="category-title">{cat.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="featured-products container">
          <h2 className="section-title">Featured Styles</h2>
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="apps-section">
        <div className="container">
          <div className="apps-grid">
            <div className="app-card">
              <div className="app-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600)' }} />
              <div className="app-content">
                <h3>Flexible Training Plans Tailored to You</h3>
                <p>With SA_Lifestyle Training Club, get access to over 190 free workouts across strength, endurance, yoga and mobility.</p>
                <div className="app-buttons">
                  <a href="#" className="btn btn-outline">Download iOS</a>
                  <a href="#" className="btn btn-outline">Download Android</a>
                </div>
              </div>
            </div>
            <div className="app-card">
              <div className="app-image" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600)' }} />
              <div className="app-content">
                <h3>For Every Run</h3>
                <p>The SA_Lifestyle Run Club gives you the guidance, inspiration and innovation you need to become a better athlete.</p>
                <div className="app-buttons">
                  <a href="#" className="btn btn-outline">Download iOS</a>
                  <a href="#" className="btn btn-outline">Download Android</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

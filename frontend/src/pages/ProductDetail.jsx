import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatBDT } from '../utils/format';
import './ProductDetail.css';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    productAPI.getBySlug(slug)
      .then((res) => {
        setProduct(res.data);
        setSelectedImage(0);
        setSelectedSize('');
        setSelectedColor(res.data.colors?.[0]?.name || '');
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selectedSize) return;
    setAdding(true);
    try {
      await addItem(product.id, selectedSize, selectedColor);
      navigate('/cart');
    } catch { alert('Failed to add to cart'); }
    setAdding(false);
  };

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!product) return null;

  const images = product.image_urls?.length > 0
    ? product.image_urls
    : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'];
  const colors = product.colors || [];

  return (
    <div className="page product-detail-page">
      <div className="product-detail container">
        <div className="product-gallery">
          <div className="gallery-main">
            <img src={images[selectedImage]} alt={product.name} />
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbnails">
              {images.map((img, i) => (
                <button key={i} className={`thumb ${i === selectedImage ? 'active' : ''}`}
                  onClick={() => setSelectedImage(i)}>
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <p className="product-info-category">{product.category_name}</p>
          <h1 className="product-info-name">{product.name}</h1>
          <p className="product-info-desc">{product.description}</p>

          <div className="product-info-price">
            {product.compare_price ? (
              <>
                <span className="current-price">{formatBDT(product.price)}</span>
                <span className="original-price">{formatBDT(product.compare_price)}</span>
              </>
            ) : (
              <span className="current-price">{formatBDT(product.price)}</span>
            )}
          </div>

          {colors.length > 0 && (
            <div className="product-selector">
              <h4>Colour: <span>{selectedColor}</span></h4>
              <div className="color-options">
                {colors.map((c) => (
                  <button key={c.name} className={`color-option ${selectedColor === c.name ? 'active' : ''}`}
                    style={{ backgroundColor: c.hex }} onClick={() => setSelectedColor(c.name)} title={c.name} />
                ))}
              </div>
            </div>
          )}

          <div className="product-selector">
            <h4>Size:</h4>
            <div className="size-options">
              {product.sizes?.map((size) => (
                <button key={size} className={`size-option ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}>
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary add-to-cart-btn" disabled={!selectedSize || adding}
            onClick={handleAddToCart}>
            {adding ? 'Adding...' : 'Add to Cart'}
          </button>
          {!selectedSize && <p className="size-hint">Please select a size</p>}
        </div>
      </div>
    </div>
  );
}

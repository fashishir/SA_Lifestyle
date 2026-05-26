import { Link } from 'react-router-dom';
import { formatBDT } from '../utils/format';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const imageUrl = product.image_urls?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';
  const colors = product.colors || [];
  const minPrice = formatBDT(product.price);
  const comparePrice = product.compare_price ? formatBDT(product.compare_price) : null;

  return (
    <Link to={`/product/${product.slug}`} className="product-card">
      <div className="product-card-image">
        <img src={imageUrl} alt={product.name} loading="lazy" />
        {comparePrice && <span className="product-badge">Sale</span>}
      </div>
      <div className="product-card-info">
        <p className="product-card-category">{product.category_name}</p>
        <h3 className="product-card-name">{product.name}</h3>
        {colors.length > 0 && (
          <div className="product-colors">
            {colors.map((c, i) => (
              <span key={i} className="color-swatch" style={{ backgroundColor: c.hex }} title={c.name} />
            ))}
          </div>
        )}
        <div className="product-card-price">
          {comparePrice ? (
            <>
              <span className="price-sale">{minPrice}</span>
              <span className="price-original">{comparePrice}</span>
            </>
          ) : (
            <span>{minPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

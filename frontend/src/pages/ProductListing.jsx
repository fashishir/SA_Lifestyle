import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import './ProductListing.css';

const GENDER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'kids', label: 'Kids' },
  { value: 'unisex', label: 'Unisex' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function ProductListing() {
  const { gender, category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    gender: gender || searchParams.get('gender') || '',
    category: category || searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    size: searchParams.get('size') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
  });

  useEffect(() => {
    if (gender && gender !== 'sale') {
      setFilters((f) => ({ ...f, gender, category: category || '', page: 1 }));
    }
  }, [gender, category]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.gender) params.gender = filters.gender;
        if (filters.category) params.category = filters.category;
        if (filters.search) params.search = filters.search;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.size) params.size = filters.size;
        if (filters.sort) params.sort = filters.sort;
        params.page = filters.page;
        params.limit = 20;
        const res = await productAPI.getAll(params);
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
      } catch { setProducts([]); }
      setLoading(false);
    };
    fetchProducts();
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value, page: key === 'page' ? value : 1 }));
  };

  const pageTitle = category
    ? category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    : gender
      ? gender.charAt(0).toUpperCase() + gender.slice(1)
      : 'All Products';

  return (
    <div className="page listing-page">
      <div className="listing-header">
        <div className="container">
          <h1 className="listing-title">{pageTitle}</h1>
          <p className="listing-count">{products.length} results</p>
        </div>
      </div>

      <div className="listing-content container">
        <aside className="listing-sidebar">
          <div className="filter-section">
            <h4 className="filter-title">Gender</h4>
            {GENDER_OPTIONS.map((opt) => (
              <label key={opt.value} className="filter-option">
                <input type="radio" name="gender" checked={filters.gender === opt.value}
                  onChange={() => updateFilter('gender', opt.value)} />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {gender !== 'sale' && (
            <div className="filter-section">
              <h4 className="filter-title">Price</h4>
              <div className="price-inputs">
                <input type="number" placeholder="Min" value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)} className="price-input" />
                <span>-</span>
                <input type="number" placeholder="Max" value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)} className="price-input" />
              </div>
            </div>
          )}
        </aside>

        <div className="listing-main">
          <div className="listing-toolbar">
            <div className="search-result">
              {filters.search && <span>Search: "{filters.search}"</span>}
            </div>
            <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} className="sort-select">
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : products.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="pagination">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`page-btn ${p === filters.page ? 'active' : ''}`}
                      onClick={() => updateFilter('page', p)}>{p}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

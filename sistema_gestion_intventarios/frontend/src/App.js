import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import './App.css';

const App = ({ keycloak }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    initialQuantity: ''
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [stockFilter, setStockFilter] = useState('all');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (keycloak.authenticated) {
      const adminRole = keycloak.tokenParsed?.roles?.includes('ROLE_ADMIN') || false;
      const employeeRole = keycloak.tokenParsed?.roles?.includes('ROLE_EMPLOYEE') || false;

      setIsAdmin(adminRole);
      setIsEmployee(employeeRole);

      const interval = setInterval(() => {
        keycloak.updateToken(30).then((refreshed) => {
          if (refreshed) console.log('Token refreshed');
        }).catch(() => keycloak.login());
      }, 30000);

      fetchProducts();
      return () => clearInterval(interval);
    }
  }, [keycloak]);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Resetear a la primera página cuando cambian los filtros
  }, [products, searchTerm, categoryFilter, priceRange, stockFilter]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/api/products', {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      });
      setProducts(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...products];

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term))
    }

    // Filtro por categoría
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Filtro por rango de precio
    result = result.filter(p =>
        p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Filtro por stock
    if (stockFilter === 'low') {
      result = result.filter(p => p.initialQuantity < 10);
    } else if (stockFilter === 'out') {
      result = result.filter(p => p.initialQuantity === 0);
    } else if (stockFilter === 'in') {
      result = result.filter(p => p.initialQuantity > 0);
    }

    setFilteredProducts(result);
  };

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditModalOpen) {
      setEditingProduct({ ...editingProduct, [name]: value });
    } else {
      setNewProduct({ ...newProduct, [name]: value });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('You need ROLE_ADMIN to create products');
      return;
    }
    try {
      await axios.post('http://localhost:8080/api/products', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        initialQuantity: parseInt(newProduct.initialQuantity, 10)
      }, {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      });
      setNewProduct({ name: '', description: '', category: '', price: '', initialQuantity: '' });
      setIsCreateModalOpen(false);
      fetchProducts();
      setError('');
    } catch (err) {
      console.error('Error creating product:', err);
      setError(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('You need ROLE_ADMIN to edit products');
      return;
    }
    try {
      await axios.put(`http://localhost:8080/api/products/${editingProduct.id}`, {
        ...editingProduct,
        price: parseFloat(editingProduct.price),
        initialQuantity: parseInt(editingProduct.initialQuantity, 10)
      }, {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      });
      setIsEditModalOpen(false);
      fetchProducts();
      setError('');
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  const deleteProduct = async (id) => {
    if (!isAdmin) {
      setError('You need ROLE_ADMIN to delete products');
      return;
    }
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:8080/api/products/${id}`, {
          headers: { Authorization: `Bearer ${keycloak.token}` }
        });
        fetchProducts();
        setError('');
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product');
      }
    }
  };

  const openEditModal = (product) => {
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  // Estadísticas avanzadas
  const totalProducts = filteredProducts.length;
  const totalValue = filteredProducts.reduce((sum, product) => sum + (product.price * product.initialQuantity), 0).toFixed(2);
  const categories = [...new Set(products.map(p => p.category))];
  const lowStockProducts = products.filter(p => p.initialQuantity < 10).length;
  const outOfStockProducts = products.filter(p => p.initialQuantity === 0).length;
  const averagePrice = (filteredProducts.reduce((sum, p) => sum + p.price, 0) / (filteredProducts.length || 1)).toFixed(2);
  const maxPriceProduct = filteredProducts.length > 0 ?
      filteredProducts.reduce((max, p) => p.price > max.price ? p : max) : null;
  const minPriceProduct = filteredProducts.length > 0 ?
      filteredProducts.reduce((min, p) => p.price < min.price ? p : min) : null;

  return (
      <div className="app-container">
        <header className="app-header">
          <h1>Inventory Management System</h1>
          <div className="user-info">
            <span>Welcome, <strong>{keycloak.tokenParsed?.preferred_username || 'User'}</strong></span>
            <button className="logout-button" onClick={() => keycloak.logout()}>
              Logout
            </button>
          </div>
        </header>

        <main className="main-content">
          {error && <div className="error-message">{error}</div>}

          {isAdmin && (
              <button className="add-product-button" onClick={() => setIsCreateModalOpen(true)}>
                + Add New Product
              </button>
          )}

          {/* Panel de filtros y búsqueda */}
          <div className="filters-panel">
            <div className="search-box">
              <input
                  type="text"
                  placeholder="Search by name, description or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-button">
                <i className="search-icon">🔍</i>
              </button>
            </div>

            <div className="filter-group">
              <label>Category:</label>
              <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Price Range:</label>
              <div className="price-range">
                <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])}
                    min="0"
                />
                <span>to</span>
                <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value) || 10000])}
                    min={priceRange[0]}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Stock Status:</label>
              <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="low">Low Stock (&lt;10)</option>
                <option value="out">Out of Stock</option>
                <option value="in">In Stock</option>
              </select>
            </div>
          </div>

          {/* Estadísticas avanzadas */}
          <div className="advanced-stats">
            <div className="stat-card">
              <h3>Total Products</h3>
              <p>{totalProducts}</p>
            </div>
            <div className="stat-card">
              <h3>Total Inventory Value</h3>
              <p>${totalValue}</p>
            </div>
            <div className="stat-card">
              <h3>Average Price</h3>
              <p>${averagePrice}</p>
            </div>
            <div className="stat-card">
              <h3>Low Stock Items</h3>
              <p>{lowStockProducts}</p>
            </div>
            <div className="stat-card">
              <h3>Out of Stock</h3>
              <p>{outOfStockProducts}</p>
            </div>
            {maxPriceProduct && (
                <div className="stat-card">
                  <h3>Highest Priced</h3>
                  <p>{maxPriceProduct.name} (${maxPriceProduct.price})</p>
                </div>
            )}
            {minPriceProduct && (
                <div className="stat-card">
                  <h3>Lowest Priced</h3>
                  <p>{minPriceProduct.name} (${minPriceProduct.price})</p>
                </div>
            )}
          </div>

          {/* Modal para crear producto */}
          <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
            <h2>Create New Product</h2>
            <form className="modal-form" onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                    type="text"
                    name="name"
                    value={newProduct.name}
                    onChange={handleInputChange}
                    required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                    type="text"
                    name="description"
                    value={newProduct.description}
                    onChange={handleInputChange}
                    required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                    type="text"
                    name="category"
                    value={newProduct.category}
                    onChange={handleInputChange}
                    required
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                    type="number"
                    name="price"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                />
              </div>
              <div className="form-group">
                <label>Initial Quantity</label>
                <input
                    type="number"
                    name="initialQuantity"
                    value={newProduct.initialQuantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                />
              </div>
              <div className="form-actions">
                <button type="submit">Create Product</button>
                <button type="button" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </Modal>

          {/* Modal para editar producto */}
          <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
            <h2>Edit Product</h2>
            {editingProduct && (
                <form className="modal-form" onSubmit={handleEditSubmit}>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text"
                        name="name"
                        value={editingProduct.name}
                        onChange={handleInputChange}
                        required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                        type="text"
                        name="description"
                        value={editingProduct.description}
                        onChange={handleInputChange}
                        required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input
                        type="text"
                        name="category"
                        value={editingProduct.category}
                        onChange={handleInputChange}
                        required
                    />
                  </div>
                  <div className="form-group">
                    <label>Price</label>
                    <input
                        type="number"
                        name="price"
                        value={editingProduct.price}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        required
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                        type="number"
                        name="initialQuantity"
                        value={editingProduct.initialQuantity}
                        onChange={handleInputChange}
                        min="0"
                        required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit">Update Product</button>
                    <button type="button" onClick={() => setIsEditModalOpen(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
            )}
          </Modal>

          {/* Lista de productos filtrados */}
          <section className="product-list-section">
            <h2>Product List ({filteredProducts.length} items)</h2>
            {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading products...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <p>No products match your filters.</p>
            ) : (
                <>
                  <div className="product-table-container">
                    <table className="product-table">
                      <thead>
                      <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        {isAdmin && <th>Actions</th>}
                      </tr>
                      </thead>
                      <tbody>
                      {currentItems.map((product) => (
                          <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.description}</td>
                            <td>{product.category}</td>
                            <td>${product.price.toFixed(2)}</td>
                            <td className={product.initialQuantity < 5 ? 'low-stock' : ''}>
                              {product.initialQuantity}
                              {product.initialQuantity < 5 && <span className="stock-warning">!</span>}
                            </td>
                            {isAdmin && (
                                <td>
                                  <div className="actions">
                                    <button
                                        className="edit-btn"
                                        onClick={() => openEditModal(product)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteProduct(product.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                            )}
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div className="pagination">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                        <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={currentPage === number ? 'active' : ''}
                        >
                          {number}
                        </button>
                    ))}

                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </>
            )}
          </section>
        </main>
      </div>
  );
};

export default App;
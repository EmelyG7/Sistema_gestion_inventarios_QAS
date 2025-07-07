import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const App = ({ keycloak }) => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    initialQuantity: ''
  });
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check roles and set up token refresh
  useEffect(() => {
    if (keycloak.authenticated) {
      // Check roles using tokenParsed.roles
      const adminRole = keycloak.tokenParsed?.roles?.includes('ROLE_ADMIN') || false;
      const employeeRole = keycloak.tokenParsed?.roles?.includes('ROLE_EMPLOYEE') || false;

      setIsAdmin(adminRole);
      setIsEmployee(employeeRole);

      console.log('User is authenticated:', keycloak.authenticated);
      console.log('User has ROLE_ADMIN:', adminRole);
      console.log('User has ROLE_EMPLOYEE:', employeeRole);
      console.log('Token roles:', keycloak.tokenParsed?.roles);

      // Set up token refresh every 30 seconds
      const interval = setInterval(() => {
        keycloak.updateToken(30).then((refreshed) => {
          if (refreshed) {
            console.log('Token refreshed:', keycloak.token);
          }
        }).catch(() => {
          console.error('Failed to refresh token');
          keycloak.login();
        });
      }, 30000);

      fetchProducts();
      return () => clearInterval(interval);
    }
  }, [keycloak]);

  // Fetch all products (public endpoint)
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

  // Create a new product (requires ROLE_ADMIN)
  const createProduct = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('You need ROLE_ADMIN to create products');
      return;
    }
    try {
      await axios.post('http://localhost:8080/api/products', newProduct, {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      });
      setNewProduct({ name: '', description: '', category: '', price: '', initialQuantity: '' });
      fetchProducts();
      setError('');
    } catch (err) {
      console.error('Error creating product:', err);
      setError('Failed to create product');
    }
  };

  // Update a product (requires ROLE_ADMIN)
  const updateProduct = async (id, updatedProduct) => {
    if (!isAdmin) {
      setError('You need ROLE_ADMIN to update products');
      return;
    }
    try {
      await axios.put(`http://localhost:8080/api/products/${id}`, updatedProduct, {
        headers: { Authorization: `Bearer ${keycloak.token}` }
      });
      fetchProducts();
      setError('');
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
    }
  };

  // Delete a product (requires ROLE_ADMIN)
  const deleteProduct = async (id) => {
    if (!isAdmin) {
      setError('You need ROLE_ADMIN to delete products');
      return;
    }
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
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  // Handle logout
  const handleLogout = () => {
    keycloak.logout();
  };

  // Calculate summary for non-admin users
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.initialQuantity), 0).toFixed(2);

  return (
      <div className="app-container">
        <header className="app-header">
          <h1>Inventory Management System</h1>
          <div className="user-info">
            <p>Welcome, {keycloak.tokenParsed?.preferred_username || 'User'}</p>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="main-content">
          {error && <p className="error-message">{error}</p>}

          {isAdmin && (
              <section className="product-form-section">
                <h2>Create New Product</h2>
                <form className="product-form" onSubmit={createProduct}>
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={newProduct.name}
                        onChange={handleInputChange}
                        placeholder="Product Name"
                        required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <input
                        type="text"
                        id="description"
                        name="description"
                        value={newProduct.description}
                        onChange={handleInputChange}
                        placeholder="Description"
                        required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input
                        type="text"
                        id="category"
                        name="category"
                        value={newProduct.category}
                        onChange={handleInputChange}
                        placeholder="Category"
                        required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="price">Price</label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        value={newProduct.price}
                        onChange={handleInputChange}
                        placeholder="Price"
                        step="0.01"
                        required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="initialQuantity">Quantity</label>
                    <input
                        type="number"
                        id="initialQuantity"
                        name="initialQuantity"
                        value={newProduct.initialQuantity}
                        onChange={handleInputChange}
                        placeholder="Initial Quantity"
                        required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit">Add Product</button>
                    <button type="button" onClick={() => setNewProduct({ name: '', description: '', category: '', price: '', initialQuantity: '' })}>
                      Clear
                    </button>
                  </div>
                </form>
              </section>
          )}

          <section className="product-list-section">
            <h2>Products</h2>
            {isEmployee && !isAdmin && (
                <div className="product-summary">
                  <p>Total Products: {totalProducts}</p>
                  <p>Total Inventory Value: ${totalValue}</p>
                </div>
            )}
            {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading products...</p>
                </div>
            ) : products.length === 0 ? (
                <p>No products available.</p>
            ) : (
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
                    {products.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.description}</td>
                          <td>{product.category}</td>
                          <td>${product.price.toFixed(2)}</td>
                          <td>{product.initialQuantity}</td>
                          {isAdmin && (
                              <td>
                                <div className="actions">
                                  <button
                                      className="edit-btn"
                                      onClick={() => {
                                        const newPrice = prompt('New price:', product.price);
                                        if (newPrice && !isNaN(newPrice)) {
                                          updateProduct(product.id, { ...product, price: parseFloat(newPrice) });
                                        }
                                      }}
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
            )}
          </section>
        </main>
      </div>
  );
};

export default App;
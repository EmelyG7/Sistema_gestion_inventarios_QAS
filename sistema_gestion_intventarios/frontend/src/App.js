import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    initialQuantity: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/api/products');
      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = editingId
          ? `http://localhost:8080/api/products/${editingId}`
          : 'http://localhost:8080/api/products';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          initialQuantity: parseInt(newProduct.initialQuantity, 10),
        }),
      });

      if (!response.ok) {
        throw new Error(editingId ? 'Error al actualizar producto' : 'Error al crear producto');
      }

      fetchProducts();
      setNewProduct({ name: '', description: '', category: '', price: '', initialQuantity: '' });
      setEditingId(null);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product) => {
    setNewProduct({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      initialQuantity: product.initialQuantity.toString()
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar producto');
      }

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewProduct({ name: '', description: '', category: '', price: '', initialQuantity: '' });
    setEditingId(null);
  };

  return (
      <div className="app-container">
        <header className="app-header">
          <h1>Sistema de Gestión de Inventarios</h1>
        </header>

        <main className="main-content">
          <section className="product-form-section">
            <h2>{editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-group">
                <label htmlFor="name">Nombre:</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={newProduct.name}
                    onChange={handleInputChange}
                    required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción:</label>
                <input
                    type="text"
                    id="description"
                    name="description"
                    value={newProduct.description}
                    onChange={handleInputChange}
                    required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Categoría:</label>
                <input
                    type="text"
                    id="category"
                    name="category"
                    value={newProduct.category}
                    onChange={handleInputChange}
                    required
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Precio:</label>
                <input
                    type="number"
                    id="price"
                    name="price"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                />
              </div>

              <div className="form-group">
                <label htmlFor="initialQuantity">Cantidad:</label>
                <input
                    type="number"
                    id="initialQuantity"
                    name="initialQuantity"
                    value={newProduct.initialQuantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Procesando...' : (editingId ? 'Actualizar' : 'Agregar')}
                </button>
                {editingId && (
                    <button type="button" onClick={handleCancel} disabled={isLoading}>
                      Cancelar
                    </button>
                )}
              </div>
            </form>
          </section>

          {error && <div className="error-message">{error}</div>}

          <section className="product-list-section">
            <h2>Listado de Productos</h2>
            {isLoading && !products.length ? (
                <p>Cargando productos...</p>
            ) : products.length === 0 ? (
                <p>No hay productos registrados</p>
            ) : (
                <div className="product-table-container">
                  <table className="product-table">
                    <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Cantidad</th>
                      <th>Acciones</th>
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
                          <td className="actions">
                            <button
                                onClick={() => handleEdit(product)}
                                className="edit-btn"
                                disabled={isLoading}
                            >
                              Editar
                            </button>
                            <button
                                onClick={() => handleDelete(product.id)}
                                className="delete-btn"
                                disabled={isLoading}
                            >
                              Eliminar
                            </button>
                          </td>
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
}

export default App;
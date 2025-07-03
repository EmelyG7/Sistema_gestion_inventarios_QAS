import React, { useState, useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import './App.css';

function App() {
  const { keycloak, initialized } = useKeycloak();
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

  // Verificar roles del usuario
  const isAdmin = keycloak.hasResourceRole('admin', 'inventory-app');
  const isEmployee = keycloak.hasResourceRole('employee', 'inventory-app');

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      fetchProducts();
    }
  }, [initialized, keycloak.authenticated]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8080/api/products', {
        headers: {
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : undefined
        }
      });
      if (!response.ok) throw new Error('Error al cargar productos');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Solo los administradores pueden modificar productos');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const url = editingId
          ? `http://localhost:8080/api/products/${editingId}`
          : 'http://localhost:8080/api/products';
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keycloak.token}`
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price) || 0,
          initialQuantity: parseInt(newProduct.initialQuantity, 10) || 0
        })
      });
      if (!response.ok) throw new Error(editingId ? 'Error al actualizar producto' : 'Error al crear producto');
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

  const handleDelete = async (id) => {
    if (!isAdmin) {
      setError('Solo los administradores pueden eliminar productos');
      return;
    }
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${keycloak.token}`
        }
      });
      if (!response.ok) throw new Error('Error al eliminar producto');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleEdit = (product) => {
    if (!isAdmin && !isEmployee) {
      setError('No tienes permisos para editar productos');
      return;
    }
    setNewProduct({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      initialQuantity: product.initialQuantity.toString()
    });
    setEditingId(product.id);
  };

  if (!initialized) {
    return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Inicializando sistema de autenticación...</p>
        </div>
    );
  }

  if (!keycloak.authenticated) {
    return (
        <div className="login-container">
          <div className="login-box">
            <h1>Sistema de Gestión de Inventarios</h1>
            <p>Por favor inicie sesión para acceder al sistema</p>
            <button onClick={() => keycloak.login()} className="login-button">
              Iniciar Sesión
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="app-container">
        <header className="app-header">
          <h1>Sistema de Gestión de Inventarios</h1>
          <div className="user-info">
          <span>
            Bienvenido, <strong>{keycloak.tokenParsed?.preferred_username || 'Usuario'}</strong>
            {isAdmin && ' (Administrador)'}
            {isEmployee && !isAdmin && ' (Empleado)'}
          </span>
            <button onClick={() => keycloak.logout()} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </header>
        <main className="main-content">
          {(isAdmin || isEmployee) && (
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
                        disabled={!isAdmin && editingId === null}
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
                    <button type="submit" disabled={isLoading || (!isAdmin && editingId === null)}>
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
          )}
          {error && <div className="error-message">{error}</div>}
          <section className="product-list-section">
            <h2>Listado de Productos</h2>
            {isLoading && !products.length ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Cargando productos...</p>
                </div>
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
                      {(isAdmin || isEmployee) && <th>Acciones</th>}
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
                          {(isAdmin || isEmployee) && (
                              <td className="actions">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="edit-btn"
                                    disabled={isLoading}
                                >
                                  Editar
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="delete-btn"
                                        disabled={isLoading}
                                    >
                                      Eliminar
                                    </button>
                                )}
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
}

export default App;
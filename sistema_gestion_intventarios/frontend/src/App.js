import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: 0,
    initialQuantity: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          initialQuantity: parseInt(newProduct.initialQuantity, 10),
        }),
      });
      fetchProducts();
      setNewProduct({ name: '', description: '', category: '', price: 0, initialQuantity: 0 });
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
      <div className="App">
        <h1>Gestión de Productos</h1>
        <form onSubmit={handleSubmit}>
          <input
              type="text"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              placeholder="Nombre"
              required
          />
          <input
              type="text"
              name="description"
              value={newProduct.description}
              onChange={handleInputChange}
              placeholder="Descripción"
              required
          />
          <input
              type="text"
              name="category"
              value={newProduct.category}
              onChange={handleInputChange}
              placeholder="Categoría"
              required
          />
          <input
              type="number"
              name="price"
              value={newProduct.price}
              onChange={handleInputChange}
              placeholder="Precio"
              required
          />
          <input
              type="number"
              name="initialQuantity"
              value={newProduct.initialQuantity}
              onChange={handleInputChange}
              placeholder="Cantidad Inicial"
              required
          />
          <button type="submit">Agregar Producto</button>
        </form>
        <h2>Productos</h2>
        <ul>
          {products.map((product) => (
              <li key={product.id}>
                {product.name} - {product.description} ({product.category}, ${product.price}, Cantidad: {product.initialQuantity})
                <button onClick={() => handleDelete(product.id)}>Eliminar</button>
              </li>
          ))}
        </ul>
      </div>
  );
}

export default App;
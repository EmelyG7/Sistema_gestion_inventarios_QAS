# Created by Emely at 2/7/2025
Feature: Gestión de Productos
  Como administrador del sistema
  Quiero poder gestionar los productos del inventario
  Para mantener actualizada la información de los productos

  Background:
    Given el sistema tiene los siguientes productos:
      | nombre      | descripción       | categoría  | precio | cantidad |
      | Laptop HP   | Laptop i7 16GB    | Tecnología | 1200   | 10       |
      | Mouse Logi  | Mouse inalámbrico | Accesorios | 25     | 50       |

  Scenario: Agregar un nuevo producto
    When agrego un nuevo producto con:
      | nombre      | descripción       | categoría  | precio | cantidad |
      | Teclado Logi| Teclado mecánico  | Accesorios | 80     | 30       |
    Then el producto "Teclado Logi" debería existir en el sistema
    And la cantidad del producto "Teclado Logi" debería ser 30

  Scenario: Editar un producto existente
    Given el producto "Laptop HP" tiene el ID 1
    When edito el producto con ID 1 con:
      | campo       | valor            |
      | descripción | Laptop i7 32GB   |
      | precio      | 1300             |
    Then el producto "Laptop HP" debería tener descripción "Laptop i7 32GB"
    And el producto "Laptop HP" debería tener precio 1300

  Scenario: Eliminar un producto
    Given el producto "Mouse Logi" tiene el ID 2
    When elimino el producto con ID 2
    Then el producto "Mouse Logi" no debería existir en el sistema

  Scenario: Administrador agrega un producto en el frontend
    Given estoy autenticado como administrador en el frontend
    When navego a la página de lista de productos
    And abro el formulario de creación de producto
    And lleno el formulario con nombre "Teclado Logi", descripción "Teclado mecánico", categoría "Accesorios", precio 80 y cantidad 30
    And envío el formulario de creación
    Then debería ver el producto "Teclado Logi" en la lista de productos

  Scenario: Administrador edita un producto en el frontend
    Given estoy autenticado como administrador en el frontend
    And el producto "Laptop HP" tiene el ID 1
    When navego a la página de lista de productos
    And abro el formulario de edición para el producto con ID 1
    And actualizo el formulario con descripción "Laptop i7 32GB" y precio 1300
    And envío el formulario de edición
    Then debería ver el producto "Laptop HP" con descripción "Laptop i7 32GB" en la lista de productos

  Scenario: Administrador elimina un producto en el frontend
    Given estoy autenticado como administrador en el frontend
    And el producto "Mouse Logi" tiene el ID 2
    When navego a la página de lista de productos
    And elimino el producto con ID 2
    Then el producto "Mouse Logi" no debería estar en la lista de productos
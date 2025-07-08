# Created by Emely at 2/7/2025
Feature: Visualización de Productos por Empleado
  Como empleado del sistema
  Quiero ver la lista de productos y un resumen del inventario
  Para monitorear el estado del inventario sin modificarlo

  Background:
    Given el sistema tiene los siguientes productos:
      | nombre      | descripción       | categoría  | precio | cantidad |
      | Laptop HP   | Laptop i7 16GB    | Tecnología | 1200   | 10       |
      | Mouse Logi  | Mouse inalámbrico | Accesorios | 25     | 50       |

  Scenario: Empleado puede ver la lista de productos
    Given estoy autenticado como empleado
    When solicito la lista de productos
    Then debería ver los productos "Laptop HP" y "Mouse Logi" en el sistema
    And debería ver un resumen con el total de productos 2 y el valor total del inventario 12250

  Scenario: Empleado no puede agregar un producto
    Given estoy autenticado como empleado
    When intento agregar un nuevo producto con:
      | nombre      | descripción       | categoría  | precio | cantidad |
      | Teclado Logi| Teclado mecánico  | Accesorios | 80     | 30       |
    Then debería recibir un error 403

  Scenario: Empleado ve la lista de productos en el frontend
    Given estoy autenticado como empleado en el frontend
    When navego a la página de lista de productos
    Then debería ver la lista de productos con un resumen
    And no debería ver el formulario de creación de productos ni botones de edición o eliminación
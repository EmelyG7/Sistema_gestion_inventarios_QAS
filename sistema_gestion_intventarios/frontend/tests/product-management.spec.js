const { test, expect } = require('@playwright/test');

test.describe('Product Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        // Simulate Keycloak login
        await page.goto('http://localhost:8180/realms/inventory-realm/protocol/openid-connect/auth?client_id=inventory-app-public&redirect_uri=http://localhost:3000&response_type=code&scope=openid');
        await page.fill('#username', 'admin');
        await page.fill('#password', 'admin');
        await page.click('#kc-login');
        await page.waitForURL('http://localhost:3000/**');
    });

    test('Admin can add a product', async ({ page }) => {
        await page.click('#add-product-link'); // Adjust ID
        await page.fill('#name-input', 'Laptop');
        await page.fill('#description-input', 'Gaming Laptop');
        await page.fill('#category-input', 'Electronics');
        await page.fill('#price-input', '999.99');
        await page.fill('#quantity-input', '10');
        await page.click('#submit-product');
        await expect(page.locator('.product-list .product-name')).toHaveText('Laptop');
    });

    test('Admin can edit a product', async ({ page }) => {
        await page.goto('http://localhost:3000/products/1/edit');
        await page.fill('#name-input', 'Laptop Pro');
        await page.fill('#description-input', 'Upgraded Laptop');
        await page.fill('#category-input', 'Electronics');
        await page.fill('#price-input', '1299.99');
        await page.fill('#quantity-input', '5');
        await page.click('#submit-product');
        await page.goto('http://localhost:3000/products');
        await expect(page.locator('.product-list .product-name')).toHaveText('Laptop Pro');
    });

    test('Admin can delete a product', async ({ page }) => {
        await page.goto('http://localhost:3000/products');
        await page.click('#delete-product-1');
        await expect(page.locator('.product-list .product-name')).not.toHaveText('Laptop');
    });

    test('Employee can view products but not modify', async ({ page }) => {
        // Relogin as employee
        await page.goto('http://localhost:8180/realms/inventory-realm/protocol/openid-connect/auth?client_id=inventory-app-public&redirect_uri=http://localhost:3000&response_type=code&scope=openid');
        await page.fill('#username', 'employee');
        await page.fill('#password', 'employee');
        await page.click('#kc-login');
        await page.waitForURL('http://localhost:3000/**');
        await page.goto('http://localhost:3000/products');
        await expect(page.locator('#product-summary')).toBeVisible();
        await expect(page.locator('#add-product-form')).not.toBeVisible();
        await expect(page.locator('.edit-product')).not.toBeVisible();
        await expect(page.locator('.delete-product')).not.toBeVisible();
    });
});
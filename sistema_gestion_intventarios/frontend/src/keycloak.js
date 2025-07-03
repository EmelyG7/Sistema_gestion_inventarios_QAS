import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://localhost:8180', // Correct Keycloak URL
    realm: 'inventory-realm',
    clientId: 'inventory-app',
    onLoad: 'login-required'
});

export default keycloak;
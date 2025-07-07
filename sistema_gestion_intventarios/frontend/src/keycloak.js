import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://localhost:8180', // Correct Keycloak URL
    realm: 'inventory-realm',
    clientId: 'inventory-app-public'
    // clientSecret: 'BHVvPZMBzPv3qL87LpbaiYWRGMDboXqN'

    // onLoad: 'login-required'
});

export default keycloak;
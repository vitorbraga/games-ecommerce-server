module.exports = {
    apps: [{
        name: "games-ecommerce-server",
        script: "./build/src/index.js",
        instances: "2",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
}
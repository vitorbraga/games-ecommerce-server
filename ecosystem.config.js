module.exports = {
    apps: [{
        name: "games-ecommerce-server",
        script: "./build/index.js",
        instances: "max",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
}
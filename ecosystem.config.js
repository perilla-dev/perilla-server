module.exports = {
	apps: [{
		name: "Perilla",
		script: "dist/index.js",
		autorestart: true,
		watch: false,
		max_memory_restart: "1G",
		env: {
			NODE_ENV: "development"
		},
		env_production: {
			NODE_ENV: "production"
		}
	}]
};

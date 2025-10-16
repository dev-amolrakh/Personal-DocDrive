module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        // Relaxed rules for initial setup
        "no-unused-vars": "warn",
        "no-undef": "warn"
    }
};

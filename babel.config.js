module.exports = {
  presets: [
    "@babel/typescript",
    [
      "@babel/preset-env",
      {
        modules: false
      }
    ]
  ],
  env: {
    test: {
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }
  }
};

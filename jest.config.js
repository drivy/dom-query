module.exports = {
  moduleFileExtensions: ["js", "ts"],
  moduleDirectories: ["node_modules"],
  transform: {
    "^.+\\.(js|ts)$": "babel-jest"
  },
  reporters: ["default"],
  testMatch: ["**/(*.)test.(js|ts)"]
};

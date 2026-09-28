const path = require('path');

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [path.join(__dirname, 'src/setupTests.js')],
  transform: {
    '^.+\\.[tj]sx?$': '<rootDir>/jest-babel-transform.cjs',
  },
  transformIgnorePatterns: ['/node_modules/(?!uuid/)'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/test/__mocks__/fileMock.js',
    '^.*config/apiConfig$': '<rootDir>/src/test/__mocks__/apiConfig.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/*.test.(js|jsx)'],
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx', '!src/**/*.module.css'],
};



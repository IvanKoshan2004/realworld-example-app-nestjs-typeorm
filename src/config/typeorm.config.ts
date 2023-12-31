export default () => ({
  database: {
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    name: process.env.DB_NAME,
    testName: process.env.DB_TEST_NAME,
    port: process.env.DB_PORT,
  },
});

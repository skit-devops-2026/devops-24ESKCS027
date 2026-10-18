// EventHive Backend API Server Entry Point
// Bridges to the unified EventHive application server for complete consistency

const app = require('../server');
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🐝 EventHive Backend Server Running on Port ${PORT}`);
  });
}

module.exports = app;

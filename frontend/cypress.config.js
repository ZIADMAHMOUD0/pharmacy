module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3001',
    video: false,
    env: {
      apiUrl: 'http://localhost:8000/api',
      adminUser: 'admin',
      adminPass: '123456',
      doctorUser: 'doctor',
      doctorPass: '123456',
      customerUser: 'ziad',
      customerPass: '123456',
      managerUser: 'manager',
      managerPass: '123456',
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here if needed
    },
  },
};

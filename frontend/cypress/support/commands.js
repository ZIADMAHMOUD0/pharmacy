Cypress.Commands.add('apiLogin', (username, password) => {
  const apiUrl = Cypress.env('apiUrl');
  return cy.request('POST', `${apiUrl}/users/login/`, { username, password }).then((res) => {
    const { access, refresh, user } = res.body;
    window.localStorage.setItem('access_token', access);
    if (refresh) window.localStorage.setItem('refresh_token', refresh);
    if (user) window.localStorage.setItem('user', JSON.stringify(user));
    return user;
  });
});

Cypress.Commands.add('seedUser', (username, password, role) => {
  const apiUrl = Cypress.env('apiUrl');
  return cy
    .request({
      method: 'POST',
      url: `${apiUrl}/users/`,
      body: {
        username,
        email: `${username}@example.com`,
        password,
        role,
      },
      failOnStatusCode: false, // ignore if already exists
    })
    .then(() => undefined);
});


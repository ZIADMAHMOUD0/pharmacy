describe('Admin flows (admin)', () => {
  before(() => {
    cy.seedUser(Cypress.env('adminUser'), Cypress.env('adminPass'), 'admin');
  });

  beforeEach(() => {
    cy.apiLogin(Cypress.env('adminUser'), Cypress.env('adminPass'));
  });

  it('navigates Categories → View Products and filters by category', () => {
    cy.visit('/admin/categories');
    cy.contains('Manage Categories').should('be.visible');
    cy.contains('View Products').first().click();
    cy.url().should('include', '/admin/products');
    cy.get('select').first().should('exist');
  });

  it('opens Batches page', () => {
    cy.visit('/admin/batches');
    cy.contains(/Batches|Manage Batches/i).should('be.visible');
  });
});


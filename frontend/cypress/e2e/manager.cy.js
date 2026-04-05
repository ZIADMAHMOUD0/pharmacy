describe('Manager flows (manager)', () => {
  before(() => {
    cy.seedUser(Cypress.env('managerUser'), Cypress.env('managerPass'), 'store_manager');
  });

  beforeEach(() => {
    cy.apiLogin(Cypress.env('managerUser'), Cypress.env('managerPass'));
  });

  it('opens Stock Management page', () => {
    cy.visit('/manager/stock');
    cy.contains(/Stock Management|Inventory/i).should('be.visible');
  });
});


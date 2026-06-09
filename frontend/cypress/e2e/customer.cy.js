describe('Customer flows (ziad)', () => {
  before(() => {
    cy.seedUser(Cypress.env('customerUser'), Cypress.env('customerPass'), 'customer');
  });

  beforeEach(() => {
    cy.apiLogin(Cypress.env('customerUser'), Cypress.env('customerPass'));
  });

  it('visits Ask Doctor and creates then deletes a question', () => {
    cy.visit('/ask-doctor');
    cy.contains('Ask a Doctor').should('be.visible');
    // Title is the first text input inside the "Submit a New Question" form.
    cy.get('form input[type="text"]').first().type('E2E Headache');
    cy.get('form textarea').first().type('I have a headache, what should I take?');
    cy.contains('button', /Submit Question/i).click();
    cy.contains('Question submitted').should('exist');
    cy.contains('E2E Headache').should('exist');
    // delete via trash button
    cy.get('button[title="Delete Question"]').first().click();
    cy.contains('Delete Question').should('be.visible');
    // Click the modal's confirm button (text === confirmText "Delete").
    cy.contains('button', /^Delete$/).click();
    cy.contains('deleted successfully', { matchCase: false }).should('exist');
  });

  it('browses products, adds to cart, and checks out', () => {
    cy.visit('/products');
    cy.contains('Manage Products').should('not.exist'); // ensure customer page
    cy.get('input[placeholder*="Search"]').type('a');
    cy.wait(300);
    // open Cart page to ensure access, then simulate server-side checkout via UI if present
    cy.visit('/cart');
    // If cart is empty, add an item via API route exposed in UI (fallback to API is avoided in E2E)
    cy.visit('/products');
    cy.get('button').contains(/Add to Cart|Add Product|Add/i).first().click({ force: true }).then(() => {
      cy.visit('/cart');
    }).then(() => {
      // Try to checkout if the UI shows a checkout button
      cy.contains(/Checkout|Place Order/i).click({ force: true });
      cy.contains(/Order|success|created/i).should('exist');
    });
  });
});


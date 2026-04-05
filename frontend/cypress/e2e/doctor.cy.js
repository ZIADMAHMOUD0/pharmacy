describe('Doctor flows (doctor)', () => {
  before(() => {
    cy.seedUser(Cypress.env('doctorUser'), Cypress.env('doctorPass'), 'doctor');
  });

  beforeEach(() => {
    cy.apiLogin(Cypress.env('doctorUser'), Cypress.env('doctorPass'));
  });

  it('lists patient questions and can open one', () => {
    cy.visit('/doctor/questions');
    cy.contains(/Patient Questions|Questions/i).should('be.visible');
    // Open first question if exists
    cy.get('body').then(($b) => {
      if ($b.find('button').filter((i, el) => el.innerText.match(/Answer|Open|View/i)).length) {
        cy.contains(/Answer|Open|View/i).first().click({ force: true });
      }
    });
  });
});


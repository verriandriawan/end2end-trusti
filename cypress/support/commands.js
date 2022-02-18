import 'cypress-file-upload';

Cypress.Commands.add('login', (user, flushAsset) => {
    cy.clearCookies()

    cy.visit('/login')

    if (flushAsset)
        cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)

    cy.request("POST", `${Cypress.env('API_URL')}/user`, user)

    cy.get('input[name=email]').then(elm => elm.val(user.email))
    cy.get('input[name=password]').then(elm => elm.val(user.password))
    cy.get('#btnSubmit').click()

    cy.contains("Recent Documents", { timeout: Cypress.env().timeout })
})

Cypress.Commands.add('logout', (a) => {
    cy.visit('/logout')
})


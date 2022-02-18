const { expect } = require("chai")

const auth = AuthTest()
describe("Authenticate", () => {
    it("Should be able to login", auth.Login)
    it("Should be able to request reset password", auth.RequestReset)
    it("Should be able to register", auth.Register)
})

function AuthTest() {

    return {
        // Should be able to login
        Login: () => {
            cy.visit("/login")

            cy.fixture("owner").then(owner => {
                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.request("DELETE", `${Cypress.env('API_URL')}/user/${owner.email}`)
                cy.login(owner, true)
            })
        },

        // Should be able to request reset password
        RequestReset: () => {
            cy.visit("/login")
            let owner
            cy.fixture("owner")
                .then(result => {
                    owner = result

                    cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                    cy.request("DELETE", `${Cypress.env('API_URL')}/user/${owner.email}`)
                    cy.request("POST", `${Cypress.env('API_URL')}/user`, owner)

                    cy.xpath('//a[@href="/forgot"]').click()

                    cy.get('#forgot-form')
                    cy.get('input[name=email]').then(elm => elm.val(owner.email))
                    cy.xpath('//*[text() = "Request reset password"]').click()

                    cy.contains("A forgot password link has been sent")

                    return cy.request("GET", `${Cypress.env('API_URL')}/verify_token?email=${owner.email}&type=forgot`)

                }).then(response => {

                    let token = response.body
                    expect(token.verifyId).to.equal(owner.email)

                    cy.visit(`/reset_password?token=${token.token}`)
                    cy.get('input[name=password]').then(elm => elm.val("admin123"))
                    cy.get('input[name=confirm]').then(elm => elm.val("admin123"))
                    cy.get('#reset-btn').click()

                    cy.contains("Password successfully changed")

                }).then(() => {

                    cy.get('input[name=email]').then(elm => elm.val(owner.email))
                    cy.get('input[name=password]').then(elm => elm.val(owner.password))
                    cy.get('#btnSubmit').click()
                    cy.contains("Email or password is invalid")

                    cy.get('input[name=email]').then(elm => elm.val(owner.email))
                    cy.get('input[name=password]').then(elm => elm.val("admin123"))
                    cy.get('#btnSubmit').click()

                    cy.get('#assetTable tbody tr').should("have.length", 1)

                })

        },

        // Should be able to register
        Register: () => {
            cy.visit("/login")

            cy.xpath('//a[@href="/signup"]').click()
            cy.contains("Sign up for Trusti")

            const name = Date.now()
            let user = {
                name,
                email: `${name}-activation@local.host`,
                password: 'adminadmin'
            }

            cy.request("DELETE", `${Cypress.env('API_URL')}/user/${user.email}`)

            cy.get("input[name=fullname]").then(elm => elm.val(user.name))
            cy.get("input[name=email]").then(elm => elm.val(user.email))
            cy.get("input[name=password]").then(elm => elm.val(user.password))

            cy.get('#signup-btn').click()

            cy.get('.modal.show')
            cy.xpath('//a[text() = "Ok, Got it"]').click()
            cy.get('.modal.show').should("not.exist")

            cy.get('input[name=email]').then(elm => elm.val(user.email))
            cy.get('input[name=password]').then(elm => elm.val(user.password))
            cy.get('#btnSubmit').click()

            cy.contains("your email is not confirmed")

            cy.request("GET", `${Cypress.env('API_URL')}/verify_token?email=${user.email}&type=email_confirm`)
                .then(result => {
                    let token = result.body.token
                    cy.visit(`/confirmation/${token}`)
                    cy.get('#assetTable tbody tr').should("have.length", 1)
                    cy.visit('/logout')
                })
                .then(() => {
                    cy.visit('/login')

                    cy.get('input[name=email]').then(elm => elm.val(user.email))
                    cy.get('input[name=password]').then(elm => elm.val(user.password))
                    cy.get('#btnSubmit').click()

                    cy.get('#assetTable tbody tr').should("have.length", 1)
                })
        }
    }
}
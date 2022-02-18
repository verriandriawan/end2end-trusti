
const crypto = require("crypto-js")

const home = HomeTest()
describe("Verifing Asset", () => {
    it("Should be able to verify by hash", home.VerifyByHash)
    it("Should be able to verify by credential", home.VerifyByCredential)
    // it.skip("Should be able to download IPFS")
    // it.skip("Should be able to download Cert PDF")
})

let userOwner = null

function HomeTest() {

    let owner
    let file

    // mocking trx from
    // https://explorer.vexanium.com/transaction/7201d3fa6598c1bd7736eea07f07dd5f2e5ba60d77754d5c66dfa048cadfe547

    const trx = '7201d3fa6598c1bd7736eea07f07dd5f2e5ba60d77754d5c66dfa048cadfe547'

    return {

        // Should be able to verify by hash
        VerifyByHash: () => {
            cy.visit('/verify')
            cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)

            cy.fixture("file").then(result => file = result)
            cy.fixture("owner").then(result => {
                owner = result
                return cy.request("POST", `${Cypress.env('API_URL')}/user`, owner)
            })
                .then(result => {
                    let pubkey = result.body.data.pubkey


                    const hash = `${crypto.SHA256(file)}`

                    return cy.request("POST", `${Cypress.env('API_URL')}/asset`, {
                        pubkey,
                        tx: trx,
                        hash
                    })
                })
                .then(result => {
                    let asset = result.body.data

                    cy.get('input.filepond--browser').attachFile("file.txt")
                    cy.wait(1000)
                    cy.xpath('//button[contains(text(), "Validate Document")]').then(elm => elm[0].click())

                    cy.get(".modal.show").within(() => {
                        cy.contains(asset.credentials)

                        cy.wait(1000)
                        cy.xpath('//button[@data-dismiss="modal"]').click()
                        cy.get('.modal.show').should("not.exist")
                    })

                })

        },

        // Should be able to verify by credential
        VerifyByCredential: () => {
            cy.visit('/verify')

            cy.get('.nav .nav-item')
                .last()
                .within(() => {
                    cy.get('a').click()
                })

            cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
            cy.fixture("owner").then(owner => {
                return cy.request("POST", `${Cypress.env('API_URL')}/user`, owner)
            })
                .then(result => {
                    userOwner = {
                        id: result.body.data.id,
                        fullname: result.body.data.fullname,
                        email: result.body.data.email,
                        pubkey: result.body.data.pubkey
                    }

                    const content = '1640249563820\n'

                    return cy.request("POST", `${Cypress.env('API_URL')}/asset`, {
                        pubkey: userOwner.pubkey,
                        tx: trx,
                        hash: `${crypto.SHA256(content)}`
                    })
                })
                .then(result => {
                    let asset = result.body.data

                    cy.get('input[name=credentials]').then(elm => elm.val(asset.credentials))
                    cy.wait(2000)
                    cy.xpath('//button[contains(text(), "Validate Document")]').then(elm => elm[1].click())

                    cy.get(".modal.show").within(() => {
                        cy.contains(asset.credentials)

                        cy.wait(1000)
                        cy.xpath('//button[@data-dismiss="modal"]').click()
                        cy.get('.modal.show').should("not.exist")
                    })

                })
        }

    }
}
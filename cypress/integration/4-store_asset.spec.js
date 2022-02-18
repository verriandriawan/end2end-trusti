
/**
 * NOTE
 * 
 * this is just a simple testing for UI, you still need to 
 * check all third party such as email, ipfs, blockchain, 
 * s3, and pdf manually.
 */

const { it } = require("mocha")

context("Asset Store", () => {
    beforeEach(() => {
        cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
    })
    
    const WithoutSigner = WithoutSignerAssetStoreTest()
    describe("Store without signer", () => {
        it("Should be success casual asset store", WithoutSigner.BareStore)
        it("Should be success asset store with meta", WithoutSigner.WithMeta)
        it("Should be success asset store with ipfs checked", WithoutSigner.IPFSChecked)
        it("Should be success to regenerate PDF", WithoutSigner.RegeneratePDF)
        it("Should be success to calculate user storage", WithoutSigner.CalculateStorage)
    })

    const WithSigner = WithSignerAssetStoreTest()
    describe("Store with signer", () => {
        it("Should success upload with single signer", WithSigner.SingleSigner)
        it("Should success upload with multi signer", WithSigner.MultiSigner)
    })

})

function WithoutSignerAssetStoreTest() {
    return {

        // Should be success upload asset barely
        BareStore: () => {
            cy.intercept({ method: 'POST', url: '/api/v1/assets' }).as("apiStoreAsset")

            cy.fixture("user").then(user => {
                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.request("DELETE", `${Cypress.env('API_URL')}/user/${user.email}`)
                cy.login(user, true)

                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.get('input.filepond--browser').attachFile("file.txt").then(() => {

                    cy.wait(2000)
                    cy.get('input[id=asset_name]').type("Cypress asset name")
                    cy.get('#btnsub').click()

                    cy.wait("@apiStoreAsset")
                    cy.get('#swal2-content').contains("Asset successfuly stored")
                    cy.get("#assetTableWrapper").contains("Cypress asset name")

                })
            })
        },

        // Should be success upload asset with meta
        WithMeta: () => {
            cy.intercept({ method: 'POST', url: '/api/v1/assets' }).as("apiStoreAsset")

            cy.fixture("user").then(user => {
                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.request("DELETE", `${Cypress.env('API_URL')}/user/${user.email}`)
                cy.login(user, true)

                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.get('input.filepond--browser').attachFile("file.txt").then(() => {
                    cy.wait(2000)
                    cy.get('input[id=asset_name]').type("Cypress asset name")

                    cy.get('#addMetaBtn').click()
                    cy.get('#addMetaBtn').click()

                    cy.xpath('//input[contains(@class, "meta-key")]')
                        .each((elm, idx) => cy.wrap(elm).type(`meta title ${(idx + 1)}`))

                    cy.xpath('//input[contains(@class, "meta-value")]')
                        .each((elm, idx) => cy.wrap(elm).type(`meta value ${(idx + 1)}`))

                    cy.get('#btnsub').click()

                    cy.wait("@apiStoreAsset")
                    cy.get('#swal2-content', { timeout: 10000 }).contains("Asset successfuly stored")

                    cy.wait(2000)
                    cy.get('#assetTableWrapper').contains("Cypress asset name")
                    cy.get('#assetTableWrapper tbody tr a').first().click()

                    cy.get('.container')
                        .within(() => {

                            cy.contains("Cypress asset name")
                            cy.contains("meta title")
                            cy.contains("meta value")

                        })

                })
            })
        },


        // Should be success upload with ipfs checked
        IPFSChecked: () => {
            cy.intercept({ method: 'POST', url: '/api/v1/assets' }).as("apiStoreAsset")


            cy.fixture("user").then(user => {
                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.request("DELETE", `${Cypress.env('API_URL')}/user/${user.email}`)
                cy.login(user, true)

                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.get('input.filepond--browser').attachFile("file.txt").then(() => {

                    cy.wait(2000)
                    cy.get('input[id=asset_name]').type("Cypress asset name")

                    cy.xpath('//span[contains(@class, "custom-toggle-slider")]').last().click()
                    cy.wait(2000)

                    cy.get('#btnsub').click()

                    cy.wait("@apiStoreAsset")
                    cy.get('#assetTableWrapper tbody tr a').first().click()

                    cy.wait(2000)
                    cy.window().then((win) => {
                        cy.stub(win, 'open').as('openIpfsDownload')

                        cy.get("#download-ipfs", { timeout: 10000 }).click()
                        cy.xpath('//span[@id="download-ipfs" and contains(@href, "http")]', { timeout: 20000 })
                    })

                    cy.get('.container')
                        .within(() => {
                            cy.contains("Cypress asset name")
                        })

                })
            })
        },

        // Should be success to regenerate PDF
        RegeneratePDF: () => {
            cy.intercept({ method: 'POST', url: '/api/v1/assets' }).as("apiStoreAsset")

            cy.fixture("user").then(user => {
                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.request("DELETE", `${Cypress.env('API_URL')}/user/${user.email}`)
                cy.login(user, true)

                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.get('input.filepond--browser').attachFile("file.txt").then(() => {

                    cy.wait(2000)
                    cy.get('input[id=asset_name]').type("Cypress asset name")

                    cy.xpath('//span[contains(@class, "custom-toggle-slider")]').last().click()
                    cy.wait(2000)

                    cy.get('#btnsub').click()

                    cy.wait("@apiStoreAsset")
                    cy.get('#assetTableWrapper tbody tr a').first().click()

                    cy.wait(2000)
                    cy.window().then((win) => {
                        cy.stub(win, 'open').as('openPDF')

                        cy.get("#regenerate-pdf", { timeout: 10000 }).click()
                        cy.get('#regenerate-pdf').contains('Wait a moment')
                        cy.xpath('//div[@id="regenerate-pdf-wrapper"]/a', { timeout: 20000 }).contains("PDF Certificate")
                    })

                    cy.get('.container').within(() => cy.contains("Cypress asset name"))

                })
            })
        },

        CalculateStorage: () => {
            cy.intercept({ method: 'POST', url: '/api/v1/assets' }).as("apiStoreAsset")

            cy.fixture("user").then(user => {
                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.request("DELETE", `${Cypress.env('API_URL')}/user/${user.email}`)
                cy.login(user, true)

                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.get('input.filepond--browser').attachFile("file.txt").then(() => {

                    cy.wait(2000)
                    cy.get('input[id=asset_name]').type("Cypress asset name")

                    cy.xpath('//span[contains(@class, "custom-toggle-slider")]').last().click()
                    cy.wait(2000)

                    cy.get('#btnsub').click()
                    cy.wait("@apiStoreAsset")

                    cy.reload()
                    cy.get('#storageUsed', {timeout: 5000}).should("not.have.text", "0 KB") 
                })
            })

           
        }

    }
}


function WithSignerAssetStoreTest() {

    const password = 'adminadmin'

    return {

        // Should success upload with single signer
        SingleSigner: () => {
            cy.intercept({ method: 'POST', url: '/api/v1/assets' }).as("apiStoreAsset")

            const signer = {
                email: 'store-signer-asset@local.host',
                fullname: 'one-signer',
                password,
                active: true,
                activation: true
            }

            cy.request("POST", `${Cypress.env('API_URL')}/user`, signer).then(result => cy.fixture("user"))
                .then(user => {
                    cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                    cy.request("DELETE", `${Cypress.env('API_URL')}/user/${user.email}`)
                    cy.login(user, true)

                    cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                    return cy.get('input.filepond--browser').attachFile("file.txt")
                }).then(() => {

                    cy.wait(2000)
                    cy.get('input[id=asset_name]').type("Cypress asset name")

                    cy.xpath('//span[contains(@class, "custom-toggle-slider")]').first().click()

                    cy.get('#approverContainer input[type=email]').each((elm, idx) => {
                        cy.wrap(elm).type(signer.email)
                    })

                    cy.wait(500)
                    cy.get('#btnsub').click()

                    cy.wait("@apiStoreAsset")

                    cy.get('#assetTableWrapper tbody')
                        .within(() => {
                            cy.wait(2000)
                            cy.get('.badge').contains('waiting')
                            cy.get('.badge').should('have.class', "bg-gradient-danger")
                        })
                    cy.get('#assetTableWrapper tbody tr a').first().click()

                    cy.get('.container').within(() => {
                        cy.contains("Cypress asset name")

                        cy.contains("cypress-user")
                        cy.contains("one-signer")

                        cy.get('dd').within(() => {
                            cy.get('.badge').contains('SIGNER')
                            cy.get('.badge').first().should("have.class", "bg-gradient-danger")
                        })
                    })

                })

        },


        // Should success upload with multi signer
        MultiSigner: () => {

            let signers = [
                {
                    email: 'store-signer1-multi-asset@local.host',
                    fullname: 'one-signer-multi',
                    password,
                    active: true
                },
                {
                    email: 'store-signer2-multi-asset@local.host',
                    fullname: 'two-signer-multi',
                    password,
                    active: true
                },

                {
                    email: 'store-unreg-multi-asset@local.host',
                    fullname: 'unreg-signer-multi',
                    password,
                    active: true
                }
            ]

            let [signer, signer2, _] = signers

            cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)

            cy.request("POST", `${Cypress.env('API_URL')}/user`, signer)
            cy.request("POST", `${Cypress.env('API_URL')}/user`, signer2)

            cy.fixture("user").then(user => {
                cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                cy.request("DELETE", `${Cypress.env('API_URL')}/user/${user.email}`)
                cy.login(user, true)

                cy.get('input.filepond--browser').attachFile("file.txt")


            }).then(() => {
                cy.intercept({ method: 'POST', url: '/api/v1/assets' }).as("apiStoreAsset")

                cy.wait(2000)
                cy.get('input[id=asset_name]').type("Cypress asset name")

                cy.xpath('//span[contains(@class, "custom-toggle-slider")]').first().click()

                cy.wait(2000)
                cy.get('button[title="Add new recipient"]').click()
                cy.get('button[title="Add new recipient"]').click()


                cy.get('#approverContainer input[type=email]').each((elm, idx) => {
                    cy.wrap(elm).type(signers[idx].email)
                })

                cy.wait(500)
                cy.get('#btnsub').click()

                cy.wait("@apiStoreAsset")

                cy.get('#assetTableWrapper tbody')
                    .within(() => {
                        cy.wait(2000)
                        cy.get('.badge').contains('waiting')
                        cy.get('.badge').should('have.class', "bg-gradient-danger")
                    })
                cy.get('#assetTableWrapper tbody tr a').first().click()

                cy.get('.container').within(() => {
                    cy.contains("Cypress asset name")
                    cy.contains("cypress-user")

                    cy.get('dd').within(() => {
                        cy.contains("store-unreg-multi-asset")
                        cy.contains("one-signer-multi")
                        cy.contains("two-signer-multi")

                        cy.get('.badge').contains('Unregistered')
                    })
                })
            })


        }
    }
}
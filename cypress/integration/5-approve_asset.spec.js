const { v4: uuid } = require('uuid')

context("Approve Asset", () => {
    beforeEach(() => {
        cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
    })

    const asUser = AsUser()
    context("Verify privilege access to asset detail", () => {
        describe("When user is owner of asset", () => {
            it("Should allowed to access asset detail page", asUser.AccessDetailPageGranted)
        })

        describe("when user isn't owner and it's not apart of signer of the asset", () => {
            it("status asset is published (approved) then allowed to access", asUser.AllowedAccessAsset)
            it("status asset isn't published (temporary) then not allowed to access", asUser.AllowedNotOwnAsset)
        })

        describe("when user is signer", () => {
            it("when asset state is temporary, should allowed to access asset detail", asUser.TemporarySignerAllowed)
            it("when asset state is published, should allowed to access asset detail", asUser.PublishedSignerAllowed)
            it.skip("Should be able access file from IPFS after approve the asset")
        })

    })

    const oneSigner = OneSigner()
    describe("Asset only has one signer", () => {
        it("Should success approve asset and valid data detail", oneSigner.SuccessApprove)
    })

    const multiSigner = MultiSigner()
    describe("Asset has more than one signer", () => {
        it("Should success approve asset and valid data detail", multiSigner.SuccessApprove)
    })

})

function AsUser() {

    return {
        // User as owner
        // Should allowed to access the page
        AccessDetailPageGranted: () => {
            const credential = uuid().toString()

            cy.fixture("owner").then(owner => {
                cy.request("DELETE", `${Cypress.env('API_URL')}/user/${owner.email}`)
                cy.request("POST", `${Cypress.env('API_URL')}/user`, owner)

                cy.login(owner, true)
                cy.request("POST", `${Cypress.env('API_URL')}/asset`, {
                    credential,
                    name: "Cypress asset name",
                    pubkey: owner.pubkey
                })

                cy.wait(2000)
                cy.visit(`/dashboard/credentials/${credential}`)
                cy.get('.container').then(() => {
                    cy.contains('Cypress asset name')
                    cy.contains('owner')
                })
            })

        },

        // Not owner and not signer
        // status asset isn't published (temporary) then allowed to access
        AllowedNotOwnAsset: () => {
            const credential = uuid().toString()

            cy.fixture("user").then(user => {
                cy.request("DELETE", `${Cypress.env('API_URL')}/user/${user.email}`)
                cy.request("POST", `${Cypress.env('API_URL')}/user`, user)

                cy.fixture("owner").then(owner => {
                    cy.login(owner, true)

                    cy.request("POST", `${Cypress.env('API_URL')}/user`, owner)
                    cy.request("POST", `${Cypress.env('API_URL')}/asset`, {
                        credential,
                        name: "Cypress asset name",
                        pubkey: user.pubkey,
                        status: false
                    })

                    cy.wait(2000)
                    cy.visit(`/dashboard/credentials/${credential}`)
                    cy.contains('404 Not Found')
                })

            })

        },

        // Not owner and not signer
        // status asset is published (approved) then allowed to access
        AllowedAccessAsset: () => {
            const credential = uuid().toString()

            cy.fixture("user").then(user => {
                return cy.request("POST", `${Cypress.env('API_URL')}/user`, user)
            }).then(user => {

                cy.fixture("owner").then(owner => {
                    cy.login(owner, true)

                    cy.request("POST", `${Cypress.env('API_URL')}/user`, owner)
                    cy.request("POST", `${Cypress.env('API_URL')}/asset`, {
                        credential,
                        name: "Cypress asset name",
                        pubkey: user.pubkey,
                        status: true
                    })


                    cy.wait(2000)
                    cy.visit(`/dashboard/credentials/${credential}`)
                    cy.contains('Cypress asset name')
                })

            })
        },

        // User is signer
        // When asset as temporary, signer should allowed to access asset
        TemporarySignerAllowed: () => {
            const credential = uuid().toString()
            let user
            let signer
            cy.fixture("user").then(result => {
                user = result
                cy.request("DELETE", `${Cypress.env('API_URL')}/user/${user.email}`)
                cy.request("POST", `${Cypress.env('API_URL')}/user`, result)
                    .then(result => signer = result.body.data)

                cy.login(user, true)

                cy.fixture("owner").then(owner => {
                    cy.request("POST", `${Cypress.env('API_URL')}/user`, owner)
                        .then(result => {
                            owner = result.body.data
                            cy.request("POST", `${Cypress.env('API_URL')}/asset`, {
                                credential,
                                name: "Cypress asset name",
                                pubkey: owner.pubkey,
                                status: false
                            })

                            signer = {
                                credential,
                                email: signer.email,
                                pubkey: signer.pubkey,
                                signed: false,
                                type: 's',
                                owner: owner.id
                            }

                            cy.request("POST", `${Cypress.env('API_URL')}/signer`, signer)

                            cy.wait(2000)
                            cy.visit(`/dashboard/credentials/${credential}`)
                            cy.contains('Cypress asset name')
                        })

                })

            })
        },

        // User is signer
        // When asset as temporary, signer should allowed to access asset
        PublishedSignerAllowed: () => {
            const credential = uuid().toString()
            let user

            cy.fixture("user").then(result => {
                user = result
                return cy.request("POST", `${Cypress.env('API_URL')}/user`, result)
            }).then(result => {
                let signer = result.body.data
                cy.login(user, true)

                cy.fixture("owner").then(owner => {
                    cy.request("POST", `${Cypress.env('API_URL')}/user`, owner)
                        .then(result => {
                            owner = result.body.data
                            cy.request("POST", `${Cypress.env('API_URL')}/asset`, {
                                credential,
                                name: "Cypress asset name",
                                pubkey: owner.pubkey,
                                status: true
                            })

                            signer = {
                                credential,
                                email: signer.email,
                                pubkey: signer.pubkey,
                                signed: false,
                                type: 's',
                                owner: owner.id
                            }

                            cy.request("POST", `${Cypress.env('API_URL')}/signer`, signer)

                            cy.wait(3000)
                            cy.visit(`/dashboard/credentials/${credential}`)
                            cy.contains('Cypress asset name')
                        })

                })

            })
        }

    }

}


function OneSigner() {
    const credential = uuid().toString()
    let cookies
    let signer
    let owner

    return {

        SuccessApprove: () => {

            cy.fixture("owner").then(result => {
                owner = result
                return cy.fixture("user")
            })
                .then(result => signer = result)
                .then(() => {
                    cy.intercept({ method: 'POST', url: '/api/v1/assets/approved' }).as("apiApproveAsset")

                    cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)
                    cy.request("DELETE", `${Cypress.env('API_URL')}/user/${signer.email}`)

                    signer.fullname = "cypress-signer"
                    signer.pubkey = "cypress-signer"
                    cy.request("POST", `${Cypress.env('API_URL')}/user`, signer)

                    cy.login(signer)
                    cy.getCookies().then(result => cookies = result)

                    cy.request("POST", `${Cypress.env('API_URL')}/asset`, {
                        credential,
                        name: "Cypress asset name",
                        pubkey: owner.pubkey,
                        status: false,
                        ipfs: true
                    })

                    cy.request("POST", `${Cypress.env('API_URL')}/signer`, {
                        credential,
                        email: signer.email,
                        pubkey: signer.pubkey,
                        signed: false,
                        type: 's',
                        owner: owner.id
                    }
                    )
                    cy.wait(1000)
                    cy.visit(`/dashboard/credentials/${credential}`)
                    cy.contains("Blockchain Certificate")

                    cy.xpath('//a[text()="Review Document"]').should("be.exist")
                    cy.xpath('//button[text()="Download File"]').should("not.exist")

                    cy.xpath('//button[text()="Sign Document"]').click()
                    cy.get('#signature.modal.show').should("be.exist")

                    cy.get('input[id=passwordTtd]').then(elm => elm.val(signer.password))
                    cy.get('#btnSignature').click()
                    cy.wait("@apiApproveAsset", { timeout: 10000 })

                    cy.get('.swal2-backdrop-show').contains('Success')

                    cy.wait(5000)

                    cy.get('#assetTable tbody tr').first().get('.badge').contains('archived')

                    cy.wait(3000)
                    cy.visit(`/dashboard/credentials/${credential}`)

                    cy.xpath('//dd[contains(text(), "cypress-signer")]').parent().get('.badge').contains('signed')
                    cy.contains('View on Vexanium')

                    cy.xpath('//a[text()="Review Document"]').should("not.exist")
                    cy.xpath('//button[text()="Download File"]').should("not.exist")
                    cy.xpath('//button[text()="Sign Document"]').should("not.exist")

                    cy.contains('Signed by cypress-signer')

                })
        },


    }
}

function MultiSigner() {
    const credential = uuid().toString()
    let cookies
    let signer
    let owner
    let asset = {
        credential,
        name: "Cypress asset name",
        pubkey: null,
        status: false,
        ipfs: true
    }

    return {

        SuccessApprove: () => {
            cy.intercept({ method: 'POST', url: '/api/v1/assets/approved' }).as("apiApproveAsset")
            cy.request("POST", `${Cypress.env('API_URL')}/flush_signer`)
            cy.request("POST", `${Cypress.env('API_URL')}/flush_asset`)

            cy.fixture("owner")
                .then(result => {
                    owner = result
                    return cy.fixture("user")
                })
                .then(result => {
                    signer = result
                    signer.fullname = `cypress-signer1`
                    signer.pubkey = `cypress-signer1`

                    let signer2 = {
                        fullname: "cypress-signer2-user",
                        email: `multi-signer2-cypress@local.host`,
                        password: "adminadmin",
                        pubkey: "multi-cypress-signer2",
                        active: true,
                        activation: true
                    }

                    cy.request("DELETE", `${Cypress.env('API_URL')}/user/${signer.email}`)
                    cy.request("DELETE", `${Cypress.env('API_URL')}/user/${signer2.email}`)

                    cy.request("POST", `${Cypress.env('API_URL')}/asset`, owner)
                    cy.request("POST", `${Cypress.env('API_URL')}/user`, signer)
                    cy.request("POST", `${Cypress.env('API_URL')}/user`, signer2)

                    cy.request("POST", `${Cypress.env('API_URL')}/signer`, {
                        credential,
                        email: signer.email,
                        pubkey: signer.pubkey,
                        signed: false,
                        type: 's',
                        owner: owner.id
                    })

                    cy.request("POST", `${Cypress.env('API_URL')}/signer`, {
                        credential,
                        email: signer2.email,
                        pubkey: signer2.pubkey,
                        signed: true,
                        type: 's',
                        owner: owner.id
                    })


                    asset.pubkey = owner.pubkey
                    cy.request("POST", `${Cypress.env('API_URL')}/asset`, asset)

                    cy.login(signer)
                    cy.getCookies().then(result => cookies = result)
                    cy.visit(`/dashboard/credentials/${credential}`)
                    cy.contains("Blockchain Certificate")

                    cy.xpath('//a[text()="Review Document"]').should("be.exist")
                    cy.xpath('//button[text()="Download File"]').should("not.exist")

                    cy.xpath('//button[text()="Sign Document"]').click()
                    cy.get('#signature.modal.show').should("be.exist")

                    cy.get('input[id=passwordTtd]').then(elm => elm.val(signer.password))
                    cy.get('#btnSignature').click()
                    cy.wait("@apiApproveAsset", { timeout: 10000 })

                    cy.get('.swal2-backdrop-show').contains('Success')

                    cy.get('#assetTable tbody tr', { timeout: 10000 }).first().get('.badge').contains('archived')

                    cy.wait(3000)
                    cy.visit(`/dashboard/credentials/${credential}`)

                    cy.xpath('//dd[contains(text(), "cypress-signer1")]').parent().get('.badge').contains('signed')
                    cy.xpath('//dd[contains(text(), "cypress-signer2")]').parent().get('.badge').contains('signed')
                    cy.contains('View on Vexanium')

                    cy.xpath('//a[text()="Review Document"]').should("not.exist")
                    cy.xpath('//button[text()="Download File"]').should("not.exist")
                    cy.xpath('//button[text()="Sign Document"]').should("not.exist")

                    cy.contains('Signed by cypress-signer1')
                    cy.contains('Signed by cypress-signer2')
                })

        },

    }
}
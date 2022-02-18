

describe("Home", () => {
    it("Should be able to see home page", () => {
        cy.visit("/")
        cy.contains("Use the blockchain to create an immutable record")   
    })

    it("Should be able to access verify page from homepage", () => {
        cy.visit('/')
        cy.get(".navbar-nav .nav-item .nav-link")
            .then(elm => elm[5].click())

        cy.contains("Verification is performed to ensure that the data entered exactly matches the original source.")
    })
})

describe('No Horizontal Scrollbar Test', () => {
  let pages: string[] = []

  before(async () => {
    pages = await new Promise<string[]>((resolve) => {
      cy.task<string[]>('getSitemapUrls', `http://localhost:3002/sitemap.xml`).then(resolve)
    })
    console.log(pages)
  })

  const iosViewports: Cypress.ViewportPreset[] = [
    'iphone-5',
    'iphone-6',
    'iphone-6+',
    'iphone-x',
    'iphone-xr',
    'ipad-2',
    'ipad-mini',
  ]

  it('should not have horizontal scrollbars on any page across iOS viewports', () => {
    pages.forEach((page) => {
      cy.visit(page)
      cy.noHorizontalScrollbar()

      iosViewports.forEach((preset) => {
        cy.viewport(preset)
        cy.noHorizontalScrollbar()
      })
    })
  })

  it('should not have horizontal scrollbars on desktop viewport', () => {
    pages.forEach((page) => {
      cy.visit(page)
      cy.viewport('macbook-15')
      cy.noHorizontalScrollbar()
    })
  })
})

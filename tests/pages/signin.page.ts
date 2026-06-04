import { type Locator, type Page } from '@playwright/test'

export class SignInPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly registerLink: Locator
  readonly forgotPasswordLink: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[type="email"]')
    this.passwordInput = page.locator('input[type="password"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.registerLink = page.getByRole('link', { name: 'Buradan yarat' })
    this.forgotPasswordLink = page.getByRole('link', { name: 'Şifrəni unutmusunuz' })
  }

  async goto() {
    await this.page.goto('/auth/signin')
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}

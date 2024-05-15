const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

describe('Blog app', () => {
    beforeEach(async ({ page, request }) => {
        await request.post('http://localhost:5173/api/testing/reset')
        await request.post('http://localhost:5173/api/users', {
            data: {
                name: 'hi',
                username: 'hello',
                password: 'world'
            }
        })
        await request.post('http://localhost:5173/api/users', {
            data: {
                name: 'hey',
                username: 'hello2',
                password: 'world2'
            }
        })

    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    const usernamelocator = await page.getByTestId('username')
    await expect(usernamelocator).toBeVisible()
    const passwordlocator = await page.getByTestId('password')
    await expect(passwordlocator).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
        await loginWith(page, 'hello', 'world')
  
        await expect(page.getByText('hi logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
        await loginWith(page, 'mluukkai', 'wrong')

        const errorDiv = await page.locator('.error')
        await expect(errorDiv).toContainText('wrong username or password')
        await expect(errorDiv).toHaveCSS('border-style', 'solid')
        await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')
        await expect(page.getByText('Matti Luukkainen logged in')).not.toBeVisible()
    })
  })

  describe('when logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'hello', 'world')
    })
  
    test('a new blog can be created', async ({ page }) => {
        await createBlog(page, 'wow', 'idk', 'maybe')
        await expect(page.getByText('wow idk')).toBeVisible()
    })

    describe('and a blog exists', () => {
        beforeEach(async ({ page }) => {
            await createBlog(page, 'wow', 'idk', 'maybe')
            await createBlog(page, 'woe', 'is', 'me')
            await createBlog(page, 'last', 'one', 'definitely')
        })

        test('blog can be edited', async ({ page }) => {
            await page.pause()
            const blogToEdit = page.locator('text=wow idk').locator('..')
            await blogToEdit.getByRole('button', { name: 'view' }).click()
            await expect(page.getByText('Likes 0')).toBeVisible()
            await blogToEdit.getByRole('button', { name: 'Like' }).click()
            await expect(blogToEdit.getByText('Likes 1')).toBeVisible()
        })

        test('blog can be deleted by the user who added it', async ({ page }) => {
            await page.pause()

            page.on('dialog', async (dialog) => {
                await dialog.accept();
            })
            const blogToDelete = page.locator('text=wow idk').locator('..')
            await blogToDelete.getByRole('button', { name: 'view' }).click()
            await blogToDelete.getByRole('button', { name: 'Delete' }).click()
            await expect(page.getByText('wow idk')).not.toBeVisible()
        })

        test('only user who added blog can see the delete button', async ({ page }) => {
            await page.pause()
            await page.getByRole('button', { name: 'logout' }).click()
            await loginWith(page, 'hello2', 'world2')
            await expect(page.getByText('hey logged in')).toBeVisible()
            const blogToCheck = page.locator('text=wow idk').locator('..')
            await blogToCheck.getByRole('button', { name: 'view' }).click()
            await expect(blogToCheck.getByRole('button', { name: 'Delete' })).not.toBeVisible()
        })
    })
})
})
import { expect, test } from '@playwright/test';

const APP_URL = process.env.E2E_BASE_URL?.trim() || 'http://localhost:8080';

test.describe('Back-Office User & Session Management E2E', () => {
  const uniqueId = Date.now();

  const operator = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: `ada.${uniqueId}@example.com`,
    password: 'Password123!',
  };

  const managedUser = {
    firstName: 'Grace',
    lastName: 'Hopper',
    email: `grace.${uniqueId}@example.com`,
    updatedEmail: `grace.updated.${uniqueId}@example.com`,
    password: 'Password123!',
  };

  test('enforces auth redirects, user CRUD, inactive name-lock, theme persistence, and logout to /signin', async ({
    page,
  }) => {
    // 1. Fresh unauthenticated visitor accessing /users redirects to /signup
    await page.goto(`${APP_URL}/users`);
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();

    // 2. Register new operator -> redirects to /users with personalized greeting
    await page.getByLabel(/first name/i).fill(operator.firstName);
    await page.getByLabel(/last name/i).fill(operator.lastName);
    await page.getByLabel(/email/i).fill(operator.email);
    await page.getByLabel(/^password/i).fill(operator.password);
    await page.getByLabel(/confirm password/i).fill(operator.password);
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByText(`Hello ${operator.firstName}`)).toBeVisible();

    // 3. Create a new managed user via UserFormModal
    await page.getByRole('button', { name: 'New User' }).click();
    const createDialog = page.getByRole('dialog');
    await expect(createDialog.getByRole('heading', { name: 'Create User' })).toBeVisible();

    await createDialog.getByLabel('First Name').fill(managedUser.firstName);
    await createDialog.getByLabel('Last Name').fill(managedUser.lastName);
    await createDialog.getByLabel('Email').fill(managedUser.email);
    await createDialog.getByLabel('Password').fill(managedUser.password);
    await createDialog.getByRole('button', { name: 'Create' }).click();

    await expect(createDialog).toBeHidden();
    const userRow = page.getByRole('row', { name: new RegExp(managedUser.email, 'i') });
    await expect(userRow).toBeVisible();
    await expect(userRow).toContainText(`${managedUser.firstName} ${managedUser.lastName}`);

    // 4. Deactivate the managed user -> verify inactive name-lock in Edit User modal
    await userRow.getByRole('button', { name: /edit/i }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog.getByRole('heading', { name: 'Edit User' })).toBeVisible();

    await editDialog.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Inactive', exact: true }).click();
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();
    await expect(editDialog).toBeHidden();

    // Re-open Edit modal for the now-inactive user and verify First/Last Name are locked
    const inactiveRow = page.getByRole('row', { name: new RegExp(managedUser.email, 'i') });
    await inactiveRow.getByRole('button', { name: /edit/i }).click();

    const lockedDialog = page.getByRole('dialog');
    await expect(lockedDialog.getByLabel('First Name')).toBeDisabled();
    await expect(lockedDialog.getByLabel('Last Name')).toBeDisabled();
    await expect(lockedDialog.getByLabel('Email')).toBeEnabled();

    // Email remains editable while inactive
    await lockedDialog.getByLabel('Email').fill(managedUser.updatedEmail);
    await lockedDialog.getByRole('button', { name: 'Save Changes' }).click();
    await expect(lockedDialog).toBeHidden();
    await expect(
      page.getByRole('row', { name: new RegExp(managedUser.updatedEmail, 'i') }),
    ).toBeVisible();

    // 5. Delete the managed user via DeleteUserDialog
    const updatedRow = page.getByRole('row', {
      name: new RegExp(managedUser.updatedEmail, 'i'),
    });
    await updatedRow.getByRole('button', { name: /delete/i }).click();

    const deleteDialog = page.getByRole('dialog');
    await expect(deleteDialog).toContainText(managedUser.updatedEmail);
    await deleteDialog.getByRole('button', { name: 'Delete' }).click();
    await expect(deleteDialog).toBeHidden();
    await expect(page.getByText(managedUser.updatedEmail)).toHaveCount(0);

    // 6. Toggle dark theme and verify persistence across browser reload
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
    await expect(page.getByText(`Hello ${operator.firstName}`)).toBeVisible();

    // 7. Log Out -> terminates session and navigates to /signin (NOT /signup)
    await page.getByRole('button', { name: 'Log Out' }).click();
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    // 8. Inactive user is blocked from signing in
    await page.getByLabel('Email').fill(managedUser.updatedEmail);
    await page.getByLabel('Password').fill(managedUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/signin$/);

    // 9. Active operator signs back in via /signin -> returns to /users
    await page.getByLabel('Email').fill(operator.email);
    await page.getByLabel('Password').fill(operator.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByText(`Hello ${operator.firstName}`)).toBeVisible();
  });
});

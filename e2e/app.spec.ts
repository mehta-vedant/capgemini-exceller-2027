import { expect, test } from '@playwright/test';

test('dashboard and quiz flow work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Prepare by doing.' })).toBeVisible();
  await page.getByRole('link', { name: 'AI', exact: true }).click();
  await expect(page.getByRole('heading', { name: /AI Literacy/ })).toBeVisible();
  await page.locator('.options button').first().click();
  await expect(page.getByText(/Key concept:/)).toBeVisible();
});

test('switching modules resets the quiz to that module bank', async ({ page }) => {
  await page.goto('/module/ai');
  await expect(page.getByText('172 typed practice questions, including research-informed original scenarios.')).toBeVisible();
  await page.locator('.options button').first().click();
  await expect(page.getByText(/Key concept:/)).toBeVisible();
  await page.getByRole('link', { name: 'Technical', exact: true }).click();
  await expect(page).toHaveURL(/\/module\/technical$/);
  await expect(page.getByText('154 typed practice questions, including research-informed original scenarios.')).toBeVisible();
  await expect(page.getByText(/Key concept:/)).toHaveCount(0);
});

test('changing a mock preset resets its preview', async ({ page }) => {
  await page.goto('/mocks');
  await page.locator('.options button').first().click();
  await expect(page.getByText(/Key concept:/)).toBeVisible();
  await page.getByRole('button', { name: /AI Literacy/ }).click();
  await expect(page.getByText(/Key concept:/)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Question 1 of 20' })).toBeVisible();
});

test('debugging lab presents formatted editor and test controls', async ({ page }) => {
  await page.goto('/debugging');
  await expect(page.getByText(/Public tests \(/)).toBeVisible();
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: /Run .* public test/ })).toBeVisible();
  await expect(page.getByText(/hidden validation case/)).toBeVisible();
});

test('Pro Mode dark theme toggle works and persists across navigation', async ({ page }) => {
  await page.goto('/pro');
  const toggle = page.getByRole('button', { name: /Dark mode|Light mode/ });
  await expect(toggle).toBeVisible();

  // If not dark, toggle to dark mode
  const isDark = await page.evaluate(() => document.documentElement.dataset.theme === 'dark');
  if (!isDark) {
    await toggle.click();
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: /AI, ML, DL/ })).toBeVisible();
  await page.screenshot({ path: 'dark-pro-dashboard.png', fullPage: true });

  // Visit curriculum
  await page.goto('/curriculum');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'A full academy, not thirty links.' })).toBeVisible();
  await page.screenshot({ path: 'dark-pro-curriculum.png', fullPage: true });

  // Visit Daily Studio
  await page.goto('/learn/1');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByText('VISUAL MODEL')).toBeVisible();
  await expect(page.getByText('DECISION CHECKPOINT')).toBeVisible();
  await expect(page.getByText('GRADED SCENARIO')).toBeVisible();
  await page.screenshot({ path: 'dark-pro-daily-studio.png', fullPage: true });

  // Visit Intel
  await page.goto('/assessment-pattern');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'Signals with boundaries.' })).toBeVisible();
  await page.screenshot({ path: 'dark-pro-intel.png', fullPage: true });

  // Visit Analytics
  await page.goto('/analytics');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'Evidence, not theatre.' })).toBeVisible();
  await page.screenshot({ path: 'dark-pro-signals.png', fullPage: true });

  // Visit Settings
  await page.goto('/settings');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('heading', { name: 'Tailor Pro Mode.' })).toBeVisible();
  await page.screenshot({ path: 'dark-pro-settings.png', fullPage: true });

  // Toggle back to light mode to ensure bidirectional toggle works
  const switchBack = page.getByRole('button', { name: /Light mode/ });
  await switchBack.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('reference solution becomes available after a public attempt', async ({ page }) => {
  await page.goto('/debugging');
  const reveal = page.getByRole('button', { name: 'Reveal reference solution' });
  await expect(reveal).toBeDisabled();
  await page.getByRole('button', { name: /Run .* public test/ }).click();
  await expect(reveal).toBeEnabled({ timeout: 20000 });
  await reveal.click();
  await expect(page.locator('.terminal')).toContainText('Reference solution');
});

test('imported research question is searchable in the live UI', async ({ page }) => {
  await page.goto('/explorer');
  await page.getByLabel('Search questions').fill('classify emails as urgent or normal');
  await expect(page.getByText('A support team needs a model to classify emails as urgent or normal rather than write replies. Which modeling objective fits best?')).toBeVisible();
});

test('independent research bank has its own focused practice page', async ({ page }) => {
  await page.goto('/research-bank');
  await expect(page.getByRole('heading', { name: 'Reddit & Glassdoor-informed practice.' })).toBeVisible();
  await expect(page.getByText(/88 original scenario questions/)).toBeVisible();
  await expect(page.getByText(/candidate-reported context/)).toBeVisible();
});

test('Pro Mode connects a complete daily unit to roadmap and persisted blocks', async ({ page }) => {
  await page.goto('/pro');
  await expect(page.getByRole('heading', { name: 'AI, ML, DL and the learning loop' })).toBeVisible();
  await page.getByRole('link', { name: 'Roadmap', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A full academy, not thirty links.' })).toBeVisible();
  await page.getByRole('link', { name: /AI, ML, DL and the learning loop/ }).click();
  await expect(page.getByRole('heading', { name: 'AI, ML, DL and the learning loop' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark studied' }).first()).toBeVisible();
  await expect(page.getByText('GUIDED CASE', { exact: true })).toBeVisible();
  await expect(page.getByText('DECISION CHECKPOINT', { exact: true })).toBeVisible();
  await expect(page.getByText('GRADED SCENARIO', { exact: true })).toBeVisible();
  await page.locator('.scenario-options button').first().click();
  await expect(page.getByText('Saved to your local performance signals.')).toBeVisible();
});

test('a studio session persists its graded checkpoint and daily completion', async ({ page }) => {
  await page.goto('/learn/6');
  for (let completed = 1; completed <= 3; completed += 1) {
    await page.getByRole('button', { name: 'Mark studied' }).first().click();
    await expect(page.getByRole('button', { name: 'Completed' })).toHaveCount(completed);
  }
  await page.locator('.scenario-options button').first().click();
  const complete = page.getByRole('button', { name: /Complete day and continue/ });
  await expect(complete).toBeEnabled();
  await complete.click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Day complete' })).toBeVisible();
});

test('assessment intelligence and mock setup state their boundaries', async ({ page }) => {
  await page.goto('/assessment-pattern');
  await expect(page.getByRole('heading', { name: 'Signals with boundaries.' })).toBeVisible();
  await expect(page.getByText(/remains unexpanded/)).toBeVisible();
  await page.goto('/mock-test');
  await expect(page.getByRole('heading', { name: '40 original questions. One focused run.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start timed mock/ })).toBeVisible();
});

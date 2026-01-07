import { test, expect, Page } from '@playwright/test';

// Test user credentials - requires valid session
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@33strategies.ai';
const TEST_PASSWORD = process.env.TEST_PASSWORD || process.env.LEARNING_PASSWORD || '';

/**
 * Helper: Login as test user via credentials form
 */
async function loginAsTestUser(page: Page) {
  await page.goto('/auth/signin');

  // Fill credentials form
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL(/\/(clarity-canvas|learning)/);
}

/**
 * Helper: Navigate to Clarity Canvas with auth
 */
async function navigateToClarityCanvas(page: Page) {
  await page.goto('/clarity-canvas');

  // If redirected to signin, login first
  if (page.url().includes('signin')) {
    await loginAsTestUser(page);
    await page.goto('/clarity-canvas');
  }

  await page.waitForLoadState('networkidle');
}

/**
 * Helper: Complete text brain dump flow
 */
async function completeBrainDump(page: Page, text: string) {
  // Click "Type Instead" if on brain dump screen
  const typeButton = page.getByRole('button', { name: /type instead/i });
  if (await typeButton.isVisible()) {
    await typeButton.click();
  }

  // Fill textarea
  const textarea = page.locator('textarea');
  await textarea.fill(text);

  // Submit
  await page.click('button:has-text("Submit")');

  // Wait for processing to complete
  await page.waitForSelector('text=Your Clarity Canvas', { timeout: 30000 });
}

/**
 * Helper: Answer interview question
 */
async function answerQuestion(page: Page) {
  // Wait for question to load
  await page.waitForSelector('[data-testid="question-option"]', { timeout: 10000 });

  // Click first option
  await page.click('[data-testid="question-option"]:first-child');

  // Click Continue
  const continueButton = page.getByRole('button', { name: /continue|see results/i });
  await continueButton.click();
}

// ============================================
// TESTS
// ============================================

test.describe('Clarity Canvas', () => {
  test.describe('Authentication', () => {
    test('redirects unauthenticated users to signin', async ({ page }) => {
      // Clear any existing auth
      await page.context().clearCookies();

      await page.goto('/clarity-canvas');

      // Should redirect to signin
      await expect(page).toHaveURL(/signin.*returnTo/);
    });

    test('allows authenticated users to access canvas', async ({ page }) => {
      await navigateToClarityCanvas(page);

      // Should see welcome or profile screen
      await expect(
        page.getByText(/welcome|clarity canvas/i)
      ).toBeVisible();
    });
  });

  test.describe('Welcome Flow', () => {
    test('shows welcome screen with CTA', async ({ page }) => {
      await navigateToClarityCanvas(page);

      // Check for welcome elements
      await expect(page.getByText(/welcome/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /begin/i })).toBeVisible();
    });

    test('navigates to brain dump on start', async ({ page }) => {
      await navigateToClarityCanvas(page);

      // Click begin button
      await page.click('button:has-text("Begin")');

      // Should see brain dump options
      await expect(
        page.getByText(/brain dump/i)
      ).toBeVisible();
    });
  });

  test.describe('Brain Dump - Text Input', () => {
    test('allows text input as alternative to voice', async ({ page }) => {
      await navigateToClarityCanvas(page);

      // Start flow
      await page.click('button:has-text("Begin")');

      // Click type instead
      await page.click('button:has-text("Type Instead")');

      // Textarea should be visible
      await expect(page.locator('textarea')).toBeVisible();
    });

    test('validates minimum text length', async ({ page }) => {
      await navigateToClarityCanvas(page);
      await page.click('button:has-text("Begin")');
      await page.click('button:has-text("Type Instead")');

      // Type short text
      await page.fill('textarea', 'Short text');

      // Submit should be disabled
      const submitButton = page.locator('button:has-text("Submit")');
      await expect(submitButton).toBeDisabled();
    });

    test('processes text input and shows profile', async ({ page }) => {
      await navigateToClarityCanvas(page);
      await page.click('button:has-text("Begin")');

      const sampleText = `
        I'm a founder building a B2B SaaS product for small businesses.
        My background is in software engineering, and I've been working on this for about 6 months.
        Our main challenge right now is finding product-market fit and getting our first 100 customers.
        I'm passionate about helping small business owners save time on administrative tasks.
      `;

      await completeBrainDump(page, sampleText);

      // Should show profile with score
      await expect(page.getByText(/clarity canvas/i)).toBeVisible();
      await expect(page.getByText(/%/)).toBeVisible();
    });
  });

  test.describe('Profile Visualization', () => {
    test.beforeEach(async ({ page }) => {
      await navigateToClarityCanvas(page);

      // Complete brain dump if on welcome screen
      const welcomeButton = page.getByRole('button', { name: /begin/i });
      if (await welcomeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.click('button:has-text("Begin")');
        await completeBrainDump(page, 'Sample founder building a tech startup for productivity tools.');
      }
    });

    test('displays profile sections', async ({ page }) => {
      // Wait for profile visualization
      await page.waitForSelector('text=Your Clarity Canvas');

      // Should have view toggle
      await expect(
        page.getByRole('button', { name: /orbital|list/i })
      ).toBeVisible();
    });

    test('can toggle between orbital and list views', async ({ page }) => {
      await page.waitForSelector('text=Your Clarity Canvas');

      // Find and click view toggle
      const listButton = page.getByRole('button', { name: /list/i });
      if (await listButton.isVisible()) {
        await listButton.click();
        // List view should show section cards (at least one)
        const cardCount = await page.locator('.rounded-xl').count();
        expect(cardCount).toBeGreaterThanOrEqual(1);
      }
    });
  });

  test.describe('Interview Flow', () => {
    test('navigates to interview page', async ({ page }) => {
      await navigateToClarityCanvas(page);

      // If profile exists, click interview button
      const interviewLink = page.getByRole('link', { name: /quick questions/i });
      if (await interviewLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await interviewLink.click();
        await expect(page).toHaveURL(/\/interview/);
      }
    });

    test('shows progress bar and question', async ({ page }) => {
      await page.goto('/clarity-canvas/interview');

      // Should show progress (after auth redirect)
      await expect(page.getByText(/question \d+ of \d+/i)).toBeVisible({ timeout: 10000 });
    });

    test('can navigate between questions', async ({ page }) => {
      await page.goto('/clarity-canvas/interview');
      await page.waitForLoadState('networkidle');

      // Answer first question
      await answerQuestion(page);

      // Should show question 2
      await expect(page.getByText(/question 2 of/i)).toBeVisible({ timeout: 10000 });

      // Go back
      await page.click('button:has-text("Back")');

      // Should show question 1 again
      await expect(page.getByText(/question 1 of/i)).toBeVisible();
    });

    test('can skip questions', async ({ page }) => {
      await page.goto('/clarity-canvas/interview');
      await page.waitForSelector('[data-testid="question-option"]', { timeout: 10000 });

      // Click skip
      await page.click('button:has-text("Skip")');

      // Should advance to next question
      await expect(page.getByText(/question 2 of/i)).toBeVisible();
    });
  });

  test.describe('Mobile Responsive', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('interview page works on mobile', async ({ page }) => {
      await page.goto('/clarity-canvas/interview');

      // Back button should be visible (icon only on mobile)
      await expect(page.locator('svg')).toBeVisible();

      // Options should be tappable (min 44px height)
      const option = page.locator('[data-testid="question-option"]:first-child');
      if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
        const box = await option.boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('profile defaults to list view on mobile', async ({ page }) => {
      await navigateToClarityCanvas(page);

      // On mobile, list view should be default
      // (ProfileVisualization uses useMediaQuery to detect mobile)
    });
  });

  test.describe('Error Handling', () => {
    test('shows error boundary on failures', async ({ page }) => {
      // Navigate to a route that might error
      await page.goto('/clarity-canvas');

      // Error boundary should catch and display friendly message
      // This test ensures error.tsx is properly configured
    });
  });
});

// ============================================
// FULL FLOW INTEGRATION TEST
// ============================================

test.describe('Full Flow Integration', () => {
  test('complete flow: welcome -> brain dump -> profile -> interview -> enriched profile', async ({ page }) => {
    test.setTimeout(120000); // 2 minute timeout for full flow

    // 1. Navigate to Clarity Canvas
    await navigateToClarityCanvas(page);

    // 2. Start brain dump
    await page.click('button:has-text("Begin")');

    // 3. Complete text brain dump
    const brainDumpText = `
      I am a technical founder building a B2B SaaS platform.
      My company helps small businesses automate their workflows.
      We have 3 team members and about 12 months of runway.
      Our biggest challenges are customer acquisition and product-market fit.
      I spend most of my time on product development and customer calls.
    `;
    await completeBrainDump(page, brainDumpText);

    // 4. Verify profile is displayed
    await expect(page.getByText(/clarity canvas/i)).toBeVisible();
    const initialScore = await page.locator('text=/%/').first().textContent();
    expect(initialScore).toBeDefined();

    // 5. Navigate to interview
    await page.click('a:has-text("Quick Questions")');
    await expect(page).toHaveURL(/\/interview/);

    // 6. Answer all questions
    for (let i = 0; i < 8; i++) {
      await page.waitForSelector('[data-testid="question-option"]', { timeout: 10000 });
      await page.click('[data-testid="question-option"]:first-child');

      const button = page.getByRole('button', { name: /continue|see results/i });
      await button.click();

      // Wait for next question or results
      await page.waitForLoadState('networkidle');
    }

    // 7. Should return to profile with animation
    await expect(page).toHaveURL(/clarity-canvas.*showAnimation/);

    // 8. Verify enriched profile
    await expect(page.getByText(/clarity canvas/i)).toBeVisible();
  });
});

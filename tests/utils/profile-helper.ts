import { Page, expect } from '@playwright/test';
import { MainLayoutPage } from '../page-objects/main-layout-page';
import { APIHelper } from './api-helper';
import { AuthHelper } from './auth-helper';
import { JSON_SAMPLES } from '../fixtures/json-samples';
import { TEST_USERS } from '../fixtures/users';

export interface ProfileTestData {
  documents: Array<{
    content: any;
    title: string;
    description?: string;
    tags?: string[];
    category?: string;
  }>;
  publishedCount?: number;
}

export interface UsageStats {
  totalDocuments: number;
  publishedDocuments: number;
  storageUsed: string;
  memberSince: string;
}

export interface ExportOptions {
  format?: 'json' | 'csv';
  confirm?: boolean;
}

export class ProfileHelper {
  public readonly page: Page;
  public readonly layoutPage: MainLayoutPage;
  public readonly authHelper: AuthHelper;
  public readonly apiHelper: APIHelper;

  constructor(
    page: Page,
    layoutPage: MainLayoutPage,
    authHelper: AuthHelper,
    apiHelper: APIHelper
  ) {
    this.page = page;
    this.layoutPage = layoutPage;
    this.authHelper = authHelper;
    this.apiHelper = apiHelper;
  }

  /**
   * Common pattern: Setup authenticated user with test data
   */
  async setupUserWithData(
    userType: keyof typeof TEST_USERS = 'regular',
    testData?: ProfileTestData
  ): Promise<void> {
    // Login
    await this.authHelper.login(userType);
    expect(await this.layoutPage.isLoggedIn()).toBe(true);

    // Create test data if provided
    if (testData) {
      await this.createTestData(testData);
    }
  }

  /**
   * Common pattern: Create test documents and published content
   */
  private async createTestData(testData: ProfileTestData): Promise<void> {
    let publishedCount = 0;
    const targetPublishedCount = testData.publishedCount || 1;

    for (const doc of testData.documents) {
      const uploadResult = await this.apiHelper.uploadJSON(doc.content, doc);

      // Publish some documents to reach target count
      if (publishedCount < targetPublishedCount) {
        await this.apiHelper.publishJSON(uploadResult.id);
        publishedCount++;
      }
    }
  }

  /**
   * Common pattern: Navigate to profile and verify it loads
   */
  async goToProfileAndVerify(): Promise<boolean> {
    await this.layoutPage.goToProfile();

    try {
      await expect(this.layoutPage.page.locator('[data-testid="profile-page"]')).toBeVisible();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Common pattern: Get user profile information
   */
  async getUserProfileInfo(): Promise<{ email: string; name: string } | null> {
    if (!(await this.goToProfileAndVerify())) {
      return null;
    }

    const userEmail = this.layoutPage.page.locator('[data-testid="user-email"]');
    const userName = this.layoutPage.page.locator('[data-testid="user-name"]');

    if ((await userEmail.isVisible()) && (await userName.isVisible())) {
      return {
        email: (await userEmail.textContent()) || '',
        name: (await userName.textContent()) || '',
      };
    }

    return null;
  }

  /**
   * Common pattern: Get usage statistics from profile
   */
  async getUsageStatistics(): Promise<Partial<UsageStats>> {
    if (!(await this.goToProfileAndVerify())) {
      return {};
    }

    const stats: Partial<UsageStats> = {};

    // Get total documents
    const totalDocs = this.layoutPage.page.locator('[data-testid="total-documents"]');
    if (await totalDocs.isVisible()) {
      const docsText = await totalDocs.textContent();
      const count = parseInt(docsText?.match(/\d+/)?.[0] || '0');
      stats.totalDocuments = count;
    }

    // Get published documents
    const publishedDocs = this.layoutPage.page.locator('[data-testid="published-documents"]');
    if (await publishedDocs.isVisible()) {
      const pubText = await publishedDocs.textContent();
      const published = parseInt(pubText?.match(/\d+/)?.[0] || '0');
      stats.publishedDocuments = published;
    }

    // Get storage usage
    const storageUsed = this.layoutPage.page.locator('[data-testid="storage-used"]');
    if (await storageUsed.isVisible()) {
      stats.storageUsed = (await storageUsed.textContent()) || '';
    }

    // Get member since date
    const memberSince = this.layoutPage.page.locator('[data-testid="member-since"]');
    if (await memberSince.isVisible()) {
      stats.memberSince = (await memberSince.textContent()) || '';
    }

    return stats;
  }

  /**
   * Common pattern: Check activity timeline
   */
  async getActivityTimeline(): Promise<Array<{ action: string; timestamp: string }>> {
    if (!(await this.goToProfileAndVerify())) {
      return [];
    }

    const activities: Array<{ action: string; timestamp: string }> = [];
    const activitySection = this.layoutPage.page.locator(
      '[data-testid="activity-timeline"], .activity-section'
    );

    if (await activitySection.isVisible()) {
      const activityItems = this.layoutPage.page.locator('[data-testid="activity-item"]');
      const count = await activityItems.count();

      for (let i = 0; i < count; i++) {
        const item = activityItems.nth(i);
        const action = (await item.textContent()) || '';
        const timestamp =
          (await item.locator('[data-testid="activity-timestamp"]').textContent()) || '';

        activities.push({ action, timestamp });
      }
    }

    return activities;
  }

  /**
   * Common pattern: Export user data
   */
  async exportUserData(
    options: ExportOptions = {}
  ): Promise<{ filename: string; success: boolean; error?: string }> {
    if (!(await this.goToProfileAndVerify())) {
      return { filename: '', success: false, error: 'Could not navigate to profile' };
    }

    try {
      // Find export button
      const exportButton = this.layoutPage.page
        .locator('[data-testid="export-data"]')
        .or(this.layoutPage.page.locator('button:has-text("Export")'));
      await expect(exportButton).toBeVisible();

      // Handle different export formats
      if (options.format && options.format !== 'json') {
        const exportOptions = this.layoutPage.page.locator('[data-testid="export-options"]');
        if (await exportOptions.isVisible()) {
          await exportOptions.click();
          const formatButton = this.layoutPage.page.locator(
            `[data-testid="export-${options.format}"]`
          );
          if (await formatButton.isVisible()) {
            const downloadPromise = this.layoutPage.page.waitForEvent('download');
            await formatButton.click();
            const download = await downloadPromise;
            return { filename: download.suggestedFilename(), success: true };
          }
        }
      }

      // Handle confirmation dialog if needed
      let downloadPromise = this.layoutPage.page.waitForEvent('download');
      await exportButton.click();

      const exportDialog = this.layoutPage.page.locator('[data-testid="export-confirmation"]');
      if (await exportDialog.isVisible()) {
        if (options.confirm === false) {
          const cancelExport = this.layoutPage.page.locator('[data-testid="cancel-export"]');
          await cancelExport.click();
          return { filename: '', success: false, error: 'Export cancelled' };
        } else {
          const confirmExport = this.layoutPage.page.locator('[data-testid="confirm-export"]');
          downloadPromise = this.layoutPage.page.waitForEvent('download');
          await confirmExport.click();
        }
      }

      const download = await downloadPromise;
      return { filename: download.suggestedFilename(), success: true };
    } catch (error) {
      return { filename: '', success: false, error: (error as Error).message };
    }
  }

  /**
   * Common pattern: Delete account workflow
   */
  async initiateAccountDeletion(): Promise<{
    success: boolean;
    confirmationRequired: boolean;
    error?: string;
  }> {
    if (!(await this.goToProfileAndVerify())) {
      return {
        success: false,
        confirmationRequired: false,
        error: 'Could not navigate to profile',
      };
    }

    try {
      const deleteAccountButton = this.layoutPage.page
        .locator('[data-testid="delete-account"]')
        .or(this.layoutPage.page.locator('button:has-text("Delete Account")'));

      if (!(await deleteAccountButton.isVisible())) {
        return {
          success: false,
          confirmationRequired: false,
          error: 'Delete account button not found',
        };
      }

      await deleteAccountButton.click();

      const deleteDialog = this.layoutPage.page.locator('[data-testid="delete-account-dialog"]');
      if (await deleteDialog.isVisible()) {
        return { success: true, confirmationRequired: true };
      }

      return {
        success: false,
        confirmationRequired: false,
        error: 'Delete confirmation dialog not found',
      };
    } catch (error) {
      return { success: false, confirmationRequired: false, error: (error as Error).message };
    }
  }

  /**
   * Common pattern: Complete account deletion with confirmation
   */
  async completeAccountDeletion(
    confirmationText: string = 'DELETE',
    email?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const deleteDialog = this.layoutPage.page.locator('[data-testid="delete-account-dialog"]');

      // Fill confirmation text
      const confirmationInput = this.layoutPage.page.locator(
        '[data-testid="delete-confirmation-input"]'
      );
      if (await confirmationInput.isVisible()) {
        await confirmationInput.fill(confirmationText);
      }

      // Fill email confirmation if required
      if (email) {
        const emailConfirmation = this.layoutPage.page.locator(
          '[data-testid="email-confirmation"]'
        );
        if (await emailConfirmation.isVisible()) {
          await emailConfirmation.fill(email);
        }
      }

      // Handle published documents options
      await this.handlePublishedContentOptions();

      // Confirm deletion
      const confirmDeleteButton = this.layoutPage.page.locator(
        '[data-testid="confirm-delete-account"]'
      );
      await confirmDeleteButton.click();

      // Wait for deletion to complete
      await this.layoutPage.page.waitForURL('**/', { timeout: 15000 });

      const isLoggedOut = !(await this.layoutPage.isLoggedIn());
      if (isLoggedOut) {
        // Check for success notification
        try {
          await this.layoutPage.waitForNotification('Account deleted successfully');
          return { success: true };
        } catch {
          return { success: true }; // Account deleted even without notification
        }
      }

      return { success: false, error: 'Account deletion did not complete' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Handle published content options during account deletion
   */
  private async handlePublishedContentOptions(): Promise<void> {
    const publishedOptions = this.layoutPage.page.locator(
      '[data-testid="published-content-options"]'
    );
    if (await publishedOptions.isVisible()) {
      // Default to keeping published content anonymous
      const keepPublished = this.layoutPage.page.locator(
        '[data-testid="keep-published-anonymous"]'
      );
      if (await keepPublished.isVisible()) {
        await keepPublished.check();
      }
    }
  }

  /**
   * Common pattern: Update profile information
   */
  async updateProfile(updates: {
    name?: string;
    bio?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!(await this.goToProfileAndVerify())) {
      return { success: false, error: 'Could not navigate to profile' };
    }

    try {
      const editProfileButton = this.layoutPage.page.locator('[data-testid="edit-profile"]');
      if (await editProfileButton.isVisible()) {
        await editProfileButton.click();

        const profileForm = this.layoutPage.page.locator('[data-testid="profile-form"]');
        await expect(profileForm).toBeVisible();

        // Update name
        if (updates.name) {
          const nameInput = this.layoutPage.page.locator('[data-testid="profile-name"]');
          if (await nameInput.isVisible()) {
            await nameInput.clear();
            await nameInput.fill(updates.name);
          }
        }

        // Update bio
        if (updates.bio) {
          const bioInput = this.layoutPage.page.locator('[data-testid="profile-bio"]');
          if (await bioInput.isVisible()) {
            await bioInput.fill(updates.bio);
          }
        }

        // Save changes
        const saveProfileButton = this.layoutPage.page.locator('[data-testid="save-profile"]');
        await saveProfileButton.click();

        await this.layoutPage.waitForNotification('Profile updated');
        return { success: true };
      }

      return { success: false, error: 'Edit profile button not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Common pattern: Update notification preferences
   */
  async updateNotificationPreferences(preferences: {
    emailNotifications?: boolean;
    marketingEmails?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    if (!(await this.goToProfileAndVerify())) {
      return { success: false, error: 'Could not navigate to profile' };
    }

    try {
      const notificationSettings = this.layoutPage.page.locator(
        '[data-testid="notification-settings"]'
      );
      if (await notificationSettings.isVisible()) {
        if (preferences.emailNotifications !== undefined) {
          const emailNotifications = this.layoutPage.page.locator(
            '[data-testid="email-notifications"]'
          );
          if (await emailNotifications.isVisible()) {
            const isEnabled = await emailNotifications.isChecked();
            if (isEnabled !== preferences.emailNotifications) {
              await emailNotifications.click();
            }
          }
        }

        if (preferences.marketingEmails !== undefined) {
          const marketingEmails = this.layoutPage.page.locator('[data-testid="marketing-emails"]');
          if (await marketingEmails.isVisible()) {
            const isEnabled = await marketingEmails.isChecked();
            if (isEnabled !== preferences.marketingEmails) {
              await marketingEmails.click();
            }
          }
        }

        // Save preferences
        const saveNotifications = this.layoutPage.page.locator(
          '[data-testid="save-notifications"]'
        );
        if (await saveNotifications.isVisible()) {
          await saveNotifications.click();
          await this.layoutPage.waitForNotification('Preferences updated');
        }

        return { success: true };
      }

      return { success: false, error: 'Notification settings not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Common pattern: Clean up after profile tests
   */
  async cleanup(): Promise<void> {
    try {
      await this.authHelper.logout();
    } catch (error) {
      console.warn('Profile cleanup error:', error);
    }
  }

  /**
   * Generate standard test data for profile tests
   */
  generateStandardTestData(documentCount: number = 3): ProfileTestData {
    return {
      documents: [
        {
          content: JSON_SAMPLES.simple.content,
          title: 'Profile Test Document 1',
          category: 'Test Data',
        },
        {
          content: JSON_SAMPLES.nested.content,
          title: 'Profile Test Document 2',
          category: 'Example',
        },
        {
          content: JSON_SAMPLES.configuration.content,
          title: 'Profile Test Document 3',
          category: 'Configuration',
        },
      ].slice(0, documentCount),
      publishedCount: 1,
    };
  }
}

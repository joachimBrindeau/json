import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class LibraryPage extends BasePage {
  // Navigation tabs
  readonly personalLibraryTab: Locator;
  readonly publicLibraryTab: Locator;

  // Content areas
  readonly libraryContainer: Locator;
  readonly jsonItemsList: Locator;
  readonly emptyState: Locator;

  // JSON items
  readonly jsonItems: Locator;
  readonly jsonTitles: Locator;
  readonly jsonDates: Locator;
  readonly jsonSizes: Locator;
  readonly jsonTypes: Locator;

  // Item actions
  readonly viewButtons: Locator;
  readonly editButtons: Locator;
  readonly shareButtons: Locator;
  readonly deleteButtons: Locator;
  readonly publishButtons: Locator;

  // Filters and search
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly sortDropdown: Locator;
  readonly dateFilter: Locator;
  readonly typeFilter: Locator;

  // Pagination
  readonly pagination: Locator;
  readonly prevPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly pageNumbers: Locator;
  readonly itemsPerPageSelect: Locator;

  // Create/Upload new JSON
  readonly createNewButton: Locator;
  readonly uploadButton: Locator;
  readonly quickUploadArea: Locator;

  // Statistics and info
  readonly totalCount: Locator;
  readonly storageUsed: Locator;
  readonly lastUpdated: Locator;

  constructor(page: Page) {
    super(page);

    // Tabs
    this.personalLibraryTab = page
      .locator('[data-testid="personal-library-tab"]')
      .or(page.locator('text="My Library"'));
    this.publicLibraryTab = page
      .locator('[data-testid="public-library-tab"]')
      .or(page.locator('text="Library"'));

    // Main content
    this.libraryContainer = page.locator('[data-testid="library-container"]');
    this.jsonItemsList = page.locator('[data-testid="json-items-list"]');
    this.emptyState = page.locator('[data-testid="empty-state"]').or(page.locator('.empty-state'));

    // JSON items (support both saved documents table rows and library cards)
    this.jsonItems = page.locator(
      '[data-testid="json-item"], .json-item, [data-testid="library-card"], .library-card'
    );
    this.jsonTitles = page.locator(
      '[data-testid="json-title"], .json-title, [data-testid="card-title"], .card-title'
    );
    this.jsonDates = page.locator('[data-testid="json-date"], .json-date');
    this.jsonSizes = page.locator('[data-testid="json-size"], .json-size');
    this.jsonTypes = page.locator('[data-testid="json-type"], .json-type');

    // Actions
    this.viewButtons = page.locator('[data-testid="view-json"], button:has-text("View")');
    this.editButtons = page.locator('[data-testid="edit-json"], button:has-text("Edit")');
    this.shareButtons = page.locator('[data-testid="share-json"], button:has-text("Share")');
    this.deleteButtons = page.locator('[data-testid="delete-json"], button:has-text("Delete")');
    this.publishButtons = page.locator('[data-testid="publish-json"], button:has-text("Publish")');

    // Search and filters
    this.searchInput = page
      .locator('[data-testid="library-search"]')
      .or(page.locator('input[placeholder*="search"]'));
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]');
    this.dateFilter = page.locator('[data-testid="date-filter"]');
    this.typeFilter = page.locator('[data-testid="type-filter"]');

    // Pagination (support both public and saved documents pagination)
    this.pagination = page.locator('[data-testid="pagination"], [data-testid="search-pagination"]');
    this.prevPageButton = page.locator(
      '[data-testid="prev-page"], button:has-text("Previous"), button:has-text("Prev")'
    );
    this.nextPageButton = page.locator(
      '[data-testid="next-page"], button:has-text("Next"), button:has-text("Load More")'
    );
    this.pageNumbers = page.locator('[data-testid="page-number"], .page-number');
    this.itemsPerPageSelect = page.locator('[data-testid="items-per-page"]');

    // Create/Upload
    this.createNewButton = page
      .locator('[data-testid="create-new"]')
      .or(page.locator('button:has-text("Create New")'));
    this.uploadButton = page
      .locator('[data-testid="upload-json"]')
      .or(page.locator('button:has-text("Upload")'));
    this.quickUploadArea = page.locator('[data-testid="quick-upload"]');

    // Stats
    this.totalCount = page.locator('[data-testid="total-count"]');
    this.storageUsed = page.locator('[data-testid="storage-used"]');
    this.lastUpdated = page.locator('[data-testid="last-updated"]');
  }

  /**
   * Navigate to library page
   */
  async navigateToLibrary() {
    // The personal saved items live at "/save" (not "/saved")
    await this.navigateTo('/save');
  }

  /**
   * Navigate to library
   */
  async navigateToPublicLibrary() {
    await this.navigateTo('/library');
  }

  /**
   * Switch to personal library tab
   */
  async switchToPersonalLibrary() {
    await this.personalLibraryTab.click();
    await this.waitForLoad();
  }

  /**
   * Switch to library tab
   */
  async switchToPublicLibrary() {
    await this.publicLibraryTab.click();
    await this.waitForLoad();
  }

  /**
   * Get all JSON items
   */
  async getAllJSONItems() {
    const items = await this.jsonItems.all();
    const itemData = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Try both saved documents format (json-title) and library format (card-title)
      const titleSelector = '[data-testid="json-title"], [data-testid="card-title"]';
      const dateSelector = '[data-testid="json-date"]';
      const sizeSelector = '[data-testid="json-size"]';

      const title = await item.locator(titleSelector).first().textContent();

      // Handle optional date and size fields gracefully
      let date = '';
      let size = '';

      try {
        const dateEl = item.locator(dateSelector).first();
        if ((await dateEl.count()) > 0) {
          date = (await dateEl.textContent()) || '';
        }
      } catch (e) {
        // Date field not found, leave empty
      }

      try {
        const sizeEl = item.locator(sizeSelector).first();
        if ((await sizeEl.count()) > 0) {
          size = (await sizeEl.textContent()) || '';
        }
      } catch (e) {
        // Size field not found, leave empty
      }

      itemData.push({
        index: i,
        title: title?.trim() || '',
        date: date?.trim() || '',
        size: size?.trim() || '',
        element: item,
      });
    }

    return itemData;
  }

  /**
   * Search for JSON items
   */
  async searchItems(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.searchInput.clear();
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /**
   * Sort items by criteria
   */
  async sortBy(criteria: 'date' | 'name' | 'size' | 'type') {
    await this.sortDropdown.click();
    await this.page
      .locator(`[data-value="${criteria}"]`)
      .or(this.page.locator(`text="${criteria}"`).first())
      .click();
    await this.waitForLoad();
  }

  /**
   * Filter items by date range
   */
  async filterByDate(range: 'today' | 'week' | 'month' | 'year') {
    await this.dateFilter.click();
    await this.page
      .locator(`[data-value="${range}"]`)
      .or(this.page.locator(`text="${range}"`).first())
      .click();
    await this.waitForLoad();
  }

  /**
   * View a specific JSON item
   */
  async viewJSONItem(index: number) {
    const viewButton = this.viewButtons.nth(index);
    await viewButton.click();
    await this.waitForNavigation();
  }

  /**
   * View JSON item by title
   */
  async viewJSONByTitle(title: string) {
    const items = await this.getAllJSONItems();
    const targetItem = items.find((item) => item.title.includes(title));

    if (targetItem) {
      await this.viewJSONItem(targetItem.index);
    } else {
      throw new Error(`JSON item with title "${title}" not found`);
    }
  }

  /**
   * Share a JSON item
   */
  async shareJSONItem(index: number) {
    const shareButton = this.shareButtons.nth(index);
    await shareButton.click();

    // Wait for share modal to appear
    const shareModal = this.page.locator('[data-testid="share-modal"]');
    await shareModal.waitFor({ state: 'visible' });

    // Get share URL
    const shareUrl = await this.page.locator('[data-testid="share-url"]').textContent();
    return shareUrl;
  }

  /**
   * Delete a JSON item
   */
  async deleteJSONItem(index: number) {
    const deleteButton = this.deleteButtons.nth(index);
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page
      .locator('[data-testid="confirm-delete"]')
      .or(this.page.locator('button:has-text("Delete")'));
    await confirmButton.click();

    // Wait for item to be removed
    await this.waitForLoad();
  }

  /**
   * Publish JSON item to library
   */
  async publishJSONItem(index: number, title?: string) {
    const publishButton = this.publishButtons.nth(index);
    await publishButton.click();

    // Fill in publish details if modal appears
    const publishModal = this.page.locator('[data-testid="publish-modal"]');
    if (await publishModal.isVisible()) {
      if (title) {
        await this.page.locator('[data-testid="publish-title"]').fill(title);
      }
      await this.page.locator('[data-testid="confirm-publish"]').click();
    }

    await this.waitForLoad();
  }

  /**
   * Create new JSON
   */
  async createNewJSON() {
    await this.createNewButton.click();
    await this.waitForNavigation('/viewer');
  }

  /**
   * Upload new JSON file
   */
  async uploadNewJSON(filePath: string) {
    // Try quick upload area first
    if (await this.quickUploadArea.isVisible()) {
      await this.uploadFile('[data-testid="quick-upload"] input[type="file"]', filePath);
    } else {
      await this.uploadButton.click();
      await this.uploadFile('input[type="file"]', filePath);
    }

    await this.waitForLoad();
  }

  /**
   * Go to next page
   */
  async goToNextPage() {
    if (await this.nextPageButton.isEnabled()) {
      await this.nextPageButton.click();
      await this.waitForLoad();
      return true;
    }
    return false;
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage() {
    if (await this.prevPageButton.isEnabled()) {
      await this.prevPageButton.click();
      await this.waitForLoad();
      return true;
    }
    return false;
  }

  /**
   * Go to specific page number
   */
  async goToPage(pageNumber: number) {
    const pageButton = this.page
      .locator(`[data-testid="page-${pageNumber}"]`)
      .or(this.pageNumbers.filter({ hasText: pageNumber.toString() }));

    if (await pageButton.isVisible()) {
      await pageButton.click();
      await this.waitForLoad();
      return true;
    }
    return false;
  }

  /**
   * Change items per page
   */
  async changeItemsPerPage(count: number) {
    await this.itemsPerPageSelect.click();
    await this.page.locator(`[data-value="${count}"]`).click();
    await this.waitForLoad();
  }

  /**
   * Get library statistics
   */
  async getLibraryStats() {
    const stats = {
      totalItems: 0,
      storageUsed: '',
      lastUpdated: '',
    };

    if (await this.totalCount.isVisible()) {
      const totalText = await this.totalCount.textContent();
      stats.totalItems = parseInt(totalText?.match(/\d+/)?.[0] || '0');
    }

    if (await this.storageUsed.isVisible()) {
      stats.storageUsed = (await this.storageUsed.textContent()) || '';
    }

    if (await this.lastUpdated.isVisible()) {
      stats.lastUpdated = (await this.lastUpdated.textContent()) || '';
    }

    return stats;
  }

  /**
   * Check if library is empty
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Get empty state message
   */
  async getEmptyStateMessage(): Promise<string> {
    if (await this.isEmpty()) {
      return (await this.emptyState.textContent()) || '';
    }
    return '';
  }

  /**
   * Wait for items to load
   */
  async waitForItemsToLoad() {
    // Wait for either items to appear or an empty state indicator
    await Promise.race([
      // Item list container becomes visible
      this.jsonItemsList.waitFor({ state: 'visible' }),
      // At least one item is attached to the DOM (visibility can be flaky with animations)
      this.jsonItems.first().waitFor({ state: 'attached' }),
      // Known empty state markers
      this.emptyState.waitFor({ state: 'visible' }),
      this.page.locator('[data-testid="empty-search-results"]').waitFor({ state: 'visible' }),
      // Fallback: text-based empty state on /save page
      this.page.getByText(/No\s+Shared\s+JSONs/i).waitFor({ state: 'visible' }),
    ]);
  }

  /**
   * Get current page info
   */
  async getPaginationInfo() {
    const info = {
      currentPage: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };

    // Try to get current page number
    const activePageButton = this.page.locator('.page-number.active, [aria-current="page"]');
    if (await activePageButton.isVisible()) {
      const pageText = await activePageButton.textContent();
      info.currentPage = parseInt(pageText?.trim() || '1');
    }

    // Check navigation button states (with error handling for missing buttons)
    try {
      if ((await this.nextPageButton.count()) > 0) {
        info.hasNext = await this.nextPageButton.isEnabled();
      }
    } catch (e) {
      info.hasNext = false;
    }

    try {
      if ((await this.prevPageButton.count()) > 0) {
        info.hasPrev = await this.prevPageButton.isEnabled();
      }
    } catch (e) {
      info.hasPrev = false;
    }

    // Try to get total pages
    const lastPageButton = this.pageNumbers.last();
    if (await lastPageButton.isVisible()) {
      const lastPageText = await lastPageButton.textContent();
      info.totalPages = parseInt(lastPageText?.trim() || '1');
    }

    return info;
  }

  /**
   * Bulk select items
   */
  async selectAllItems() {
    const selectAllCheckbox = this.page.locator('[data-testid="select-all"]');
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.check();
    }
  }

  /**
   * Bulk delete selected items
   */
  async deleteSelectedItems() {
    const bulkDeleteButton = this.page.locator('[data-testid="bulk-delete"]');
    if (await bulkDeleteButton.isVisible()) {
      await bulkDeleteButton.click();

      // Confirm bulk deletion
      const confirmButton = this.page.locator('[data-testid="confirm-bulk-delete"]');
      await confirmButton.click();
      await this.waitForLoad();
    }
  }
}

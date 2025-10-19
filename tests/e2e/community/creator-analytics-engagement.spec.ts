import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Content Creator - Engagement Metrics and Analytics', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page, authHelper }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);

    // Login as content creator
    await authHelper.login('content_creator');
    expect(await layoutPage.isLoggedIn()).toBe(true);
  });

  test.afterEach(async ({ authHelper }) => {
    await authHelper.logout();
  });

  test.describe('View Engagement Metrics for Published Content', () => {
    test.beforeEach(async ({ apiHelper, dataGenerator }) => {
      // Create published content with various engagement levels
      const publishedContent = [
        {
          content: JSON_SAMPLES.apiResponse.content,
          title: 'High-Traffic API Response Guide',
          description: 'Popular API response example with comprehensive documentation',
          category: 'API Response',
          tags: 'api, rest, popular, guide, documentation',
          views: 450,
          likes: 23,
          downloads: 67,
        },
        {
          content: JSON_SAMPLES.configuration.content,
          title: 'Production Configuration Template',
          description: 'Essential configuration template for production deployments',
          category: 'Configuration',
          tags: 'config, production, deployment, template, essential',
          views: 234,
          likes: 45,
          downloads: 89,
        },
        {
          content: dataGenerator.generateComplexJSON(),
          title: 'Complex Data Structure Example',
          description: 'Advanced example showing nested data patterns',
          category: 'Example',
          tags: 'complex, advanced, nested, patterns, data',
          views: 123,
          likes: 12,
          downloads: 34,
        },
        {
          content: {
            testSuite: 'Authentication',
            tests: [{ name: 'login_test', input: {}, expected: {} }],
          },
          title: 'Authentication Test Suite',
          description: 'Comprehensive test data for auth flows',
          category: 'Test Data',
          tags: 'testing, auth, qa, automation, suite',
          views: 89,
          likes: 8,
          downloads: 23,
        },
      ];

      // Create and publish content with simulated engagement
      for (const item of publishedContent) {
        const doc = await apiHelper.uploadJSON(item.content, {
          title: item.title,
          description: item.description,
        });

        await apiHelper.publishJSON(doc.id, {
          category: item.category,
          tags: item.tags,
        });

        // Simulate views over time
        for (let i = 0; i < item.views; i++) {
          await apiHelper.viewJSON(doc.id);
          if (i % 10 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay for time variation
          }
        }

        // Simulate likes/favorites if supported
        for (let i = 0; i < item.likes; i++) {
          await apiHelper.likeJSON(doc.id);
        }

        // Simulate downloads
        for (let i = 0; i < item.downloads; i++) {
          await apiHelper.downloadJSON(doc.id);
        }
      }
    });

    test('should display comprehensive analytics dashboard', async ({ page }) => {
      // Navigate to creator dashboard/analytics
      await layoutPage.goToProfile();

      const analyticsSection = page.locator('[data-testid="creator-analytics"]');
      if (!(await analyticsSection.isVisible())) {
        // Try analytics tab or button
        const analyticsTab = page.locator('[data-testid="analytics-tab"]');
        if (await analyticsTab.isVisible()) {
          await analyticsTab.click();
        }
      }

      await expect(analyticsSection).toBeVisible();

      // Should show overview statistics
      const overviewStats = analyticsSection.locator('[data-testid="overview-stats"]');
      await expect(overviewStats).toBeVisible();

      // Total views across all content
      const totalViews = overviewStats.locator('[data-testid="total-views"]');
      await expect(totalViews).toBeVisible();
      const viewsText = await totalViews.textContent();
      const viewsCount = parseInt(viewsText?.match(/\d+/)?.[0] || '0');
      expect(viewsCount).toBeGreaterThan(800); // Sum of all simulated views

      // Total published content count
      const publishedCount = overviewStats.locator('[data-testid="published-count"]');
      await expect(publishedCount).toBeVisible();
      const publishedText = await publishedCount.textContent();
      expect(publishedText).toContain('4'); // 4 published items

      // Total likes/favorites
      const totalLikes = overviewStats.locator('[data-testid="total-likes"]');
      if (await totalLikes.isVisible()) {
        const likesText = await totalLikes.textContent();
        const likesCount = parseInt(likesText?.match(/\d+/)?.[0] || '0');
        expect(likesCount).toBeGreaterThan(80); // Sum of all likes
      }

      // Total downloads
      const totalDownloads = overviewStats.locator('[data-testid="total-downloads"]');
      if (await totalDownloads.isVisible()) {
        const downloadsText = await totalDownloads.textContent();
        const downloadsCount = parseInt(downloadsText?.match(/\d+/)?.[0] || '0');
        expect(downloadsCount).toBeGreaterThan(200); // Sum of all downloads
      }
    });

    test('should show individual content performance metrics', async ({ page }) => {
      await layoutPage.goToProfile();

      // Navigate to content analytics
      const contentAnalytics = page.locator('[data-testid="content-analytics"]');
      if (!(await contentAnalytics.isVisible())) {
        const contentTab = page.locator('[data-testid="content-tab"]');
        if (await contentTab.isVisible()) {
          await contentTab.click();
        }
      }

      await expect(contentAnalytics).toBeVisible();

      // Should show list of published content with metrics
      const contentList = contentAnalytics.locator('[data-testid="content-performance-list"]');
      await expect(contentList).toBeVisible();

      const contentItems = contentList.locator('[data-testid="content-item"]');
      const itemCount = await contentItems.count();
      expect(itemCount).toBe(4); // Should show all 4 published items

      // Check the highest performing content (API Response Guide)
      const topPerformer = contentItems.filter({ hasText: 'High-Traffic API Response' });
      await expect(topPerformer).toBeVisible();

      // Should show detailed metrics for top performer
      const topViews = topPerformer.locator('[data-testid="item-views"]');
      await expect(topViews).toBeVisible();
      const topViewsText = await topViews.textContent();
      expect(topViewsText).toContain('450');

      const topLikes = topPerformer.locator('[data-testid="item-likes"]');
      if (await topLikes.isVisible()) {
        const likesText = await topLikes.textContent();
        expect(likesText).toContain('23');
      }

      const topDownloads = topPerformer.locator('[data-testid="item-downloads"]');
      if (await topDownloads.isVisible()) {
        const downloadsText = await topDownloads.textContent();
        expect(downloadsText).toContain('67');
      }

      // Should show engagement rate or popularity score
      const popularityScore = topPerformer.locator('[data-testid="popularity-score"]');
      if (await popularityScore.isVisible()) {
        const scoreText = await popularityScore.textContent();
        expect(scoreText).toBeTruthy();
      }
    });

    test('should display view trends over time', async ({ page }) => {
      await layoutPage.goToProfile();

      const analyticsSection = page.locator('[data-testid="creator-analytics"]');
      await expect(analyticsSection).toBeVisible();

      // Look for trends chart or time-based analytics
      const trendsChart = analyticsSection.locator('[data-testid="views-trend-chart"]');
      const timeAnalytics = analyticsSection.locator('[data-testid="time-analytics"]');

      if (await trendsChart.isVisible()) {
        await expect(trendsChart).toBeVisible();

        // Should show chart controls
        const chartControls = trendsChart.locator('[data-testid="chart-controls"]');
        if (await chartControls.isVisible()) {
          // Test different time periods
          const weeklyView = chartControls.locator('[data-testid="weekly-view"]');
          if (await weeklyView.isVisible()) {
            await weeklyView.click();
            await page.waitForLoadState('networkidle'); // Wait for chart update

            // Chart should update
            const weeklyData = trendsChart.locator('[data-testid="chart-data"]');
            await expect(weeklyData).toBeVisible();
          }

          const monthlyView = chartControls.locator('[data-testid="monthly-view"]');
          if (await monthlyView.isVisible()) {
            await monthlyView.click();
            await page.waitForLoadState('networkidle'); // Wait for monthly chart
          }
        }
      } else if (await timeAnalytics.isVisible()) {
        // Alternative time-based display
        const weeklyViews = timeAnalytics.locator('[data-testid="weekly-views"]');
        const monthlyViews = timeAnalytics.locator('[data-testid="monthly-views"]');

        if (await weeklyViews.isVisible()) {
          const weeklyText = await weeklyViews.textContent();
          expect(weeklyText).toMatch(/\d+/);
        }

        if (await monthlyViews.isVisible()) {
          const monthlyText = await monthlyViews.textContent();
          expect(monthlyText).toMatch(/\d+/);
        }
      }

      // Should show recent activity
      const recentActivity = analyticsSection.locator('[data-testid="recent-activity"]');
      if (await recentActivity.isVisible()) {
        const activityItems = recentActivity.locator('[data-testid="activity-item"]');
        const activityCount = await activityItems.count();
        expect(activityCount).toBeGreaterThan(0);

        // Activities should show timestamps and actions
        const firstActivity = activityItems.first();
        const activityText = await firstActivity.textContent();
        expect(activityText).toMatch(/viewed|liked|downloaded|published/i);
      }
    });

    test('should provide detailed analytics for specific content', async ({ page }) => {
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      // Find the high-traffic content
      const contentItems = await libraryPage.getAllJSONItems();
      const highTrafficItem = contentItems.find((item) =>
        item.title.includes('High-Traffic API Response')
      );
      expect(highTrafficItem).toBeDefined();

      // Click on analytics button for specific item
      const analyticsButton = libraryPage.page.locator(
        `[data-testid="analytics-${highTrafficItem?.index}"]`
      );
      if (await analyticsButton.isVisible()) {
        await analyticsButton.click();
      } else {
        // Try actions menu
        const actionsButton = libraryPage.page
          .locator('.actions-menu')
          .nth(highTrafficItem?.index || 0);
        await actionsButton.click();
        const viewAnalytics = libraryPage.page.locator('[data-testid="view-analytics"]');
        await viewAnalytics.click();
      }

      // Should open detailed analytics modal or page
      const detailedAnalytics = page.locator('[data-testid="detailed-analytics-modal"]');
      const analyticsPage = page.locator('[data-testid="analytics-page"]');

      const isModal = await detailedAnalytics.isVisible();
      const isPage = await analyticsPage.isVisible();
      expect(isModal || isPage).toBe(true);

      const analyticsContainer = isModal ? detailedAnalytics : analyticsPage;

      // Should show comprehensive metrics for this specific content
      const viewsSection = analyticsContainer.locator('[data-testid="views-section"]');
      await expect(viewsSection).toBeVisible();

      const totalViews = viewsSection.locator('[data-testid="total-views"]');
      expect(await totalViews.textContent()).toContain('450');

      const uniqueViews = viewsSection.locator('[data-testid="unique-views"]');
      if (await uniqueViews.isVisible()) {
        const uniqueText = await uniqueViews.textContent();
        expect(uniqueText).toMatch(/\d+/);
      }

      // Should show traffic sources
      const trafficSources = analyticsContainer.locator('[data-testid="traffic-sources"]');
      if (await trafficSources.isVisible()) {
        const sources = trafficSources.locator('[data-testid="traffic-source"]');
        const sourceCount = await sources.count();
        expect(sourceCount).toBeGreaterThan(0);

        // Common sources might include: search, direct, referral
        const sourceTexts = await sources.allTextContents();
        expect(sourceTexts.some((text) => text.toLowerCase().includes('search'))).toBe(true);
      }

      // Should show user engagement metrics
      const engagementSection = analyticsContainer.locator('[data-testid="engagement-metrics"]');
      if (await engagementSection.isVisible()) {
        const avgTimeOnPage = engagementSection.locator('[data-testid="avg-time-on-page"]');
        const bounceRate = engagementSection.locator('[data-testid="bounce-rate"]');
        const interactionRate = engagementSection.locator('[data-testid="interaction-rate"]');

        if (await avgTimeOnPage.isVisible()) {
          const timeText = await avgTimeOnPage.textContent();
          expect(timeText).toMatch(/\d+.*seconds?|minutes?/);
        }

        if (await bounceRate.isVisible()) {
          const rateText = await bounceRate.textContent();
          expect(rateText).toMatch(/\d+.*%/);
        }
      }
    });

    test('should show popular tags and category performance', async ({ page }) => {
      await layoutPage.goToProfile();

      const analyticsSection = page.locator('[data-testid="creator-analytics"]');
      await expect(analyticsSection).toBeVisible();

      // Should show tag performance analytics
      const tagAnalytics = analyticsSection.locator('[data-testid="tag-analytics"]');
      if (await tagAnalytics.isVisible()) {
        const popularTags = tagAnalytics.locator('[data-testid="popular-tags"]');
        await expect(popularTags).toBeVisible();

        const tagItems = popularTags.locator('[data-testid="tag-item"]');
        const tagCount = await tagItems.count();
        expect(tagCount).toBeGreaterThan(0);

        // Should show tags with their view counts
        const firstTag = tagItems.first();
        const tagName = firstTag.locator('[data-testid="tag-name"]');
        const tagViews = firstTag.locator('[data-testid="tag-views"]');

        await expect(tagName).toBeVisible();
        if (await tagViews.isVisible()) {
          const viewsText = await tagViews.textContent();
          expect(viewsText).toMatch(/\d+/);
        }

        // Popular tags should include 'api', 'config', etc.
        const tagTexts = await tagItems.allTextContents();
        expect(tagTexts.some((text) => text.toLowerCase().includes('api'))).toBe(true);
      }

      // Should show category performance
      const categoryAnalytics = analyticsSection.locator('[data-testid="category-analytics"]');
      if (await categoryAnalytics.isVisible()) {
        const categoryPerformance = categoryAnalytics.locator(
          '[data-testid="category-performance"]'
        );
        await expect(categoryPerformance).toBeVisible();

        const categoryItems = categoryPerformance.locator('[data-testid="category-item"]');
        const categoryCount = await categoryItems.count();
        expect(categoryCount).toBeGreaterThan(0);

        // Should show categories with metrics
        const topCategory = categoryItems.first();
        const categoryName = topCategory.locator('[data-testid="category-name"]');
        const categoryViews = topCategory.locator('[data-testid="category-views"]');
        const categoryContent = topCategory.locator('[data-testid="category-content-count"]');

        await expect(categoryName).toBeVisible();
        if (await categoryViews.isVisible()) {
          const viewsText = await categoryViews.textContent();
          expect(viewsText).toMatch(/\d+/);
        }

        if (await categoryContent.isVisible()) {
          const contentText = await categoryContent.textContent();
          expect(contentText).toMatch(/\d+.*items?/);
        }
      }
    });
  });

  test.describe('Track Content That Resonates With Community', () => {
    test('should identify trending and viral content', async ({ page, apiHelper }) => {
      // Create content that will be marked as trending
      const trendingDoc = await apiHelper.uploadJSON(JSON_SAMPLES.ecommerce.content, {
        title: 'Viral E-commerce Data Model',
        description: 'E-commerce data structure that went viral in the developer community',
      });

      await apiHelper.publishJSON(trendingDoc.id, {
        category: 'Template',
        tags: 'ecommerce, viral, trending, popular, template',
      });

      // Simulate rapid view growth
      for (let i = 0; i < 500; i++) {
        await apiHelper.viewJSON(trendingDoc.id);
      }

      await layoutPage.goToProfile();

      const analyticsSection = page.locator('[data-testid="creator-analytics"]');
      await expect(analyticsSection).toBeVisible();

      // Should show trending content section
      const trendingSection = analyticsSection.locator('[data-testid="trending-content"]');
      if (await trendingSection.isVisible()) {
        const trendingItems = trendingSection.locator('[data-testid="trending-item"]');
        const trendingCount = await trendingItems.count();
        expect(trendingCount).toBeGreaterThan(0);

        // Should show our viral content
        const viralItem = trendingItems.filter({ hasText: 'Viral E-commerce' });
        await expect(viralItem).toBeVisible();

        // Should show trending indicators
        const trendingIndicator = viralItem.locator('[data-testid="trending-indicator"]');
        if (await trendingIndicator.isVisible()) {
          const indicatorText = await trendingIndicator.textContent();
          expect(indicatorText).toMatch(/trending|viral|hot|🔥/i);
        }

        // Should show rapid growth metrics
        const growthMetric = viralItem.locator('[data-testid="growth-metric"]');
        if (await growthMetric.isVisible()) {
          const growthText = await growthMetric.textContent();
          expect(growthText).toMatch(/\+\d+%|↑|\⬆/);
        }
      }

      // Should show velocity analytics
      const velocitySection = analyticsSection.locator('[data-testid="content-velocity"]');
      if (await velocitySection.isVisible()) {
        const velocityChart = velocitySection.locator('[data-testid="velocity-chart"]');
        await expect(velocityChart).toBeVisible();

        // Should show which content is gaining traction fast
        const fastGrowing = velocitySection.locator('[data-testid="fast-growing"]');
        if (await fastGrowing.isVisible()) {
          const growingItems = fastGrowing.locator('[data-testid="growing-item"]');
          expect(await growingItems.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should show community engagement patterns', async ({ page }) => {
      await layoutPage.goToProfile();

      const analyticsSection = page.locator('[data-testid="creator-analytics"]');
      await expect(analyticsSection).toBeVisible();

      // Should show audience insights
      const audienceSection = analyticsSection.locator('[data-testid="audience-insights"]');
      if (await audienceSection.isVisible()) {
        // Should show who is viewing content
        const viewerDemographics = audienceSection.locator('[data-testid="viewer-demographics"]');
        if (await viewerDemographics.isVisible()) {
          const demographics = viewerDemographics.locator('[data-testid="demographic-item"]');
          const demoCount = await demographics.count();
          expect(demoCount).toBeGreaterThan(0);

          // Might show developer types, experience levels, etc.
          const demoTexts = await demographics.allTextContents();
          expect(
            demoTexts.some(
              (text) =>
                text.toLowerCase().includes('developer') ||
                text.toLowerCase().includes('engineer') ||
                text.toLowerCase().includes('student')
            )
          ).toBe(true);
        }

        // Should show engagement by user type
        const engagementByType = audienceSection.locator('[data-testid="engagement-by-type"]');
        if (await engagementByType.isVisible()) {
          const typeMetrics = engagementByType.locator('[data-testid="type-metric"]');
          expect(await typeMetrics.count()).toBeGreaterThan(0);
        }
      }

      // Should show time-based engagement patterns
      const timePatterns = analyticsSection.locator('[data-testid="time-patterns"]');
      if (await timePatterns.isVisible()) {
        // Show when content gets most views
        const peakHours = timePatterns.locator('[data-testid="peak-hours"]');
        const peakDays = timePatterns.locator('[data-testid="peak-days"]');

        if (await peakHours.isVisible()) {
          const hoursText = await peakHours.textContent();
          expect(hoursText).toMatch(/\d+.*hour|am|pm/i);
        }

        if (await peakDays.isVisible()) {
          const daysText = await peakDays.textContent();
          expect(daysText).toMatch(/monday|tuesday|wednesday|thursday|friday|weekend/i);
        }
      }

      // Should show geographic distribution if available
      const geoSection = analyticsSection.locator('[data-testid="geographic-analytics"]');
      if (await geoSection.isVisible()) {
        const topCountries = geoSection.locator('[data-testid="top-countries"]');
        if (await topCountries.isVisible()) {
          const countries = topCountries.locator('[data-testid="country-item"]');
          expect(await countries.count()).toBeGreaterThan(0);
        }
      }
    });

    test('should provide recommendations for content optimization', async ({ page }) => {
      await layoutPage.goToProfile();

      const analyticsSection = page.locator('[data-testid="creator-analytics"]');
      await expect(analyticsSection).toBeVisible();

      // Should show content optimization suggestions
      const optimizationSection = analyticsSection.locator(
        '[data-testid="optimization-suggestions"]'
      );
      if (await optimizationSection.isVisible()) {
        const suggestions = optimizationSection.locator('[data-testid="suggestion-item"]');
        const suggestionCount = await suggestions.count();
        expect(suggestionCount).toBeGreaterThan(0);

        // Should provide actionable recommendations
        const firstSuggestion = suggestions.first();
        const suggestionText = await firstSuggestion.textContent();
        expect(suggestionText).toBeTruthy();

        // Suggestions might include tag optimization, description improvements, etc.
        expect(suggestionText).toMatch(/tag|title|description|category|improve|optimize|consider/i);

        // Should provide implementation guidance
        const actionButton = firstSuggestion.locator('[data-testid="implement-suggestion"]');
        if (await actionButton.isVisible()) {
          await actionButton.click();

          // Should provide guidance or navigate to editing
          const guidanceModal = page.locator('[data-testid="optimization-guidance"]');
          if (await guidanceModal.isVisible()) {
            const guidance = await guidanceModal.textContent();
            expect(guidance).toBeTruthy();
          }
        }
      }

      // Should show content gap analysis
      const gapAnalysis = analyticsSection.locator('[data-testid="content-gaps"]');
      if (await gapAnalysis.isVisible()) {
        const gaps = gapAnalysis.locator('[data-testid="gap-item"]');
        const gapCount = await gaps.count();

        if (gapCount > 0) {
          const firstGap = gaps.first();
          const gapText = await firstGap.textContent();
          expect(gapText).toBeTruthy();

          // Should suggest content types that are missing or underrepresented
          expect(gapText).toMatch(/missing|opportunity|consider creating|underrepresented/i);
        }
      }

      // Should show competitive insights
      const competitiveSection = analyticsSection.locator('[data-testid="competitive-insights"]');
      if (await competitiveSection.isVisible()) {
        const insights = competitiveSection.locator('[data-testid="insight-item"]');
        const insightCount = await insights.count();

        if (insightCount > 0) {
          const firstInsight = insights.first();
          const insightText = await firstInsight.textContent();
          expect(insightText).toBeTruthy();

          // Should show what similar creators are doing well
          expect(insightText).toMatch(/similar creators|trending topics|popular formats/i);
        }
      }
    });
  });

  test.describe('Export and Share Analytics', () => {
    test('should export analytics data in multiple formats', async ({ page }) => {
      await layoutPage.goToProfile();

      const analyticsSection = page.locator('[data-testid="creator-analytics"]');
      await expect(analyticsSection).toBeVisible();

      // Look for export functionality
      const exportSection = analyticsSection.locator('[data-testid="export-analytics"]');
      if (await exportSection.isVisible()) {
        const exportButton = exportSection.locator('[data-testid="export-button"]');
        await exportButton.click();

        const exportModal = page.locator('[data-testid="export-modal"]');
        await expect(exportModal).toBeVisible();

        // Should offer multiple export formats
        const csvExport = exportModal.locator('[data-testid="export-csv"]');
        const jsonExport = exportModal.locator('[data-testid="export-json"]');
        const pdfExport = exportModal.locator('[data-testid="export-pdf"]');

        // Test CSV export
        if (await csvExport.isVisible()) {
          const downloadPromise = page.waitForEvent('download');
          await csvExport.click();
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/analytics.*\.csv/);
        }

        // Test JSON export
        if (await jsonExport.isVisible()) {
          const downloadPromise = page.waitForEvent('download');
          await jsonExport.click();
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/analytics.*\.json/);
        }

        // Test PDF report
        if (await pdfExport.isVisible()) {
          const downloadPromise = page.waitForEvent('download');
          await pdfExport.click();
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/analytics.*\.pdf/);
        }
      }
    });

    test('should generate shareable analytics reports', async ({ page }) => {
      await layoutPage.goToProfile();

      const analyticsSection = page.locator('[data-testid="creator-analytics"]');
      await expect(analyticsSection).toBeVisible();

      // Look for share functionality
      const shareSection = analyticsSection.locator('[data-testid="share-analytics"]');
      if (await shareSection.isVisible()) {
        const shareButton = shareSection.locator('[data-testid="share-button"]');
        await shareButton.click();

        const shareModal = page.locator('[data-testid="share-modal"]');
        await expect(shareModal).toBeVisible();

        // Should generate shareable report URL
        const shareUrl = shareModal.locator('[data-testid="share-url"]');
        if (await shareUrl.isVisible()) {
          const url = await shareUrl.inputValue();
          expect(url).toMatch(/^https?:\/\//);
          expect(url).toContain('analytics');
        }

        // Should have social sharing options
        const socialSharing = shareModal.locator('[data-testid="social-sharing"]');
        if (await socialSharing.isVisible()) {
          const twitterShare = socialSharing.locator('[data-testid="share-twitter"]');
          const linkedinShare = socialSharing.locator('[data-testid="share-linkedin"]');

          if (await twitterShare.isVisible()) {
            const twitterHref = await twitterShare.getAttribute('href');
            expect(twitterHref).toContain('twitter.com');
          }

          if (await linkedinShare.isVisible()) {
            const linkedinHref = await linkedinShare.getAttribute('href');
            expect(linkedinHref).toContain('linkedin.com');
          }
        }

        // Should allow customizing what to share
        const shareOptions = shareModal.locator('[data-testid="share-options"]');
        if (await shareOptions.isVisible()) {
          const includeViews = shareOptions.locator('[data-testid="include-views"]');
          const includeContent = shareOptions.locator('[data-testid="include-content-list"]');
          const includeGrowth = shareOptions.locator('[data-testid="include-growth"]');

          if (await includeViews.isVisible()) {
            await includeViews.check();
          }

          if (await includeContent.isVisible()) {
            await includeContent.uncheck();
          }

          // Generate updated share link
          const updateShare = shareModal.locator('[data-testid="update-share"]');
          if (await updateShare.isVisible()) {
            await updateShare.click();
            await page.waitForLoadState('networkidle'); // Wait for share URL update

            // Share URL should update
            const updatedUrl = await shareUrl.inputValue();
            expect(updatedUrl).toBeTruthy();
          }
        }
      }
    });
  });
});

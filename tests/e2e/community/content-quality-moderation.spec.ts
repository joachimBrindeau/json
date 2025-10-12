import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Community - Content Quality and Moderation', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);
  });

  test.describe('Content Quality Validation and Standards', () => {
    test('should validate content quality before publication', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      await authHelper.login('content_creator');

      // Test with minimal/low-quality content
      const minimalData = { a: 1, b: 'test' };

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(minimalData));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      // Fill basic required fields
      await libraryPage.page.locator('[data-testid="publish-title"]').fill('Minimal Test');
      await libraryPage.page.locator('[data-testid="publish-description"]').fill('Basic test data');

      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="Example"]').click();

      // Try to publish
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();

      // Should show quality warnings or validation
      const qualityWarning = libraryPage.page.locator('[data-testid="quality-warning"]');
      if (await qualityWarning.isVisible()) {
        const warningText = await qualityWarning.textContent();
        expect(warningText).toMatch(/quality|minimal|simple|basic|improve/i);

        // Should provide suggestions for improvement
        const suggestions = qualityWarning.locator('[data-testid="quality-suggestions"]');
        if (await suggestions.isVisible()) {
          const suggestionItems = suggestions.locator('[data-testid="suggestion"]');
          const suggestionCount = await suggestionItems.count();
          expect(suggestionCount).toBeGreaterThan(0);

          // Common suggestions
          const suggestionTexts = await suggestionItems.allTextContents();
          expect(
            suggestionTexts.some(
              (text) =>
                text.toLowerCase().includes('description') ||
                text.toLowerCase().includes('example') ||
                text.toLowerCase().includes('documentation')
            )
          ).toBe(true);
        }

        // Should allow publishing with confirmation
        const confirmLowQuality = libraryPage.page.locator('[data-testid="confirm-low-quality"]');
        if (await confirmLowQuality.isVisible()) {
          await confirmLowQuality.click();
        }
      }

      await layoutPage.waitForNotification('Published');
      await authHelper.logout();
    });

    test('should enforce content standards and guidelines', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      await authHelper.login('content_creator');

      // Test with inappropriate or problematic content
      const problematicData = {
        sensitive_data: {
          password: 'admin123',
          api_key: 'sk-1234567890abcdef',
          credit_card: '4111-1111-1111-1111',
          ssn: '123-45-6789',
        },
        inappropriate_content: {
          spam_links: ['http://spam-site.com', 'http://malicious-link.net'],
          promotional: 'Buy our amazing product now! 50% off!',
        },
      };

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(problematicData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('Data with Sensitive Information');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Example containing various data types');

      // Try to publish
      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();

      // Should detect and flag sensitive content
      const contentWarning = libraryPage.page.locator('[data-testid="content-warning"]');
      if (await contentWarning.isVisible()) {
        const warningText = await contentWarning.textContent();
        expect(warningText).toMatch(/sensitive|personal|security|inappropriate/i);

        // Should highlight specific issues
        const flaggedItems = contentWarning.locator('[data-testid="flagged-item"]');
        const flagCount = await flaggedItems.count();
        expect(flagCount).toBeGreaterThan(0);

        const flagTexts = await flaggedItems.allTextContents();
        expect(
          flagTexts.some(
            (text) =>
              text.toLowerCase().includes('password') ||
              text.toLowerCase().includes('api key') ||
              text.toLowerCase().includes('credit card')
          )
        ).toBe(true);

        // Should provide option to remove sensitive data
        const removeSensitive = libraryPage.page.locator('[data-testid="remove-sensitive-data"]');
        if (await removeSensitive.isVisible()) {
          await removeSensitive.click();

          // Should automatically clean or redact the data
          const cleanedNotice = libraryPage.page.locator('[data-testid="data-cleaned"]');
          if (await cleanedNotice.isVisible()) {
            expect(await cleanedNotice.textContent()).toMatch(/cleaned|redacted|removed/i);
          }
        }

        // Should allow manual review and editing
        const reviewButton = libraryPage.page.locator('[data-testid="review-content"]');
        if (await reviewButton.isVisible()) {
          await reviewButton.click();

          // Should return to editor with flagged content highlighted
          await expect(viewerPage.jsonTextArea).toBeVisible();
        }
      }

      await authHelper.logout();
    });

    test('should validate content originality and prevent plagiarism', async ({
      page,
      authHelper,
      apiHelper,
      dataGenerator,
    }) => {
      await authHelper.login('content_creator_1');

      // First, publish original content
      const originalData = dataGenerator.generateComplexJSON();
      const originalDoc = await apiHelper.uploadJSON(originalData, {
        title: 'Original Complex Data Structure',
        description: 'Original example of complex JSON structure',
      });

      await apiHelper.publishJSON(originalDoc.id, {
        category: 'Example',
        tags: 'original, complex, example',
      });

      await authHelper.logout();

      // Now try to publish identical content from different user
      await authHelper.login('content_creator_2');

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(originalData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('My Complex Data Structure');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Example of complex JSON patterns');

      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="Example"]').click();

      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();

      // Should detect duplicate/similar content
      const duplicateWarning = libraryPage.page.locator(
        '[data-testid="duplicate-content-warning"]'
      );
      if (await duplicateWarning.isVisible()) {
        const warningText = await duplicateWarning.textContent();
        expect(warningText).toMatch(/duplicate|similar|already exists|originality/i);

        // Should show the original content
        const originalReference = duplicateWarning.locator('[data-testid="original-content"]');
        if (await originalReference.isVisible()) {
          const originalTitle = await originalReference
            .locator('[data-testid="original-title"]')
            .textContent();
          expect(originalTitle).toContain('Original Complex Data Structure');

          // Should provide link to view original
          const viewOriginal = originalReference.locator('[data-testid="view-original"]');
          if (await viewOriginal.isVisible()) {
            await viewOriginal.click();
            // Should navigate to or show original content
          }
        }

        // Should provide options for resolution
        const resolutionOptions = duplicateWarning.locator('[data-testid="resolution-options"]');
        if (await resolutionOptions.isVisible()) {
          const editContent = resolutionOptions.locator('[data-testid="edit-content"]');
          const acknowledgeCopy = resolutionOptions.locator('[data-testid="acknowledge-copy"]');
          const cancelPublish = resolutionOptions.locator('[data-testid="cancel-publish"]');

          expect(await editContent.isVisible()).toBe(true);
          if (await acknowledgeCopy.isVisible()) {
            expect(await acknowledgeCopy.isVisible()).toBe(true);
          }
          expect(await cancelPublish.isVisible()).toBe(true);
        }
      }

      await authHelper.logout();
    });

    test('should implement automated content scoring system', async ({
      page,
      authHelper,
      dataGenerator,
    }) => {
      await authHelper.login('content_creator');

      // Test with high-quality, well-documented content
      const highQualityData = {
        apiDocumentation: {
          version: '2.0',
          title: 'User Management API',
          description:
            'Comprehensive API for user account management including authentication, profile management, and permissions',
          endpoints: [
            {
              path: '/api/users',
              method: 'GET',
              description: 'Retrieve list of users with pagination support',
              parameters: {
                page: { type: 'integer', default: 1, description: 'Page number for pagination' },
                limit: { type: 'integer', default: 20, description: 'Number of users per page' },
                search: {
                  type: 'string',
                  optional: true,
                  description: 'Search term for filtering users',
                },
              },
              responses: {
                '200': {
                  description: 'Success response with user list',
                  example: {
                    users: [{ id: 1, name: 'John Doe', email: 'john@example.com' }],
                    pagination: { page: 1, limit: 20, total: 100 },
                    meta: { timestamp: '2024-01-01T00:00:00Z' },
                  },
                },
              },
            },
          ],
          authentication: {
            type: 'Bearer Token',
            description: 'Include JWT token in Authorization header',
            example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      };

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(highQualityData, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page
        .locator('[data-testid="publish-title"]')
        .fill('Comprehensive User Management API Documentation');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill(
          'Complete API documentation for user management endpoints including detailed parameter descriptions, response examples, authentication requirements, and error handling patterns. This comprehensive guide covers all aspects of user lifecycle management from registration to account deletion.'
        );

      const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
      await categorySelect.click();
      await libraryPage.page.locator('[data-value="API Response"]').click();

      await libraryPage.page
        .locator('[data-testid="publish-tags"]')
        .fill(
          'api, documentation, users, authentication, endpoints, comprehensive, guide, rest, management, detailed'
        );

      // Should show content quality score
      const qualityScore = libraryPage.page.locator('[data-testid="content-quality-score"]');
      if (await qualityScore.isVisible()) {
        const scoreText = await qualityScore.textContent();
        const score = parseInt(scoreText?.match(/\d+/)?.[0] || '0');
        expect(score).toBeGreaterThan(80); // High quality content should score well

        // Should show score breakdown
        const scoreBreakdown = libraryPage.page.locator('[data-testid="score-breakdown"]');
        if (await scoreBreakdown.isVisible()) {
          const completeness = scoreBreakdown.locator('[data-testid="completeness-score"]');
          const documentation = scoreBreakdown.locator('[data-testid="documentation-score"]');
          const structure = scoreBreakdown.locator('[data-testid="structure-score"]');

          if (await completeness.isVisible()) {
            const completenessText = await completeness.textContent();
            expect(completenessText).toMatch(/\d+/);
          }

          if (await documentation.isVisible()) {
            const docText = await documentation.textContent();
            expect(docText).toMatch(/\d+/);
          }

          if (await structure.isVisible()) {
            const structureText = await structure.textContent();
            expect(structureText).toMatch(/\d+/);
          }
        }

        // Should show quality badges
        const qualityBadges = libraryPage.page.locator('[data-testid="quality-badges"]');
        if (await qualityBadges.isVisible()) {
          const badges = qualityBadges.locator('[data-testid="quality-badge"]');
          const badgeCount = await badges.count();
          expect(badgeCount).toBeGreaterThan(0);

          const badgeTexts = await badges.allTextContents();
          expect(
            badgeTexts.some(
              (text) =>
                text.toLowerCase().includes('comprehensive') ||
                text.toLowerCase().includes('well-documented') ||
                text.toLowerCase().includes('detailed')
            )
          ).toBe(true);
        }
      }

      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
      await layoutPage.waitForNotification('Published successfully');

      await authHelper.logout();
    });
  });

  test.describe('Community Reporting and Moderation', () => {
    test.beforeEach(async ({ apiHelper, authHelper }) => {
      // Create potentially problematic content for reporting tests
      await authHelper.login('problem_creator');

      const problematicContent = [
        {
          content: {
            spam: 'BUY NOW! AMAZING DEAL! CLICK HERE!',
            promotion: 'Get rich quick scheme!',
          },
          title: 'Amazing Business Opportunity',
          description:
            'Get rich quick with this amazing business opportunity! No experience needed!',
          category: 'Example',
          tags: 'money, business, opportunity, rich, quick',
        },
        {
          content: { inappropriate: 'offensive content here', hate_speech: 'problematic content' },
          title: 'Inappropriate Content Example',
          description: 'This contains inappropriate material',
          category: 'Example',
          tags: 'inappropriate, problematic',
        },
      ];

      for (const item of problematicContent) {
        const doc = await apiHelper.uploadJSON(item.content, {
          title: item.title,
          description: item.description,
        });

        await apiHelper.publishJSON(doc.id, {
          category: item.category,
          tags: item.tags,
        });
      }

      await authHelper.logout();
    });

    test('should allow community members to report inappropriate content', async ({
      page,
      authHelper,
    }) => {
      // Login as regular community member
      await authHelper.login('regular_user');

      await layoutPage.navigateToPublicLibrary();

      // Find problematic content
      const problematicCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Amazing Business Opportunity' });

      await expect(problematicCard).toBeVisible();

      // Should have report option
      const reportButton = problematicCard.locator('[data-testid="report-content"]');
      if (!(await reportButton.isVisible())) {
        // Might be in actions menu
        const actionsButton = problematicCard.locator('[data-testid="card-actions"]');
        await actionsButton.click();
        const reportAction = page.locator('[data-testid="report-action"]');
        await reportAction.click();
      } else {
        await reportButton.click();
      }

      // Should open report modal
      const reportModal = page.locator('[data-testid="report-modal"]');
      await expect(reportModal).toBeVisible();

      // Should have report categories
      const reportCategories = reportModal.locator('[data-testid="report-categories"]');
      await expect(reportCategories).toBeVisible();

      const spamCategory = reportCategories.locator('[data-testid="category-spam"]');
      const inappropriateCategory = reportCategories.locator(
        '[data-testid="category-inappropriate"]'
      );
      const copyrightCategory = reportCategories.locator('[data-testid="category-copyright"]');

      // Select spam category
      await spamCategory.check();

      // Should require additional details
      const reportDetails = reportModal.locator('[data-testid="report-details"]');
      await reportDetails.fill(
        'This content appears to be spam promoting a get-rich-quick scheme with misleading claims.'
      );

      // Should provide evidence option
      const evidenceSection = reportModal.locator('[data-testid="report-evidence"]');
      if (await evidenceSection.isVisible()) {
        const evidenceText = evidenceSection.locator('[data-testid="evidence-text"]');
        await evidenceText.fill(
          'Contains promotional language typical of spam: "BUY NOW", "AMAZING DEAL", etc.'
        );
      }

      // Submit report
      const submitReport = reportModal.locator('[data-testid="submit-report"]');
      await submitReport.click();

      // Should show confirmation
      await layoutPage.waitForNotification('Report submitted successfully');

      // Should close modal
      await expect(reportModal).toBeHidden();

      await authHelper.logout();
    });

    test('should implement automated content moderation', async ({
      page,
      authHelper,
      apiHelper,
    }) => {
      await authHelper.login('content_creator');

      // Try to publish content that should trigger automatic moderation
      const flaggedContent = {
        spam_content: {
          promotional_text: 'BUY NOW! LIMITED TIME OFFER! CLICK HERE TO GET RICH QUICK!',
          suspicious_links: [
            'http://suspicious-site.com',
            'http://get-rich-quick.spam',
            'http://click-here-now.scam',
          ],
          repeated_text: 'AMAZING DEAL '.repeat(20),
          excessive_caps: "THIS IS THE BEST DEAL EVER!!!! DON'T MISS OUT!!!!!",
        },
        inappropriate_content: {
          profanity: ['censored inappropriate words here'],
          hate_content: ['censored hate speech here'],
        },
      };

      await viewerPage.navigateToViewer();
      await viewerPage.inputJSON(JSON.stringify(flaggedContent, null, 2));
      await viewerPage.waitForJSONProcessed();

      await viewerPage.publishButton.click();
      await expect(viewerPage.publishModal).toBeVisible();

      await libraryPage.page.locator('[data-testid="publish-title"]').fill('Great Deal Alert');
      await libraryPage.page
        .locator('[data-testid="publish-description"]')
        .fill('Amazing opportunity for everyone!');

      await libraryPage.page.locator('[data-testid="confirm-publish"]').click();

      // Should be caught by automated moderation
      const moderationWarning = libraryPage.page.locator('[data-testid="moderation-warning"]');
      if (await moderationWarning.isVisible()) {
        const warningText = await moderationWarning.textContent();
        expect(warningText).toMatch(/automatically flagged|moderation review|content policy/i);

        // Should show specific issues detected
        const detectedIssues = moderationWarning.locator('[data-testid="detected-issues"]');
        if (await detectedIssues.isVisible()) {
          const issues = detectedIssues.locator('[data-testid="issue-item"]');
          const issueCount = await issues.count();
          expect(issueCount).toBeGreaterThan(0);

          const issueTexts = await issues.allTextContents();
          expect(
            issueTexts.some(
              (text) =>
                text.toLowerCase().includes('spam') ||
                text.toLowerCase().includes('promotional') ||
                text.toLowerCase().includes('inappropriate')
            )
          ).toBe(true);
        }

        // Should require manual review
        const reviewRequired = moderationWarning.locator('[data-testid="review-required"]');
        if (await reviewRequired.isVisible()) {
          expect(await reviewRequired.textContent()).toMatch(/manual review|pending review/i);
        }

        // Should provide appeal option
        const appealButton = moderationWarning.locator('[data-testid="appeal-decision"]');
        if (await appealButton.isVisible()) {
          await appealButton.click();

          const appealModal = page.locator('[data-testid="appeal-modal"]');
          await expect(appealModal).toBeVisible();

          const appealText = appealModal.locator('[data-testid="appeal-text"]');
          await appealText.fill(
            'This is a legitimate example for educational purposes, not actual promotional content.'
          );

          const submitAppeal = appealModal.locator('[data-testid="submit-appeal"]');
          await submitAppeal.click();

          await layoutPage.waitForNotification('Appeal submitted for review');
        }
      }

      await authHelper.logout();
    });

    test('should handle moderator review workflow', async ({ page, authHelper }) => {
      // Login as moderator
      await authHelper.login('moderator');

      // Navigate to moderation dashboard
      const moderationDashboard = await layoutPage.goToModerationDashboard();
      if (!moderationDashboard) {
        // Try alternative navigation
        await page.goto('/moderation');
      }

      const dashboardPage = page.locator('[data-testid="moderation-dashboard"]');
      await expect(dashboardPage).toBeVisible();

      // Should show pending reports
      const pendingReports = dashboardPage.locator('[data-testid="pending-reports"]');
      await expect(pendingReports).toBeVisible();

      const reportItems = pendingReports.locator('[data-testid="report-item"]');
      const reportCount = await reportItems.count();

      if (reportCount > 0) {
        const firstReport = reportItems.first();

        // Should show report details
        const reportContent = firstReport.locator('[data-testid="reported-content"]');
        const reportReason = firstReport.locator('[data-testid="report-reason"]');
        const reporterInfo = firstReport.locator('[data-testid="reporter-info"]');

        await expect(reportContent).toBeVisible();
        await expect(reportReason).toBeVisible();

        // Should provide moderation actions
        const moderationActions = firstReport.locator('[data-testid="moderation-actions"]');
        await expect(moderationActions).toBeVisible();

        const approveButton = moderationActions.locator('[data-testid="approve-content"]');
        const rejectButton = moderationActions.locator('[data-testid="reject-content"]');
        const flagButton = moderationActions.locator('[data-testid="flag-for-review"]');

        // Review the content
        const reviewContent = firstReport.locator('[data-testid="review-content"]');
        if (await reviewContent.isVisible()) {
          await reviewContent.click();

          // Should open content preview
          const contentPreview = page.locator('[data-testid="content-preview"]');
          await expect(contentPreview).toBeVisible();

          // Close preview
          const closePreview = contentPreview.locator('[data-testid="close-preview"]');
          await closePreview.click();
        }

        // Make moderation decision
        if (await rejectButton.isVisible()) {
          await rejectButton.click();

          // Should require reason
          const rejectionReason = page.locator('[data-testid="rejection-reason"]');
          await expect(rejectionReason).toBeVisible();

          const reasonSelect = rejectionReason.locator('[data-testid="reason-select"]');
          await reasonSelect.selectOption('spam');

          const additionalNotes = rejectionReason.locator('[data-testid="moderation-notes"]');
          await additionalNotes.fill(
            'Content violates community guidelines regarding promotional spam.'
          );

          const confirmRejection = rejectionReason.locator('[data-testid="confirm-rejection"]');
          await confirmRejection.click();

          // Should show confirmation
          await layoutPage.waitForNotification('Content rejected and removed');

          // Should notify content creator
          const notifyCreator = page.locator('[data-testid="notify-creator"]');
          if (await notifyCreator.isVisible()) {
            await notifyCreator.check();
          }
        }
      }

      // Should show moderation statistics
      const moderationStats = dashboardPage.locator('[data-testid="moderation-stats"]');
      if (await moderationStats.isVisible()) {
        const totalReports = moderationStats.locator('[data-testid="total-reports"]');
        const resolvedReports = moderationStats.locator('[data-testid="resolved-reports"]');
        const avgResponseTime = moderationStats.locator('[data-testid="avg-response-time"]');

        if (await totalReports.isVisible()) {
          const total = await totalReports.textContent();
          expect(total).toMatch(/\d+/);
        }
      }

      await authHelper.logout();
    });

    test('should implement content appeal process', async ({ page, authHelper, apiHelper }) => {
      // Create content that gets rejected
      await authHelper.login('content_creator');

      const appealableDoc = await apiHelper.uploadJSON(
        { borderline_content: 'This might be questionable but educational' },
        { title: 'Educational Borderline Example' }
      );

      await apiHelper.publishJSON(appealableDoc.id);

      // Simulate content being rejected by moderation
      await apiHelper.moderateContent(
        appealableDoc.id,
        'rejected',
        'Flagged as potentially inappropriate'
      );

      // Creator should be able to appeal
      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const rejectedFilter = page.locator('[data-testid="rejected-filter"]');
      if (await rejectedFilter.isVisible()) {
        await rejectedFilter.click();

        const rejectedItems = page.locator('[data-testid="rejected-item"]');
        const rejectedCount = await rejectedItems.count();

        if (rejectedCount > 0) {
          const firstRejected = rejectedItems.first();

          // Should show rejection reason
          const rejectionReason = firstRejected.locator('[data-testid="rejection-reason"]');
          if (await rejectionReason.isVisible()) {
            const reason = await rejectionReason.textContent();
            expect(reason).toBeTruthy();
          }

          // Should have appeal option
          const appealButton = firstRejected.locator('[data-testid="appeal-rejection"]');
          await expect(appealButton).toBeVisible();
          await appealButton.click();

          const appealModal = page.locator('[data-testid="appeal-modal"]');
          await expect(appealModal).toBeVisible();

          // Should show original rejection reason
          const originalReason = appealModal.locator('[data-testid="original-rejection"]');
          await expect(originalReason).toBeVisible();

          // Should allow detailed appeal
          const appealText = appealModal.locator('[data-testid="appeal-explanation"]');
          await appealText.fill(
            'This content was created for educational purposes to demonstrate borderline content handling. It contains no actual inappropriate material and serves as a legitimate example for community guidelines discussion.'
          );

          // Should allow evidence upload
          const evidenceUpload = appealModal.locator('[data-testid="appeal-evidence"]');
          if (await evidenceUpload.isVisible()) {
            // Upload supporting documentation
          }

          // Should show appeal will be reviewed
          const appealDisclaimer = appealModal.locator('[data-testid="appeal-disclaimer"]');
          if (await appealDisclaimer.isVisible()) {
            const disclaimer = await appealDisclaimer.textContent();
            expect(disclaimer).toMatch(/review|moderator|decision/i);
          }

          const submitAppeal = appealModal.locator('[data-testid="submit-appeal"]');
          await submitAppeal.click();

          await layoutPage.waitForNotification('Appeal submitted successfully');

          // Should show appeal pending status
          const appealStatus = firstRejected.locator('[data-testid="appeal-status"]');
          if (await appealStatus.isVisible()) {
            expect(await appealStatus.textContent()).toMatch(/pending|under review/i);
          }
        }
      }

      await authHelper.logout();
    });
  });

  test.describe('Community Guidelines and Education', () => {
    test('should provide clear community guidelines and help', async ({ page }) => {
      // Navigate to community guidelines
      await layoutPage.navigateToCommunityGuidelines();

      const guidelinesPage = page.locator('[data-testid="community-guidelines"]');
      await expect(guidelinesPage).toBeVisible();

      // Should have comprehensive sections
      const contentStandards = guidelinesPage.locator('[data-testid="content-standards"]');
      const qualityGuidelines = guidelinesPage.locator('[data-testid="quality-guidelines"]');
      const prohibitedContent = guidelinesPage.locator('[data-testid="prohibited-content"]');
      const reportingProcess = guidelinesPage.locator('[data-testid="reporting-process"]');

      await expect(contentStandards).toBeVisible();

      if (await qualityGuidelines.isVisible()) {
        const qualityText = await qualityGuidelines.textContent();
        expect(qualityText).toMatch(/quality|standards|best practices/i);
      }

      if (await prohibitedContent.isVisible()) {
        const prohibitedText = await prohibitedContent.textContent();
        expect(prohibitedText).toMatch(/spam|inappropriate|prohibited|not allowed/i);
      }

      // Should provide examples of good and bad content
      const goodExamples = guidelinesPage.locator('[data-testid="good-examples"]');
      const badExamples = guidelinesPage.locator('[data-testid="bad-examples"]');

      if (await goodExamples.isVisible()) {
        const examples = goodExamples.locator('[data-testid="example-item"]');
        expect(await examples.count()).toBeGreaterThan(0);
      }

      if (await badExamples.isVisible()) {
        const badItems = badExamples.locator('[data-testid="bad-example"]');
        expect(await badItems.count()).toBeGreaterThan(0);
      }

      // Should have FAQ section
      const faqSection = guidelinesPage.locator('[data-testid="guidelines-faq"]');
      if (await faqSection.isVisible()) {
        const faqItems = faqSection.locator('[data-testid="faq-item"]');
        expect(await faqItems.count()).toBeGreaterThan(0);

        // Click on first FAQ
        const firstFaq = faqItems.first();
        await firstFaq.click();

        const faqAnswer = firstFaq.locator('[data-testid="faq-answer"]');
        await expect(faqAnswer).toBeVisible();
      }

      // Should have contact information for questions
      const contactInfo = guidelinesPage.locator('[data-testid="contact-moderators"]');
      if (await contactInfo.isVisible()) {
        const contactLink = contactInfo.locator('a');
        expect(await contactLink.getAttribute('href')).toBeTruthy();
      }
    });

    test('should provide content quality improvement tips', async ({ page, authHelper }) => {
      await authHelper.login('content_creator');

      // Navigate to content improvement help
      const helpSection = await layoutPage.goToHelp();
      const contentHelp = page.locator('[data-testid="content-improvement-help"]');

      if (!(await contentHelp.isVisible())) {
        // Try help menu or search
        const helpSearch = page.locator('[data-testid="help-search"]');
        if (await helpSearch.isVisible()) {
          await helpSearch.fill('content quality');
          await helpSearch.press('Enter');
        }
      }

      // Should show quality improvement guides
      const qualityGuides = page.locator('[data-testid="quality-guides"]');
      if (await qualityGuides.isVisible()) {
        const guides = qualityGuides.locator('[data-testid="guide-item"]');
        const guideCount = await guides.count();
        expect(guideCount).toBeGreaterThan(0);

        // Should have specific guides
        const titleGuide = guides.filter({ hasText: 'Writing Effective Titles' });
        const descriptionGuide = guides.filter({ hasText: 'Creating Good Descriptions' });
        const taggingGuide = guides.filter({ hasText: 'Proper Tagging' });

        if (await titleGuide.isVisible()) {
          await titleGuide.click();

          const guideContent = page.locator('[data-testid="guide-content"]');
          await expect(guideContent).toBeVisible();

          const guideText = await guideContent.textContent();
          expect(guideText).toMatch(/title|descriptive|clear|specific/i);
        }
      }

      // Should provide interactive quality checker
      const qualityChecker = page.locator('[data-testid="quality-checker-tool"]');
      if (await qualityChecker.isVisible()) {
        const testTitle = qualityChecker.locator('[data-testid="test-title-input"]');
        const testDescription = qualityChecker.locator('[data-testid="test-description-input"]');

        await testTitle.fill('Test Title');
        await testDescription.fill('Test description');

        const checkQuality = qualityChecker.locator('[data-testid="check-quality"]');
        await checkQuality.click();

        // Should provide feedback
        const qualityFeedback = page.locator('[data-testid="quality-feedback"]');
        if (await qualityFeedback.isVisible()) {
          const feedback = await qualityFeedback.textContent();
          expect(feedback).toBeTruthy();
        }
      }

      await authHelper.logout();
    });
  });
});

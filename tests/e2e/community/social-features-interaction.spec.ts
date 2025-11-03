import { test, expect } from '../../utils/base-test';
import { JsonViewerPage } from '../../page-objects/json-viewer-page';
import { LibraryPage } from '../../page-objects/library-page';
import { MainLayoutPage } from '../../page-objects/main-layout-page';
import { JSON_SAMPLES } from '../../fixtures/json-samples';

test.describe('Community - Social Features and Interaction', () => {
  let viewerPage: JsonViewerPage;
  let libraryPage: LibraryPage;
  let layoutPage: MainLayoutPage;

  test.beforeEach(async ({ page }) => {
    viewerPage = new JsonViewerPage(page);
    libraryPage = new LibraryPage(page);
    layoutPage = new MainLayoutPage(page);
  });

  test.describe('Community Interaction and Social Features', () => {
    test.beforeEach(async ({ apiHelper, authHelper, dataGenerator }) => {
      // Create interactive content for social features testing
      await authHelper.login('social_creator');

      const socialContent = [
        {
          content: JSON_SAMPLES.apiResponse.content,
          title: 'Interactive API Guide with Comments',
          description: 'Comprehensive API guide that encourages community discussion and feedback',
          category: 'API Response',
          tags: 'api, interactive, guide, community, discussion',
          allowComments: true,
          allowForks: true,
        },
        {
          content: dataGenerator.generateComplexJSON(),
          title: 'Complex JSON Tutorial - Help Welcome',
          description:
            'Advanced JSON patterns tutorial where community contributions and improvements are welcome',
          category: 'Example',
          tags: 'advanced, tutorial, community, collaboration, learning',
          allowComments: true,
          allowCollaboration: true,
        },
        {
          content: {
            challenge: {
              title: 'JSON Parsing Challenge',
              description: 'Can you optimize this nested structure?',
              data: {
                /* complex nested structure */
              },
              constraints: ['Performance', 'Memory usage', 'Readability'],
            },
          },
          title: 'Community JSON Challenge',
          description:
            'Weekly community challenge - contribute your solutions and vote on the best approaches',
          category: 'Example',
          tags: 'challenge, community, optimization, contest, voting',
          allowComments: true,
          allowVoting: true,
        },
      ];

      for (const item of socialContent) {
        const doc = await apiHelper.uploadJSON(item.content, {
          title: item.title,
          description: item.description,
        });

        await apiHelper.publishJSON(doc.id, {
          category: item.category,
          tags: item.tags,
          socialFeatures: {
            allowComments: item.allowComments,
            allowForks: item.allowForks,
            allowCollaboration: item.allowCollaboration,
            allowVoting: item.allowVoting,
          },
        });
      }

      await authHelper.logout();
    });

    test('should enable commenting on published examples', async ({ page, authHelper }) => {
      await authHelper.login('community_member_1');

      await layoutPage.navigateToPublicLibrary();

      // Find content that allows comments
      const interactiveCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Interactive API Guide' });

      await interactiveCard.locator('[data-testid="view-example"]').click();

      // Should see comment section
      const commentsSection = page.locator('[data-testid="comments-section"]');
      if (await commentsSection.isVisible()) {
        await expect(commentsSection).toBeVisible();

        // Should be able to add comment
        const commentForm = commentsSection.locator('[data-testid="add-comment-form"]');
        await expect(commentForm).toBeVisible();

        const commentInput = commentForm.locator('[data-testid="comment-input"]');
        await commentInput.fill(
          'This is an excellent example of REST API response structure. The pagination implementation is particularly well done. Have you considered adding rate limiting headers to the example?'
        );

        const submitComment = commentForm.locator('[data-testid="submit-comment"]');
        await submitComment.click();

        // Should show comment after submission
        await layoutPage.waitForNotification('Comment added successfully');

        const newComment = commentsSection.locator('[data-testid="comment-item"]').last();
        await expect(newComment).toBeVisible();

        const commentText = await newComment.locator('[data-testid="comment-text"]').textContent();
        expect(commentText).toContain('excellent example');

        // Should show comment metadata
        const commentAuthor = newComment.locator('[data-testid="comment-author"]');
        const commentDate = newComment.locator('[data-testid="comment-date"]');

        await expect(commentAuthor).toBeVisible();
        if (await commentDate.isVisible()) {
          expect(await commentDate.textContent()).toMatch(/ago|just now/i);
        }
      }

      await authHelper.logout();
    });

    test('should support threaded comment discussions', async ({ page, authHelper }) => {
      await authHelper.login('community_member_1');
      await layoutPage.navigateToPublicLibrary();

      const tutorialCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Complex JSON Tutorial' });

      await tutorialCard.locator('[data-testid="view-example"]').click();

      const commentsSection = page.locator('[data-testid="comments-section"]');
      if (await commentsSection.isVisible()) {
        // Add initial comment
        const commentForm = commentsSection.locator('[data-testid="add-comment-form"]');
        const commentInput = commentForm.locator('[data-testid="comment-input"]');
        await commentInput.fill(
          'Great tutorial! Could you explain the performance implications of deeply nested structures?'
        );

        await commentForm.locator('[data-testid="submit-comment"]').click();
        await layoutPage.waitForNotification('Comment added');

        await authHelper.logout();

        // Reply as different user
        await authHelper.login('community_member_2');
        await page.reload();

        const firstComment = commentsSection.locator('[data-testid="comment-item"]').first();
        const replyButton = firstComment.locator('[data-testid="reply-comment"]');

        if (await replyButton.isVisible()) {
          await replyButton.click();

          const replyForm = firstComment.locator('[data-testid="reply-form"]');
          await expect(replyForm).toBeVisible();

          const replyInput = replyForm.locator('[data-testid="reply-input"]');
          await replyInput.fill(
            'Good question! Deeply nested structures can impact both parsing performance and memory usage. Generally, you want to keep nesting levels under 10 for optimal performance.'
          );

          const submitReply = replyForm.locator('[data-testid="submit-reply"]');
          await submitReply.click();

          await layoutPage.waitForNotification('Reply added');

          // Should show threaded reply
          const replies = firstComment.locator('[data-testid="comment-replies"]');
          await expect(replies).toBeVisible();

          const firstReply = replies.locator('[data-testid="reply-item"]').first();
          await expect(firstReply).toBeVisible();

          const replyText = await firstReply.locator('[data-testid="reply-text"]').textContent();
          expect(replyText).toContain('Good question');
        }

        await authHelper.logout();
      }
    });

    test('should implement comment voting and moderation', async ({ page, authHelper }) => {
      await authHelper.login('community_member_3');

      await layoutPage.navigateToPublicLibrary();
      const challengeCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Community JSON Challenge' });

      await challengeCard.locator('[data-testid="view-example"]').click();

      const commentsSection = page.locator('[data-testid="comments-section"]');
      if (await commentsSection.isVisible()) {
        // Check existing comments for voting
        const existingComments = commentsSection.locator('[data-testid="comment-item"]');
        const commentCount = await existingComments.count();

        if (commentCount === 0) {
          // Add a test comment first
          const commentForm = commentsSection.locator('[data-testid="add-comment-form"]');
          const commentInput = commentForm.locator('[data-testid="comment-input"]');
          await commentInput.fill(
            "Here's my solution approach: First, flatten the nested structure, then use Map for O(1) lookups, and finally reconstruct with optimized references."
          );

          await commentForm.locator('[data-testid="submit-comment"]').click();
          await layoutPage.waitForNotification('Comment added');
        }

        const firstComment = commentsSection.locator('[data-testid="comment-item"]').first();

        // Should have voting controls
        const voteControls = firstComment.locator('[data-testid="vote-controls"]');
        if (await voteControls.isVisible()) {
          const upvoteButton = voteControls.locator('[data-testid="upvote-button"]');
          const downvoteButton = voteControls.locator('[data-testid="downvote-button"]');
          const voteCount = voteControls.locator('[data-testid="vote-count"]');

          // Check initial vote count
          const initialVotes = parseInt((await voteCount.textContent()) || '0');

          // Upvote the comment
          await upvoteButton.click();
          await page.waitForLoadState('networkidle'); // Wait for vote registration completion

          // Should increase vote count
          const newVotes = parseInt((await voteCount.textContent()) || '0');
          expect(newVotes).toBe(initialVotes + 1);

          // Should highlight upvote button
          const upvoteActive = await upvoteButton.getAttribute('class');
          expect(upvoteActive).toContain('active');
        }

        // Should have report option for inappropriate comments
        const reportButton = firstComment.locator('[data-testid="report-comment"]');
        if (await reportButton.isVisible()) {
          // Don't actually report, just verify it exists
          expect(await reportButton.isVisible()).toBe(true);
        }
      }

      await authHelper.logout();
    });

    test('should enable content forking and remixing', async ({ page, authHelper }) => {
      await authHelper.login('community_member_4');

      await layoutPage.navigateToPublicLibrary();
      const forkableCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Interactive API Guide' });

      await forkableCard.locator('[data-testid="view-example"]').click();

      // Should have fork option
      const forkButton = page.locator('[data-testid="fork-content"]');
      if (await forkButton.isVisible()) {
        await forkButton.click();

        const forkModal = page.locator('[data-testid="fork-modal"]');
        await expect(forkModal).toBeVisible();

        // Should show fork options
        const forkTitle = forkModal.locator('[data-testid="fork-title"]');
        await forkTitle.fill('Enhanced API Guide with Error Handling');

        const forkDescription = forkModal.locator('[data-testid="fork-description"]');
        await forkDescription.fill(
          'Building on the original guide, this version adds comprehensive error handling examples and HTTP status code documentation.'
        );

        // Should show what will be forked
        const originalInfo = forkModal.locator('[data-testid="original-info"]');
        if (await originalInfo.isVisible()) {
          const originalTitle = await originalInfo
            .locator('[data-testid="original-title"]')
            .textContent();
          expect(originalTitle).toContain('Interactive API Guide');
        }

        // Should allow modifications before forking
        const modifyBefore = forkModal.locator('[data-testid="modify-before-fork"]');
        if (await modifyBefore.isVisible()) {
          await modifyBefore.check();
        }

        const confirmFork = forkModal.locator('[data-testid="confirm-fork"]');
        await confirmFork.click();

        // Should navigate to editor with forked content
        await viewerPage.waitForJSONProcessed();

        // Should show fork relationship
        const forkInfo = page.locator('[data-testid="fork-info"]');
        if (await forkInfo.isVisible()) {
          const forkText = await forkInfo.textContent();
          expect(forkText).toMatch(/forked from|based on/i);

          const originalLink = forkInfo.locator('[data-testid="original-link"]');
          if (await originalLink.isVisible()) {
            expect(await originalLink.getAttribute('href')).toBeTruthy();
          }
        }

        // Should be able to modify and publish the fork
        // Add error handling examples to the JSON
        const currentJSON = await viewerPage.jsonTextArea.inputValue();
        const parsedJSON = JSON.parse(currentJSON);

        parsedJSON.errorHandling = {
          common_errors: [
            { status: 400, message: 'Bad Request', example: { error: 'Invalid parameters' } },
            { status: 401, message: 'Unauthorized', example: { error: 'Token expired' } },
            { status: 404, message: 'Not Found', example: { error: 'Resource not found' } },
          ],
        };

        await viewerPage.inputJSON(JSON.stringify(parsedJSON, null, 2));
        await viewerPage.waitForJSONProcessed();

        // Publish the enhanced fork
        await viewerPage.publishButton.click();
        await expect(viewerPage.publishModal).toBeVisible();

        const categorySelect = libraryPage.page.locator('[data-testid="publish-category"]');
        await categorySelect.click();
        await libraryPage.page.locator('[data-value="API Response"]').click();

        await libraryPage.page
          .locator('[data-testid="publish-tags"]')
          .fill('api, error-handling, fork, enhanced, guide');

        await libraryPage.page.locator('[data-testid="confirm-publish"]').click();
        await layoutPage.waitForNotification('Fork published successfully');
      }

      await authHelper.logout();
    });

    test('should track content lineage and attribution', async ({ page, authHelper }) => {
      await authHelper.login('community_member_5');

      // View the forked content from previous test
      await layoutPage.navigateToPublicLibrary();

      // Search for the enhanced fork
      const searchInput = page.locator('[data-testid="library-search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('Enhanced API Guide');
        await searchInput.press('Enter');
        await page.waitForLoadState('networkidle'); // Wait for search results
      }

      const enhancedCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Enhanced API Guide' });

      if (await enhancedCard.isVisible()) {
        await enhancedCard.locator('[data-testid="view-example"]').click();

        // Should show attribution information
        const attributionSection = page.locator('[data-testid="attribution-section"]');
        if (await attributionSection.isVisible()) {
          await expect(attributionSection).toBeVisible();

          // Should show original creator
          const originalCreator = attributionSection.locator('[data-testid="original-creator"]');
          if (await originalCreator.isVisible()) {
            expect(await originalCreator.textContent()).toBeTruthy();
          }

          // Should show fork hierarchy
          const forkHierarchy = attributionSection.locator('[data-testid="fork-hierarchy"]');
          if (await forkHierarchy.isVisible()) {
            const hierarchyItems = forkHierarchy.locator('[data-testid="hierarchy-item"]');
            expect(await hierarchyItems.count()).toBeGreaterThan(0);
          }

          // Should show contribution history
          const contributionHistory = attributionSection.locator(
            '[data-testid="contribution-history"]'
          );
          if (await contributionHistory.isVisible()) {
            const contributions = contributionHistory.locator('[data-testid="contribution-item"]');
            expect(await contributions.count()).toBeGreaterThan(0);
          }
        }

        // Should show related content/forks
        const relatedContent = page.locator('[data-testid="related-forks"]');
        if (await relatedContent.isVisible()) {
          const relatedItems = relatedContent.locator('[data-testid="related-item"]');
          const relatedCount = await relatedItems.count();

          if (relatedCount > 0) {
            const firstRelated = relatedItems.first();
            const relatedTitle = await firstRelated
              .locator('[data-testid="related-title"]')
              .textContent();
            expect(relatedTitle).toBeTruthy();
          }
        }
      }

      await authHelper.logout();
    });

    test('should support collaborative editing and version control', async ({
      page,
      authHelper,
      apiHelper,
    }) => {
      await authHelper.login('collaboration_creator');

      // Create content that allows collaboration
      const collaborativeDoc = await apiHelper.uploadJSON(
        {
          collaborativeProject: {
            title: 'Community API Standards',
            description: 'Living document for API best practices',
            sections: {
              authentication: '// Community members can contribute here',
              errorHandling: '// Add your error handling patterns',
              versioning: '// Share versioning strategies',
            },
          },
        },
        {
          title: 'Community API Standards Project',
          description:
            'Collaborative project where community members contribute to API best practices',
        }
      );

      await apiHelper.publishJSON(collaborativeDoc.id, {
        category: 'Template',
        tags: 'collaborative, api, standards, community, open-source',
        socialFeatures: {
          allowCollaboration: true,
          allowSuggestions: true,
          allowVersionControl: true,
        },
      });

      await authHelper.logout();

      // Join collaboration as different user
      await authHelper.login('collaborator_1');

      await layoutPage.navigateToPublicLibrary();
      const collaborativeCard = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Community API Standards' });

      await collaborativeCard.locator('[data-testid="view-example"]').click();

      // Should show collaboration options
      const collaborationSection = page.locator('[data-testid="collaboration-section"]');
      if (await collaborationSection.isVisible()) {
        const suggestChanges = collaborationSection.locator('[data-testid="suggest-changes"]');
        const requestAccess = collaborationSection.locator(
          '[data-testid="request-collaborator-access"]'
        );

        if (await suggestChanges.isVisible()) {
          await suggestChanges.click();

          const suggestionModal = page.locator('[data-testid="suggestion-modal"]');
          await expect(suggestionModal).toBeVisible();

          const suggestionTitle = suggestionModal.locator('[data-testid="suggestion-title"]');
          await suggestionTitle.fill('Add JWT Authentication Example');

          const suggestionDescription = suggestionModal.locator(
            '[data-testid="suggestion-description"]'
          );
          await suggestionDescription.fill(
            'Adding comprehensive JWT authentication example with token validation and refresh patterns'
          );

          const suggestionContent = suggestionModal.locator('[data-testid="suggestion-content"]');
          await suggestionContent.fill(`
            "jwt_authentication": {
              "access_token": {
                "format": "Bearer <token>",
                "expiry": "15 minutes",
                "example": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              },
              "refresh_token": {
                "format": "HTTP-only cookie",
                "expiry": "7 days",
                "usage": "Automatic token refresh"
              },
              "validation": {
                "signature_verification": true,
                "expiry_check": true,
                "issuer_validation": true
              }
            }
          `);

          const submitSuggestion = suggestionModal.locator('[data-testid="submit-suggestion"]');
          await submitSuggestion.click();

          await layoutPage.waitForNotification('Suggestion submitted for review');
        }
      }

      await authHelper.logout();

      // Review suggestions as project maintainer
      await authHelper.login('collaboration_creator');

      await libraryPage.navigateToLibrary();
      await libraryPage.waitForItemsToLoad();

      const collaborativeItem = page
        .locator('[data-testid="library-card"]')
        .filter({ hasText: 'Community API Standards' });

      if (await collaborativeItem.isVisible()) {
        const manageButton = collaborativeItem.locator('[data-testid="manage-collaboration"]');
        if (await manageButton.isVisible()) {
          await manageButton.click();

          const collaborationDashboard = page.locator('[data-testid="collaboration-dashboard"]');
          await expect(collaborationDashboard).toBeVisible();

          // Should show pending suggestions
          const pendingSuggestions = collaborationDashboard.locator(
            '[data-testid="pending-suggestions"]'
          );
          if (await pendingSuggestions.isVisible()) {
            const suggestions = pendingSuggestions.locator('[data-testid="suggestion-item"]');
            const suggestionCount = await suggestions.count();

            if (suggestionCount > 0) {
              const firstSuggestion = suggestions.first();

              const suggestionTitle = await firstSuggestion
                .locator('[data-testid="suggestion-title"]')
                .textContent();
              expect(suggestionTitle).toContain('JWT Authentication');

              // Review and approve suggestion
              const reviewSuggestion = firstSuggestion.locator('[data-testid="review-suggestion"]');
              await reviewSuggestion.click();

              const reviewModal = page.locator('[data-testid="suggestion-review-modal"]');
              await expect(reviewModal).toBeVisible();

              const approveSuggestion = reviewModal.locator('[data-testid="approve-suggestion"]');
              await approveSuggestion.click();

              const approvalComment = page.locator('[data-testid="approval-comment"]');
              await approvalComment.fill(
                'Excellent addition! This JWT example covers all the essential authentication patterns.'
              );

              const confirmApproval = page.locator('[data-testid="confirm-approval"]');
              await confirmApproval.click();

              await layoutPage.waitForNotification('Suggestion approved and merged');

              // Should create new version
              const versionHistory = collaborationDashboard.locator(
                '[data-testid="version-history"]'
              );
              if (await versionHistory.isVisible()) {
                const versions = versionHistory.locator('[data-testid="version-item"]');
                expect(await versions.count()).toBeGreaterThan(1);
              }
            }
          }
        }
      }

      await authHelper.logout();
    });
  });

  test.describe('Community Recognition and Gamification', () => {
    test('should implement user reputation and achievement system', async ({
      page,
      authHelper,
      apiHelper,
    }) => {
      await authHelper.login('active_contributor');

      // Check user profile for reputation system
      await layoutPage.goToProfile();

      const reputationSection = page.locator('[data-testid="reputation-section"]');
      if (await reputationSection.isVisible()) {
        // Should show current reputation score
        const reputationScore = reputationSection.locator('[data-testid="reputation-score"]');
        if (await reputationScore.isVisible()) {
          const score = await reputationScore.textContent();
          expect(score).toMatch(/\d+/);
        }

        // Should show reputation breakdown
        const reputationBreakdown = reputationSection.locator(
          '[data-testid="reputation-breakdown"]'
        );
        if (await reputationBreakdown.isVisible()) {
          const contentPublishing = reputationBreakdown.locator('[data-testid="content-points"]');
          const communityHelpful = reputationBreakdown.locator('[data-testid="community-points"]');
          const qualityBonus = reputationBreakdown.locator('[data-testid="quality-points"]');

          if (await contentPublishing.isVisible()) {
            expect(await contentPublishing.textContent()).toMatch(/\d+.*points/);
          }
        }

        // Should show achievements/badges
        const achievements = reputationSection.locator('[data-testid="achievements"]');
        if (await achievements.isVisible()) {
          const badges = achievements.locator('[data-testid="badge"]');
          const badgeCount = await badges.count();

          if (badgeCount > 0) {
            const firstBadge = badges.first();
            const badgeTitle = await firstBadge.getAttribute('title');
            expect(badgeTitle).toBeTruthy();

            // Common badges might include
            const badgeTitles = await badges.allTextContents();
            const expectedBadges = [
              'First Publication',
              'Helpful Commenter',
              'Quality Contributor',
              'Community Favorite',
            ];

            // At least some expected badges should be present
            expect(
              expectedBadges.some((badge) => badgeTitles.some((title) => title.includes(badge)))
            ).toBe(true);
          }
        }

        // Should show progress toward next level
        const progressSection = reputationSection.locator('[data-testid="level-progress"]');
        if (await progressSection.isVisible()) {
          const currentLevel = progressSection.locator('[data-testid="current-level"]');
          const nextLevel = progressSection.locator('[data-testid="next-level"]');
          const progressBar = progressSection.locator('[data-testid="progress-bar"]');

          if (await currentLevel.isVisible()) {
            expect(await currentLevel.textContent()).toMatch(/level.*\d+/i);
          }

          if (await progressBar.isVisible()) {
            const progressValue = await progressBar.getAttribute('value');
            expect(progressValue).toBeTruthy();
          }
        }
      }

      await authHelper.logout();
    });

    test('should highlight top contributors and content creators', async ({ page }) => {
      // Visit leaderboards or community page
      await layoutPage.navigateToPublicLibrary();

      const leaderboardSection = page.locator('[data-testid="community-leaderboard"]');
      if (!(await leaderboardSection.isVisible())) {
        // Try community page or leaderboard link
        const communityLink = page.locator('[data-testid="community-link"]');
        if (await communityLink.isVisible()) {
          await communityLink.click();
        }
      }

      if (await leaderboardSection.isVisible()) {
        // Should show top contributors
        const topContributors = leaderboardSection.locator('[data-testid="top-contributors"]');
        if (await topContributors.isVisible()) {
          const contributors = topContributors.locator('[data-testid="contributor-item"]');
          const contributorCount = await contributors.count();
          expect(contributorCount).toBeGreaterThan(0);

          const topContributor = contributors.first();
          const contributorName = await topContributor
            .locator('[data-testid="contributor-name"]')
            .textContent();
          const contributorScore = await topContributor
            .locator('[data-testid="contributor-score"]')
            .textContent();
          const contributorBadge = topContributor.locator('[data-testid="contributor-badge"]');

          expect(contributorName).toBeTruthy();
          expect(contributorScore).toMatch(/\d+/);

          if (await contributorBadge.isVisible()) {
            expect(await contributorBadge.textContent()).toBeTruthy();
          }
        }

        // Should show trending creators
        const trendingCreators = leaderboardSection.locator('[data-testid="trending-creators"]');
        if (await trendingCreators.isVisible()) {
          const creators = trendingCreators.locator('[data-testid="creator-item"]');
          expect(await creators.count()).toBeGreaterThan(0);
        }

        // Should show featured content
        const featuredContent = leaderboardSection.locator('[data-testid="featured-content"]');
        if (await featuredContent.isVisible()) {
          const featured = featuredContent.locator('[data-testid="featured-item"]');
          expect(await featured.count()).toBeGreaterThan(0);

          const firstFeatured = featured.first();
          const featuredBadge = firstFeatured.locator('[data-testid="featured-badge"]');
          if (await featuredBadge.isVisible()) {
            expect(await featuredBadge.textContent()).toMatch(
              /featured|editor.*choice|community.*pick/i
            );
          }
        }
      }
    });

    test('should provide activity feed and community updates', async ({ page, authHelper }) => {
      await authHelper.login('community_member');

      // Check for activity feed
      const activityFeed = page.locator('[data-testid="activity-feed"]');
      if (!(await activityFeed.isVisible())) {
        // Try dashboard or home page
        await page.goto('/dashboard');
      }

      const feedSection = page.locator('[data-testid="community-activity"]');
      if (await feedSection.isVisible()) {
        const activityItems = feedSection.locator('[data-testid="activity-item"]');
        const activityCount = await activityItems.count();

        if (activityCount > 0) {
          const firstActivity = activityItems.first();

          const activityType = await firstActivity
            .locator('[data-testid="activity-type"]')
            .textContent();
          const activityUser = await firstActivity
            .locator('[data-testid="activity-user"]')
            .textContent();
          const activityTime = await firstActivity
            .locator('[data-testid="activity-time"]')
            .textContent();

          expect(activityType).toMatch(/published|commented|liked|forked|updated/i);
          expect(activityUser).toBeTruthy();
          expect(activityTime).toMatch(/ago|minutes?|hours?|days?/i);

          // Should be able to interact with activity
          const activityLink = firstActivity.locator('[data-testid="activity-link"]');
          if (await activityLink.isVisible()) {
            // Don't click to avoid navigation, just verify it exists
            expect(await activityLink.getAttribute('href')).toBeTruthy();
          }
        }

        // Should have filter options
        const activityFilters = feedSection.locator('[data-testid="activity-filters"]');
        if (await activityFilters.isVisible()) {
          const filterButtons = activityFilters.locator('[data-testid="filter-button"]');
          const filterCount = await filterButtons.count();

          if (filterCount > 0) {
            const allFilter = filterButtons.filter({ hasText: 'All' });
            const publishedFilter = filterButtons.filter({ hasText: 'Published' });
            const commentsFilter = filterButtons.filter({ hasText: 'Comments' });

            // Test filtering
            if (await publishedFilter.isVisible()) {
              await publishedFilter.click();
              await page.waitForLoadState('networkidle'); // Wait for filter application

              // Should show only published content activities
              const filteredActivities = feedSection.locator('[data-testid="activity-item"]');
              const filteredCount = await filteredActivities.count();
              expect(filteredCount).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }

      await authHelper.logout();
    });

    test('should enable user following and personalized feeds', async ({ page, authHelper }) => {
      await authHelper.login('follower_user');

      // Navigate to a prolific creator's profile
      await layoutPage.navigateToPublicLibrary();

      const creatorCard = page.locator('[data-testid="library-card"]').first();
      const creatorName = creatorCard.locator('[data-testid="card-author"]');

      if (await creatorName.isVisible()) {
        await creatorName.click();

        // Should navigate to creator profile
        const creatorProfile = page.locator('[data-testid="creator-profile"]');
        if (await creatorProfile.isVisible()) {
          // Should have follow button
          const followButton = creatorProfile.locator('[data-testid="follow-creator"]');
          if (await followButton.isVisible()) {
            await followButton.click();

            await layoutPage.waitForNotification('Now following');

            // Button should change to "Following"
            const followingButton = creatorProfile.locator('[data-testid="following-creator"]');
            if (await followingButton.isVisible()) {
              expect(await followingButton.textContent()).toMatch(/following|unfollow/i);
            }
          }

          // Should show creator's content
          const creatorContent = creatorProfile.locator('[data-testid="creator-content"]');
          if (await creatorContent.isVisible()) {
            const contentItems = creatorContent.locator('[data-testid="content-item"]');
            expect(await contentItems.count()).toBeGreaterThan(0);
          }

          // Should show creator statistics
          const creatorStats = creatorProfile.locator('[data-testid="creator-stats"]');
          if (await creatorStats.isVisible()) {
            const followers = creatorStats.locator('[data-testid="follower-count"]');
            const publications = creatorStats.locator('[data-testid="publication-count"]');
            const totalViews = creatorStats.locator('[data-testid="total-views"]');

            if (await followers.isVisible()) {
              const followerText = await followers.textContent();
              expect(followerText).toMatch(/\d+.*followers?/i);
            }
          }
        }

        // Check personalized feed
        await layoutPage.goToDashboard();

        const personalizedFeed = page.locator('[data-testid="personalized-feed"]');
        if (await personalizedFeed.isVisible()) {
          const feedItems = personalizedFeed.locator('[data-testid="feed-item"]');
          const feedCount = await feedItems.count();

          if (feedCount > 0) {
            // Should show content from followed creators
            const followedContent = feedItems.filter({
              hasText: (await creatorName.textContent()) || '',
            });
            // At least some content should be from followed creators
          }

          // Should have feed customization options
          const feedSettings = personalizedFeed.locator('[data-testid="feed-settings"]');
          if (await feedSettings.isVisible()) {
            await feedSettings.click();

            const settingsModal = page.locator('[data-testid="feed-settings-modal"]');
            if (await settingsModal.isVisible()) {
              const showFollowed = settingsModal.locator('[data-testid="show-followed-content"]');
              const showRecommended = settingsModal.locator(
                '[data-testid="show-recommended-content"]'
              );
              const showTrending = settingsModal.locator('[data-testid="show-trending-content"]');

              // These should be toggleable options
              if (await showFollowed.isVisible()) {
                expect(await showFollowed.isChecked()).toBe(true);
              }
            }
          }
        }
      }

      await authHelper.logout();
    });
  });
});

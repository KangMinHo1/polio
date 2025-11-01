/**
 * trends.js
 * Handles fetching and rendering data for the Portfolio Trends Dashboard page.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // ✅ [수정] APP_INITIALIZATION을 기다립니다.
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;

    const elements = {
        popularTechList: document.getElementById('popular-tech-list'),
        commonFeedbackList: document.getElementById('common-feedback-list'),
        successCount: document.getElementById('success-count'),
        successCategoryList: document.getElementById('success-category-list'),
        topMentorCategoryList: document.getElementById('top-mentor-category-list')
    };

    // Helper function to render a list
    const renderList = (element, data, keyLabel = "항목", valueLabel = "언급 횟수") => {
        if (!element) return;
        if (!data || data.length === 0) {
            element.innerHTML = `<li>관련 데이터가 없습니다.</li>`;
            return;
        }
        element.innerHTML = data.map(item => `
            <li>
                <span class="trend-key">${item.key}</span>
                <span class="trend-value">${item.value}회</span>
            </li>
        `).join('');
    };

    // Fetch and Render Trends Data
    try {
        // ✅ 이제 app.state 데이터가 로드된 후에 이 API가 호출됩니다.
        const trendsData = await app.api.calculatePortfolioTrends();

        // 1. Popular Tech Stacks
        renderList(elements.popularTechList, trendsData.popularTechStacks, "기술 스택", "언급 횟수");

        // 2. Common Feedback Points
        renderList(elements.commonFeedbackList, trendsData.commonFeedbackPoints, "피드백 키워드", "언급 횟수");

        // 3. Success Portfolio Stats
        if (elements.successCount) {
            elements.successCount.textContent = trendsData.successPortfolioStats.count;
        }
        renderList(elements.successCategoryList, trendsData.successPortfolioStats.categories, "직무 카테고리", "성공 횟수");

        // 4. Top Mentor Categories
        renderList(elements.topMentorCategoryList, trendsData.topMentorCategories, "직무 카테고리", "멘토링 횟수");

    } catch (error) {
        console.error("Failed to load trends data:", error);
        Object.values(elements).forEach(el => {
            if (el && el.tagName === 'UL') {
                el.innerHTML = '<li>데이터를 불러오는 데 실패했습니다.</li>';
            } else if (el && el.id === 'success-count') {
                el.textContent = '?';
            }
        });
        app.utils.showNotification('트렌드 데이터를 불러오는 데 실패했습니다.', 'danger');
    }
});
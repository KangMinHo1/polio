/**
 * trends.js
 * Handles fetching and rendering data for the Portfolio Trends Dashboard page.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // ✅ [수정] APP_INITIALIZATION을 기다립니다.
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;

    // Fetch and Render Trends Data
    try {
        // ✅ 이제 app.state 데이터가 로드된 후에 이 API가 호출됩니다.
        const trendsData = await app.api.calculatePortfolioTrends();

        // 1. Popular Tech Stacks
        const popularTechCtx = document.getElementById('popular-tech-chart')?.getContext('2d');
        if (popularTechCtx) {
            new Chart(popularTechCtx, {
                type: 'bar',
                data: {
                    labels: trendsData.popularTechStacks.map(item => item.key),
                    datasets: [{
                        label: '언급 횟수',
                        data: trendsData.popularTechStacks.map(item => item.value),
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y', // 가로 막대 그래프
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        }

        // 2. Common Feedback Points
        const commonFeedbackCtx = document.getElementById('common-feedback-chart')?.getContext('2d');
        if (commonFeedbackCtx) {
            new Chart(commonFeedbackCtx, {
                type: 'doughnut',
                data: {
                    labels: trendsData.commonFeedbackPoints.map(item => item.key),
                    datasets: [{
                        data: trendsData.commonFeedbackPoints.map(item => item.value),
                        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // 3. Success Portfolio Stats
        const successCategoryCtx = document.getElementById('success-category-chart')?.getContext('2d');
        if (successCategoryCtx) {
            new Chart(successCategoryCtx, {
                type: 'bar',
                data: {
                    labels: trendsData.successPortfolioStats.categories.map(item => item.key),
                    datasets: [{
                        label: `성공 사례 (${trendsData.successPortfolioStats.count}건)`,
                        data: trendsData.successPortfolioStats.categories.map(item => item.value),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // 4. Top Mentor Categories
        const topMentorCtx = document.getElementById('top-mentor-category-chart')?.getContext('2d');
        if (topMentorCtx) {
            new Chart(topMentorCtx, {
                type: 'polarArea',
                data: {
                    labels: trendsData.topMentorCategories.map(item => item.key),
                    datasets: [{
                        data: trendsData.topMentorCategories.map(item => item.value),
                        backgroundColor: ['#FF9F40', '#C9CBCF', '#9966FF'],
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

    } catch (error) {
        console.error("Failed to load trends data:", error);
        document.querySelector('.trends-grid').innerHTML = '<p>트렌드 데이터를 불러오는 데 실패했습니다.</p>';
        app.utils.showNotification('트렌드 데이터를 불러오는 데 실패했습니다.', 'danger');
    }
});
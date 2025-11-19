/**
 * mentors.js
 * 멘토 목록 페이지의 동적 기능을 담당합니다.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;

    const elements = {
        container: document.getElementById('mentor-list-container'),
    };

    async function renderMentorList() {
        if (!elements.container) return;

        try {
            const allUsers = await app.api.fetchAllUsers();
            const allPosts = await app.api.fetchPosts();
            const allComments = await app.api.fetchAllComments();

            const mentors = allUsers.filter(user => {
                // 하위 호환성 보장
                if (user.isMentor === undefined) {
                    return user.category === '재직자' || user.role === 'admin';
                }
                return user.isMentor;
            });

            if (mentors.length === 0) {
                elements.container.innerHTML = '<p>아직 등록된 멘토가 없습니다.</p>';
                return;
            }

            const mentorData = mentors.map(mentor => {
                const userComments = allComments.filter(c => c.author === mentor.id);
                const bestAnswers = userComments.filter(c => c.isBest).length;
                const hiredCount = allPosts.filter(p => 
                    p.isHiredSuccess && userComments.some(c => c.isBest && c.postId === p.id)
                ).length;
                
                return {
                    ...mentor,
                    stats: {
                        bestAnswers,
                        hiredCount
                    }
                };
            }).sort((a, b) => b.stats.hiredCount - a.stats.hiredCount || b.stats.bestAnswers - a.stats.bestAnswers);

            elements.container.innerHTML = mentorData.map(mentor => `
                <a href="profile.html?user=${mentor.id}" class="mentor-item">
                    <span class="mentor-info">
                        <strong class="mentor-id">${mentor.id}</strong>
                        <span class="mentor-category">${mentor.category}</span>
                    </span>
                    <span class="mentor-stats">
                        <span>🏆 베스트 피드백 <strong>${mentor.stats.bestAnswers}</strong></span>
                        <span>🚀 취업 성공 도움 <strong>${mentor.stats.hiredCount}</strong></span>
                    </span>
                </a>
            `).join('');

        } catch (error) {
            console.error("멘토 목록을 불러오는 중 오류 발생:", error);
            elements.container.innerHTML = '<p>멘토 목록을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.</p>';
        }
    }

    renderMentorList();
});
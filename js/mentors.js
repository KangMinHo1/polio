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
            const allUsers = app.state.users; // ✅ [수정] app.state에 이미 로드된 데이터를 사용합니다.
            const allComments = await app.api.fetchAllComments();

            const mentors = allUsers.filter(user => {
                // ✅ [수정] 영문 Enum 이름 대신 한글 역할명과 비교합니다.
                // 하위 호환성 보장: isMentor 속성이 없으면 role로 판단
                if (user.isMentor === undefined) {
                    return user.role === '재직자' || user.role === '관리자';
                }
                return user.isMentor;
            });

            if (mentors.length === 0) {
                elements.container.innerHTML = '<p>아직 등록된 멘토가 없습니다.</p>';
                return;
            }

            const mentorData = mentors.map(mentor => {
                // ✅ [수정] id 대신 name으로 댓글 작성자를 찾습니다.
                const userComments = allComments.filter(c => c.author === mentor.name);
                const bestAnswers = userComments.filter(c => c.isBest).length;
                
                return {
                    ...mentor,
                    stats: {
                        bestAnswers
                    }
                };
            }).sort((a, b) => b.stats.hiredCount - a.stats.hiredCount || b.stats.bestAnswers - a.stats.bestAnswers);

            elements.container.innerHTML = mentorData.map(mentor => `
                <a href="profile.html?user=${mentor.name}" class="mentor-item">
                    <span class="mentor-info">
                        <strong class="mentor-id">${mentor.name}</strong>
                        <span class="mentor-category">${mentor.role}</span>
                    </span>
                    <span class="mentor-stats">
                        <span>🏆 베스트 피드백 <strong>${mentor.stats.bestAnswers}</strong></span>
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
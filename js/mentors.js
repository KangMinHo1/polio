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

    function disableMentorPage() {
        app.utils.showNotification('현재 지원하지 않는 기능입니다.', 'warning');
        setTimeout(() => { window.location.href = 'mainview.html'; }, 1500);
    }

    disableMentorPage();
});
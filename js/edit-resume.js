/**
 * edit-resume.js
 * 멘토 이력서 작성/수정 페이지의 동적 기능을 담당합니다.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    // 1. 로그인 및 멘토 여부 확인
    if (!currentUser) {
        app.utils.showNotification('로그인이 필요한 페이지입니다.', 'warning');
        setTimeout(() => { window.location.href = 'mainview.html'; }, 1500);
        return;
    }

    const elements = {
        form: document.getElementById('resume-form'),
        companyInput: document.getElementById('mentor-company'),
        experienceInput: document.getElementById('mentor-experience'),
        skillsInput: document.getElementById('mentor-skills'),
        imageInput: document.getElementById('mentor-project-image'),
        imagePreviewContainer: document.getElementById('mentor-image-preview-container'),
        imagePreview: document.getElementById('mentor-image-preview'),
        removeImageBtn: document.getElementById('remove-image-btn'),
        cancelBtn: document.getElementById('cancel-btn'),
        submitBtn: document.getElementById('submit-btn'),
    };

    let imageDataUrl = null;
    let existingApplication = null;

    // 2. 기존 이력서 정보 불러오기
    async function loadResumeData() {
        const applications = await app.api.fetchMentorApplications();
        // 'approved' 상태가 아니더라도 자신의 이력서 정보를 찾습니다.
        // (멘토가 아닌 사용자는 'resume_only' 상태를 가질 수 있습니다)
        existingApplication = applications.find(a => a.userId === currentUser.id);

        if (existingApplication && existingApplication.resume) {
            const resume = existingApplication.resume;
            elements.companyInput.value = resume.company || '';
            elements.experienceInput.value = resume.experience || '';
            elements.skillsInput.value = resume.skills || '';
            if (resume.projectImage) {
                imageDataUrl = resume.projectImage;
                elements.imagePreview.src = imageDataUrl;
                elements.imagePreviewContainer.style.display = 'block';
            }
        }
    }

    // 3. 이벤트 리스너 설정
    function setupEventListeners() {
        elements.form.addEventListener('submit', handleFormSubmit);
        elements.cancelBtn.addEventListener('click', () => {
            window.location.href = `profile.html?user=${currentUser.id}`;
        });

        elements.imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imageDataUrl = event.target.result;
                    elements.imagePreview.src = imageDataUrl;
                    elements.imagePreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        elements.removeImageBtn.addEventListener('click', () => {
            elements.imageInput.value = '';
            imageDataUrl = null;
            elements.imagePreview.src = '#';
            elements.imagePreviewContainer.style.display = 'none';
        });
    }

    // 4. 폼 제출 핸들러
    async function handleFormSubmit(e) {
        e.preventDefault();
        elements.submitBtn.disabled = true;
        elements.submitBtn.textContent = '저장 중...';

        const resumeData = {
            company: elements.companyInput.value.trim(),
            experience: elements.experienceInput.value.trim(),
            skills: elements.skillsInput.value.trim(),
            projectImage: imageDataUrl
        };

        if (!resumeData.company || !resumeData.experience || !resumeData.skills) {
            app.utils.showNotification('직장, 경력, 기술 정보는 필수입니다.', 'warning');
            elements.submitBtn.disabled = false;
            elements.submitBtn.textContent = '저장하기';
            return;
        }

        try {
            // 이력서 정보만 업데이트/생성합니다. 멘토 신청과는 무관합니다.
            await app.api.updateMentorResume(currentUser.id, resumeData);
            
            app.utils.showNotification('이력서 정보가 성공적으로 저장되었습니다.', 'success');
            setTimeout(() => {
                window.location.href = `profile.html?user=${currentUser.id}`;
            }, 1000);
        } catch (error) {
            app.utils.showNotification(error.message || '저장에 실패했습니다.', 'danger');
            elements.submitBtn.disabled = false;
            elements.submitBtn.textContent = '저장하기';
        }
    }

    // --- 페이지 초기화 실행 ---
    await loadResumeData();
    setupEventListeners();
});
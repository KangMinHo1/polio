/**
 * write.js
 * 피드백 요청 페이지의 동적 기능을 담당합니다.
 */

// 파일을 Base64로 읽는 헬퍼 함수
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}
let projectCount = 0;
function createProjectField(isFirst = false) {
    projectCount++;
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'feedback-fieldset';
    fieldset.innerHTML = `
        <legend>
            <span>프로젝트 ${projectCount}</span>
            <button type="button" class="btn btn--danger btn-delete-project" ${isFirst ? 'style="display: none;"' : ''}>삭제</button>
        </legend>
        <div class="form-group">
            <label>프로젝트 제목</label>
            <input type="text" class="project-title-input" placeholder="예: 피드백 커뮤니티 사이트">
        </div>
        <div class="form-group">
            <label>프로젝트 링크 (선택)</label>
            <input type="text" class="project-link-input" placeholder="GitHub, 배포 URL, Notion 등">
        </div>
        <div class="form-group">
            <label>사용한 기술 스택 (선택)</label>
            <input type="text" class="project-techstack-input" placeholder="예: React, Spring Boot, Java, AWS">
        </div>
        <div class="form-group">
            <label>설명 및 고민 ${isFirst ? '(필수)' : '(선택)'}</label>
            <textarea class="project-desc-input" rows="5" placeholder="프로젝트에 대해 설명하고, 개발 중 겪은 어려움이나 고민을 작성해주세요." ${isFirst ? 'required' : ''}></textarea>
        </div>
    `;
    return fieldset;
}
function relabelProjectFields() {
    const container = document.getElementById('projects-container');
    const fieldsets = container.querySelectorAll('.feedback-fieldset');
    projectCount = fieldsets.length;
    fieldsets.forEach((fieldset, index) => {
        const legendSpan = fieldset.querySelector('legend span');
        const deleteBtn = fieldset.querySelector('.btn-delete-project');
        const descLabel = fieldset.querySelector('.project-desc-input').previousElementSibling;
        legendSpan.textContent = `프로젝트 ${index + 1}`;
        if (index === 0) {
            deleteBtn.style.display = 'none';
            descLabel.textContent = '설명 및 고민 (필수)';
            fieldset.querySelector('.project-desc-input').required = true;
        } else {
            deleteBtn.style.display = 'inline-flex';
            descLabel.textContent = '설명 및 고민 (선택)';
            fieldset.querySelector('.project-desc-input').required = false;
        }
    });
}


document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    if (!currentUser) {
        app.utils.showNotification('로그인이 필요합니다.', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const elements = {
        form: document.getElementById('write-form'),
        pageTitle: document.getElementById('page-title'),
        pageDescription: document.getElementById('page-description'),
        submitButton: document.getElementById('submit-button'),
        postId: document.getElementById('write-post-id'),
        category: document.getElementById('write-category'),
        title: document.getElementById('write-title'),
        portfolioLink: document.getElementById('write-link'),
        importantCheckbox: document.getElementById('write-important'),
        fileInput: document.getElementById('write-file'),
        fileInfoDisplay: document.getElementById('file-info-display'),
        postTypeSelector: document.getElementById('post-type-selector'),
        postTypeRadios: document.querySelectorAll('input[name="postType"]'),
        
        feedbackTemplateFields: document.getElementById('feedback-template-fields'),
        casestudyContentField: document.getElementById('casestudy-content-field'),
        contentLegacy: document.getElementById('write-content'),
        
        projectsContainer: document.getElementById('projects-container'),
        addProjectBtn: document.getElementById('add-project-btn'),
        
        feedbackQuestions: document.getElementById('feedback-questions'),
        feedbackTagsCheckboxes: document.querySelectorAll('input[name="feedbackTag"]'),
        feedbackTagsOther: document.getElementById('feedback-tags-other') // ✅ [추가]
    };

    // --- Edit Mode Check ---
    const urlParams = new URLSearchParams(window.location.search);
    const editPostIdParam = urlParams.get('edit');
    let isEditMode = false;
    let editPostData = null;

    if (editPostIdParam) {
        const postId = parseInt(editPostIdParam, 10);
        editPostData = app.state.posts.find(p => p.id === postId);
        
        if (editPostData) {
            if (editPostData.author !== currentUser.id && currentUser.role !== 'admin') {
                app.utils.showNotification('수정 권한이 없습니다.', 'danger');
                setTimeout(() => { window.location.href = `posts.html#post-${postId}`; }, 1500);
                return;
            }
            if ((editPostData.isResolved || editPostData.isHiredSuccess) && currentUser.role !== 'admin') {
                app.utils.showNotification('이미 완료된 요청은 수정할 수 없습니다.', 'warning');
                setTimeout(() => { window.location.href = `posts.html#post-${postId}`; }, 1500);
                return;
            }
            isEditMode = true;
        } else {
            app.utils.showNotification('존재하지 않는 게시글입니다.', 'danger');
        }
    }

    function initializeWritePage() {
        populateCategories();
        setupEventListeners();

        if ((currentUser.category === '재직자' || currentUser.role === 'admin') && !isEditMode) {
            elements.postTypeSelector.style.display = 'block';
        }
        if (currentUser.role === 'admin') {
             const importantGroup = document.getElementById('important-group');
             if (importantGroup) importantGroup.style.display = 'block';
        }

        if (isEditMode) {
            loadPostDataForEdit();
        } else {
            elements.feedbackTemplateFields.style.display = 'block';
            elements.casestudyContentField.style.display = 'none';
            projectCount = 0;
            elements.projectsContainer.appendChild(createProjectField(true));
        }
    }

    function populateCategories() {
        if (!elements.category) return;
        const categoriesForUser = app.state.categories.filter(c => c !== '공지');
        categoriesForUser.forEach(category => {
            elements.category.add(new Option(category, category));
        });
        if (currentUser.role === 'admin') {
            const noticeOption = new Option('공지', '공지');
            elements.category.prepend(noticeOption);
        }
    }

    function loadPostDataForEdit() {
        elements.pageTitle.textContent = '게시글 수정하기';
        elements.pageDescription.textContent = '게시글 내용을 수정합니다.';
        elements.submitButton.textContent = '수정 완료';
        
        elements.postId.value = editPostData.id;
        elements.category.value = editPostData.category;
        elements.title.value = editPostData.title;
        elements.portfolioLink.value = editPostData.portfolioLink || '';
        elements.importantCheckbox.checked = editPostData.isImportant;

        const postType = editPostData.postType || 'feedback';
        const radioToCheck = document.querySelector(`input[name="postType"][value="${postType}"]`);
        if (radioToCheck) radioToCheck.checked = true;
        elements.postTypeRadios.forEach(radio => radio.disabled = true);
        if(elements.postTypeSelector) elements.postTypeSelector.style.backgroundColor = 'var(--bg-tertiary)';
        if(elements.postTypeSelector) elements.postTypeSelector.style.display = 'block';

        if (postType === 'feedback') {
            elements.feedbackTemplateFields.style.display = 'block';
            elements.casestudyContentField.style.display = 'none';
            
            try {
                const data = JSON.parse(editPostData.content);
                if (data.projects && Array.isArray(data.projects)) {
                    projectCount = 0;
                    elements.projectsContainer.innerHTML = '';
                    data.projects.forEach((project, index) => {
                        const isFirst = index === 0;
                        const newFieldset = createProjectField(isFirst);
                        elements.projectsContainer.appendChild(newFieldset);
                        newFieldset.querySelector('.project-title-input').value = project.title || '';
                        newFieldset.querySelector('.project-link-input').value = project.link || '';
                        newFieldset.querySelector('.project-techstack-input').value = project.techStack || '';
                        newFieldset.querySelector('.project-desc-input').value = project.desc || '';
                    });
                }
                elements.feedbackQuestions.value = data.questions || '';
                
                // ✅ [수정] 저장된 태그를 '체크박스'와 '기타' 입력란으로 분리
                if (data.feedbackTags && Array.isArray(data.feedbackTags)) {
                    const predefinedTags = Array.from(elements.feedbackTagsCheckboxes).map(cb => cb.value);
                    const customTags = [];
                    
                    data.feedbackTags.forEach(tag => {
                        const checkbox = document.querySelector(`input[name="feedbackTag"][value="${tag}"]`);
                        if (checkbox) {
                            checkbox.checked = true;
                        } else if (tag) { // null이나 empty string 방지
                            customTags.push(tag);
                        }
                    });
                    
                    if (customTags.length > 0) {
                        elements.feedbackTagsOther.value = customTags.join(', ');
                    }
                }
                
            } catch (e) {
                elements.projectsContainer.appendChild(createProjectField(true));
                elements.feedbackQuestions.value = editPostData.content;
            }
        } else { // 'casestudy'
            elements.feedbackTemplateFields.style.display = 'none';
            elements.casestudyContentField.style.display = 'block';
            elements.contentLegacy.value = editPostData.content;
        }

        if (editPostData.file) {
            elements.fileInput.disabled = true;
            elements.fileInfoDisplay.innerHTML = `(첨부된 파일: ${editPostData.file.name}) (파일은 수정할 수 없습니다.)`;
        }
    }

    function setupEventListeners() {
        if (elements.form) elements.form.addEventListener('submit', handleFormSubmit);

        elements.postTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const type = e.target.value;
                if (type === 'feedback') {
                    elements.feedbackTemplateFields.style.display = 'block';
                    elements.casestudyContentField.style.display = 'none';
                    elements.pageTitle.textContent = '피드백 요청하기';
                    elements.pageDescription.textContent = '포트폴리오, 이력서 링크를 공유하고 피드백을 요청해보세요.';
                    elements.submitButton.textContent = '피드백 요청';
                } else { // 'casestudy'
                    elements.feedbackTemplateFields.style.display = 'none';
                    elements.casestudyContentField.style.display = 'block';
                    elements.pageTitle.textContent = '케이스 스터디 작성';
                    elements.pageDescription.textContent = '우수/개선 포트폴리오를 분석하고 인사이트를 공유해보세요.';
                    elements.submitButton.textContent = '스터디 등록';
                }
            });
        });
        
        if (elements.addProjectBtn) {
            elements.addProjectBtn.addEventListener('click', () => {
                elements.projectsContainer.appendChild(createProjectField());
                relabelProjectFields();
            });
        }
        if (elements.projectsContainer) {
            elements.projectsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-delete-project')) {
                    e.target.closest('fieldset').remove();
                    relabelProjectFields();
                }
            });
        }
        
        // ✅ [삭제] 태그 3개 제한 로직 삭제
    }
    
    async function handleFormSubmit(e) { 
        e.preventDefault(); 
        const file = elements.fileInput.files[0];
        let fileData = null;
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        if (!isEditMode && file) {
            submitButton.textContent = '파일 업로드 중...';
            try {
                const fileContent = await readFileAsBase64(file);
                fileData = { name: file.name, content: fileContent, type: file.type };
            } catch (error) {
                app.utils.showNotification('파일을 읽는 중 오류가 발생했습니다.', 'danger');
                submitButton.disabled = false;
                submitButton.textContent = isEditMode ? '수정 완료' : (selectedPostType === 'feedback' ? '피드백 요청' : '스터디 등록');
                return;
            }
        } else if (isEditMode) { fileData = editPostData.file; }

        const selectedPostType = isEditMode
            ? (editPostData.postType || 'feedback')
            : document.querySelector('input[name="postType"]:checked').value;
        
        let contentData;
        let isContentValid = false;
        
        if (selectedPostType === 'feedback') {
            const projects = [];
            const fieldsets = elements.projectsContainer.querySelectorAll('.feedback-fieldset');
            
            fieldsets.forEach(fieldset => {
                const project = {
                    title: fieldset.querySelector('.project-title-input').value.trim(),
                    link: fieldset.querySelector('.project-link-input').value.trim(),
                    techStack: fieldset.querySelector('.project-techstack-input').value.trim(),
                    desc: fieldset.querySelector('.project-desc-input').value.trim()
                };
                if (project.title || project.desc) {
                    projects.push(project);
                }
            });

            const questions = elements.feedbackQuestions.value.trim();
            
            // ✅ [수정] 체크박스 태그와 '기타' 태그 모두 수집
            let feedbackTags = Array.from(elements.feedbackTagsCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            
            const otherTags = elements.feedbackTagsOther.value.trim();
            if (otherTags) {
                const customTags = otherTags.split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
                feedbackTags = [...feedbackTags, ...customTags];
            }

            const structuredData = {
                projects: projects,
                questions: questions,
                feedbackTags: feedbackTags // 최종 태그 배열
            };
            
            contentData = JSON.stringify(structuredData);
            const firstProjectDesc = fieldsets.length > 0 ? fieldsets[0].querySelector('.project-desc-input').value.trim() : false;
            isContentValid = firstProjectDesc && questions;
            
        } else { // 'casestudy'
            contentData = elements.contentLegacy.value.trim();
            isContentValid = !!contentData;
        }

        const postData = {
            title: elements.title.value.trim(),
            content: contentData,
            category: elements.category.value,
            portfolioLink: elements.portfolioLink.value.trim() || null,
            isImportant: (currentUser.role === 'admin') ? elements.importantCheckbox.checked : (isEditMode ? editPostData.isImportant : false),
            file: fileData,
            postType: selectedPostType
        };

        if (!postData.title || !isContentValid) {
            app.utils.showNotification('제목과 필수 내용(최소 1개의 프로젝트 설명, 질문)을 모두 입력해주세요.', 'warning');
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? '수정 완료' : (selectedPostType === 'feedback' ? '피드백 요청' : '스터디 등록');
            return;
        }
        
        try {
            if (isEditMode) {
                // --- UPDATE (수정) ---
                submitButton.textContent = '수정 중...';
                const postId = parseInt(elements.postId.value, 10);
                await app.api.updatePost(postId, postData);
                const postIndex = app.state.posts.findIndex(p => p.id === postId);
                if (postIndex > -1) {
                    app.state.posts[postIndex] = { ...app.state.posts[postIndex], ...postData };
                }
                app.utils.showNotification('게시글이 성공적으로 수정되었습니다!', 'success');
                setTimeout(() => { window.location.href = `posts.html#post-${postId}`; }, 1500);
            
            } else {
                // --- CREATE (새 글) ---
                submitButton.textContent = '등록 중...';
                const newPost = await app.api.createPost(postData);
                app.utils.showNotification('게시글이 성공적으로 등록되었습니다!', 'success');
                setTimeout(() => { window.location.href = `posts.html#post-${newPost.id}`; }, 1500);
            }
        } catch (error) {
            console.error('Submit error:', error);
            app.utils.showNotification('작업에 실패했습니다.', 'danger');
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? '수정 완료' : (selectedPostType === 'feedback' ? '피드백 요청' : '스터디 등록');
        }
    }

    initializeWritePage();
});
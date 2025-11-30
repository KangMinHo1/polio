
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
        feedbackQuestions: document.getElementById('feedback-questions'),
    };

    const urlParams = new URLSearchParams(window.location.search);
    const editPostIdParam = urlParams.get('edit');
    let isEditMode = false;
    let editPostData = null;

    if (editPostIdParam) {
        const postId = parseInt(editPostIdParam, 10);
        
        try {
            editPostData = await app.api.fetchPostById(postId);
        } catch (error) {
            app.utils.showNotification('게시글 정보를 불러오는 데 실패했습니다.', 'danger');
            return;
        }
        
        if (editPostData) { //게시글 작성 본인, 관리자가 아니면 수정 불가
            if (editPostData.author !== currentUser.name && currentUser.role !== '관리자') { // 수정 권한 확인
                app.utils.showNotification('수정 권한이 없습니다.', 'danger');
                setTimeout(() => { window.location.href = `post-detail.html?id=${postId}`; }, 1500);
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
        
        if (currentUser.role === '관리자') {
             const importantGroup = document.getElementById('important-group');
             if (importantGroup) importantGroup.style.display = 'block';
        }

        if (isEditMode) { 
            loadPostDataForEdit();
        }
    }

    function populateCategories() {
        if (!elements.category) return;

        let categoriesToShow = app.state.categories || [];

        if (currentUser.role !== '관리자') {
            categoriesToShow = categoriesToShow.filter(category => category !== '공지');
        }

        categoriesToShow.forEach(category => {
            elements.category.add(new Option(category, category));
        });
    }

    function loadPostDataForEdit() {
        elements.pageTitle.textContent = '게시글 수정하기';
        elements.pageDescription.textContent = '게시글 내용을 수정합니다.';
        elements.submitButton.textContent = '수정 완료';
        
        elements.postId.value = editPostData.id;
        elements.category.value = editPostData.category;
        elements.title.value = editPostData.title;
        elements.portfolioLink.value = editPostData.githubUrl || '';
        elements.importantCheckbox.checked = editPostData.isImportant;
        elements.feedbackQuestions.value = editPostData.content;
    }

    function setupEventListeners() {
        if (elements.form) elements.form.addEventListener('submit', handleFormSubmit);
    }
    
    async function handleFormSubmit(e) { 
        e.preventDefault(); 
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;        
        
        let contentData;
        let isContentValid = false;

        contentData = elements.feedbackQuestions.value.trim();
        isContentValid = !!contentData;

        const postData = {
            title: elements.title.value.trim(),
            content: contentData,
            category: elements.category.value,
            githubUrl: elements.portfolioLink.value.trim() || null,
            isImportant: (currentUser.role === '관리자') ? elements.importantCheckbox.checked : (isEditMode ? editPostData.isImportant : false)
        };

        if (!postData.title || !isContentValid) {
            app.utils.showNotification('제목과 필수 내용(가장 피드백 받고 싶은 점)을 모두 입력해주세요.', 'warning');
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? '수정 완료' : '피드백 요청';
            return;
        }
        
        try {
            if (isEditMode) {
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
                submitButton.textContent = '등록 중...';
                const newPost = await app.api.createPost(postData);
                app.utils.showNotification('게시글이 성공적으로 등록되었습니다!', 'success');
                setTimeout(() => { window.location.href = `posts.html#post-${newPost.id}`; }, 1500);
            }
        } catch (error) {
            console.error('Submit error:', error);
            app.utils.showNotification('작업에 실패했습니다.', 'danger');
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? '수정 완료' : '피드백 요청';
        }
    }

    if (app.state.categories && app.state.categories.length > 0) {
        initializeWritePage();
    } else {
        document.addEventListener('app-data-loaded', initializeWritePage, { once: true });
    }
});
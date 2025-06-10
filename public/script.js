document.addEventListener('DOMContentLoaded', () => {
    const authSection = document.getElementById('auth-section');
    const mainSection = document.getElementById('main-section');
    const profileSection = document.getElementById('user-profile-section');
    const quizManageSection = document.getElementById('quiz-management-section');
    const questionManageSection = document.getElementById('question-management-section');
    const answerManageSection = document.getElementById('answer-management-section');
    const takeQuizListSection = document.getElementById('take-quiz-list-section');
    const quizTakingSection = document.getElementById('quiz-taking-section');
    const attemptResultSection = document.getElementById('attempt-result-section');
    const myAttemptsSection = document.getElementById('my-attempts-section');
    const attemptDetailsSection = document.getElementById('attempt-details-section');
    const btnRegister = document.getElementById('btn-register');
    const btnLogin = document.getElementById('btn-login');
    const btnLogoutMain = document.getElementById('btn-logout-main');
    const btnLogoutProfile = document.getElementById('btn-logout-profile');
    const btnToProfile = document.getElementById('btn-to-profile');
    const btnToQuizManage = document.getElementById('btn-to-quiz-management');
    const btnToTakeQuizList = document.getElementById('btn-to-take-quiz-list');
    const btnToMyAttempts = document.getElementById('btn-to-my-attempts');
    const btnBackToMain = document.querySelectorAll('.btn-back-to-main');
    const btnSaveQuiz = document.getElementById('btn-save-quiz');
    const btnClearQuizForm = document.getElementById('btn-clear-quiz-form');
    const btnFilterQuizzes = document.getElementById('btn-filter-quizzes');
    const btnSearchQuiz = document.getElementById('btn-search-quiz');
    const btnSortQuizzes = document.getElementById('btn-sort-quizzes-avg-score');
    const btnResetQuizList = document.getElementById('btn-reset-quiz-list');
    const quizList = document.getElementById('quiz-list');
    const filterDifficulty = document.getElementById('filter-difficulty');
    const filterCategory = document.getElementById('filter-category');
    const searchTitle = document.getElementById('search-title');
    const editQuizIdInput = document.getElementById('edit-quiz-id');
    const quizTitleInput = document.getElementById('quiz-title-input');
    const quizDescriptionInput = document.getElementById('quiz-description-input');
    const quizDifficultyInput = document.getElementById('quiz-difficulty-input');
    const quizCategoryInput = document.getElementById('quiz-category-input');
    const btnAddQuestion = document.getElementById('btn-add-question-to-quiz');
    const newQuestionText = document.getElementById('new-question-text');
    const questionList = document.getElementById('question-list-for-quiz');
    const btnAddAnswer = document.getElementById('btn-add-answer-to-question');
    const newAnswerText = document.getElementById('new-answer-text');
    const newAnswerIsCorrect = document.getElementById('new-answer-is-correct');
    const answerList = document.getElementById('answer-list-for-question');
    const availableQuizzesList = document.getElementById('available-quizzes-for-taking');
    const quizTakingTitle = document.getElementById('quiz-taking-title');
    const quizQuestionsArea = document.getElementById('quiz-taking-questions-area');
    const btnSubmitAttempt = document.getElementById('btn-submit-attempt');
    const btnCancelAttempt = document.getElementById('btn-cancel-attempt');
    const resultQuizTitle = document.getElementById('result-quiz-title');
    const resultScore = document.getElementById('result-score');
    const resultTotal = document.getElementById('result-total-questions');
    const btnToAttemptDetails = document.getElementById('btn-to-attempt-details-from-result');
    const myAttemptsList = document.getElementById('my-attempts-list');
    const btnBackFromAttemptDetails = document.getElementById('btn-back-from-attempt-details');
    const detailQuizTitle = document.getElementById('detail-quiz-title');
    const detailScore = document.getElementById('detail-score');
    const detailTotalQuestions = document.getElementById('detail-total-questions');
    const detailStatus = document.getElementById('detail-status');
    const detailStartTime = document.getElementById('detail-start-time');
    const detailCompletedAt = document.getElementById('detail-completed-at');
    const detailAnswersList = document.getElementById('detail-answers-list');

    let token = localStorage.getItem('token') || null;
    let currentAttemptId = null;
    let currentQuizId = null;
    let currentQuestionId = null;

    function hideAllSections() {
        authSection.style.display = 'none';
        mainSection.style.display = 'none';
        profileSection.style.display = 'none';
        quizManageSection.style.display = 'none';
        questionManageSection.style.display = 'none';
        answerManageSection.style.display = 'none';
        takeQuizListSection.style.display = 'none';
        quizTakingSection.style.display = 'none';
        attemptResultSection.style.display = 'none';
        myAttemptsSection.style.display = 'none';
        attemptDetailsSection.style.display = 'none';
    }
    function showSection(section) {
        hideAllSections();
        section.style.display = 'block';
    }
    async function loadUserInfo() {
        try {
            const res = await fetch('/users/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                const data = await res.json();
                document.getElementById('welcome-username').innerText = data.username;
                document.getElementById('profile-username').innerText = data.username;
                document.getElementById('profile-id').innerText = data.id;
            }
        } catch (error) {
            console.error(error);
        }
    }
    async function logout() {
        localStorage.removeItem('token');
        token = null;
        showSection(authSection);
    }
    btnRegister.addEventListener('click', async () => {
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        try {
            const res = await fetch('/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            alert(data.message);
        } catch (error) {
            console.error(error);
        }
    });
    btnLogin.addEventListener('click', async () => {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        try {
            const res = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                token = data.token;
                localStorage.setItem('token', token);
                await loadUserInfo();
                showSection(mainSection);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    });
    btnLogoutMain.addEventListener('click', logout);
    btnLogoutProfile.addEventListener('click', logout);
    btnToProfile.addEventListener('click', () => {
        showSection(profileSection);
    });
    btnBackToMain.forEach(btn => btn.addEventListener('click', () => {
        showSection(mainSection);
    }));
    btnToQuizManage.addEventListener('click', () => {
        showSection(quizManageSection);
        loadQuizList();
        document.getElementById('question-management-quiz-title').innerText = '';
    });
    btnToTakeQuizList.addEventListener('click', () => {
        showSection(takeQuizListSection);
        loadAvailableQuizzes();
    });
    btnToMyAttempts.addEventListener('click', () => {
        showSection(myAttemptsSection);
        loadMyAttempts();
    });
    function createQuizListItem(quiz) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${quiz.title}</strong> (${quiz.category || 'Nincs kategória'}, ${quiz.difficulty || 'Nehézség: nincs'})`;
        const btnEdit = document.createElement('button');
        btnEdit.innerText = 'Szerkesztés';
        btnEdit.addEventListener('click', () => {
            editQuizIdInput.value = quiz.id;
            quizTitleInput.value = quiz.title;
            quizDescriptionInput.value = quiz.description;
            quizDifficultyInput.value = quiz.difficulty || '';
            quizCategoryInput.value = quiz.category || '';
            btnClearQuizForm.style.display = 'inline';
        });
        const btnDelete = document.createElement('button');
        btnDelete.innerText = 'Törlés';
        btnDelete.addEventListener('click', async () => {
            if (confirm('Biztosan törlöd a kvízt?')) {
                await fetch(`/quizzes/${quiz.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                loadQuizList();
            }
        });
        const btnManageQ = document.createElement('button');
        btnManageQ.innerText = 'Kérdések kezelése';
        btnManageQ.addEventListener('click', () => {
            currentQuizId = quiz.id;
            document.getElementById('question-management-quiz-title').innerText = quiz.title;
            showSection(questionManageSection);
            loadQuestions();
        });
        li.appendChild(btnEdit);
        li.appendChild(btnDelete);
        li.appendChild(btnManageQ);
        return li;
    }
    async function loadQuizList() {
        quizList.innerHTML = '';
        try {
            const res = await fetch('/quizzes');
            const data = await res.json();
            if (Array.isArray(data)) {
                data.forEach(q => {
                    quizList.appendChild(createQuizListItem(q));
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
    btnSaveQuiz.addEventListener('click', async () => {
        const title = quizTitleInput.value.trim();
        const description = quizDescriptionInput.value.trim();
        const difficulty = quizDifficultyInput.value.trim();
        const category = quizCategoryInput.value.trim();
        if (!title || !description) {
            alert("A cím és leírás megadása kötelező.");
            return;
        }
        const quizData = { title, description, difficulty: difficulty || null, category: category || null };
        try {
            if (editQuizIdInput.value) {
                const id = editQuizIdInput.value;
                await fetch(`/quizzes/${id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify(quizData)
                });
                alert("Kvíz sikeresen frissítve.");
            } else {
                const res = await fetch('/quizzes', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify(quizData)
                });
                const data = await res.json();
                alert(data.message);
            }
            loadQuizList();
            quizTitleInput.value = '';
            quizDescriptionInput.value = '';
            quizDifficultyInput.value = '';
            quizCategoryInput.value = '';
            editQuizIdInput.value = '';
            btnClearQuizForm.style.display = 'none';
        } catch (error) {
            console.error(error);
        }
    });
    btnClearQuizForm.addEventListener('click', () => {
        quizTitleInput.value = '';
        quizDescriptionInput.value = '';
        quizDifficultyInput.value = '';
        quizCategoryInput.value = '';
        editQuizIdInput.value = '';
        btnClearQuizForm.style.display = 'none';
    });
    btnFilterQuizzes.addEventListener('click', async () => {
        const diff = filterDifficulty.value.trim();
        const cat = filterCategory.value.trim();
        let url = '/quizzes?';
        if (diff) url += `difficulty=${encodeURIComponent(diff)}&`;
        if (cat) url += `category=${encodeURIComponent(cat)}&`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            quizList.innerHTML = '';
            if (Array.isArray(data)) {
                data.forEach(q => quizList.appendChild(createQuizListItem(q)));
            }
        } catch (error) {
            console.error(error);
        }
    });
    btnSearchQuiz.addEventListener('click', async () => {
        const title = searchTitle.value.trim();
        if (!title) return;
        try {
            const res = await fetch(`/quizzes?title=${encodeURIComponent(title)}`);
            const data = await res.json();
            quizList.innerHTML = '';
            if (Array.isArray(data)) {
                data.forEach(q => quizList.appendChild(createQuizListItem(q)));
            }
        } catch (error) {
            console.error(error);
        }
    });
    btnSortQuizzes.addEventListener('click', async () => {
        try {
            const res = await fetch('/quizzes/sort/average_score');
            const data = await res.json();
            quizList.innerHTML = '';
            if (Array.isArray(data)) {
                data.forEach(q => quizList.appendChild(createQuizListItem(q)));
            }
        } catch (error) {
            console.error(error);
        }
    });
    btnResetQuizList.addEventListener('click', () => {
        filterDifficulty.value = '';
        filterCategory.value = '';
        searchTitle.value = '';
        loadQuizList();
    });
    async function loadQuestions() {
        questionList.innerHTML = '';
        try {
            const res = await fetch(`/quizzes/${currentQuizId}/questions`);
            const data = await res.json();
            if (Array.isArray(data)) {
                data.forEach(q => {
                    const li = document.createElement('li');
                    li.innerText = q.question_text;
                    const btnDelete = document.createElement('button');
                    btnDelete.innerText = 'Törlés';
                    btnDelete.addEventListener('click', async () => {
                        if (confirm('Biztosan törlöd a kérdést?')) {
                            await fetch(`/questions/${q.id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': 'Bearer ' + token }
                            });
                            loadQuestions();
                        }
                    });
                    const btnManageA = document.createElement('button');
                    btnManageA.innerText = 'Válaszok kezelése';
                    btnManageA.addEventListener('click', () => {
                        currentQuestionId = q.id;
                        document.getElementById('answer-management-question-text').innerText = q.question_text;
                        showSection(answerManageSection);
                        loadAnswers();
                    });
                    li.appendChild(btnDelete);
                    li.appendChild(btnManageA);
                    questionList.appendChild(li);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
    btnAddQuestion.addEventListener('click', async () => {
        const text = newQuestionText.value.trim();
        if (!text) {
            alert("A kérdés szövegének megadása kötelező.");
            return;
        }
        try {
            const res = await fetch(`/quizzes/${currentQuizId}/questions`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ question_text: text })
            });
            if (res.ok) {
                loadQuestions();
                newQuestionText.value = '';
            }
        } catch (error) {
            console.error(error);
        }
    });
    document.getElementById('btn-back-to-quiz-management').addEventListener('click', () => {
        showSection(quizManageSection);
        loadQuizList();
    });
    async function loadAnswers() {
        answerList.innerHTML = '';
        try {
            const res = await fetch(`/questions/${currentQuestionId}/answers`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                data.forEach(a => {
                    const li = document.createElement('li');
                    li.innerText = a.text + (a.isCorrect ? ' (Helyes)' : '');
                    const btnDelete = document.createElement('button');
                    btnDelete.innerText = 'Törlés';
                    btnDelete.addEventListener('click', async () => {
                        if (confirm('Biztosan törlöd a választ?')) {
                            await fetch(`/answers/${a.id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': 'Bearer ' + token }
                            });
                            loadAnswers();
                        }
                    });
                    const btnCorrect = document.createElement('button');
                    btnCorrect.innerText = 'Megjelöl helyesként';
                    btnCorrect.disabled = a.isCorrect;
                    btnCorrect.addEventListener('click', async () => {
                        await fetch(`/answers/${a.id}/correct`, {
                            method: 'PUT',
                            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isCorrect: true })
                        });
                        loadAnswers();
                    });
                    li.appendChild(btnDelete);
                    li.appendChild(btnCorrect);
                    answerList.appendChild(li);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
    btnAddAnswer.addEventListener('click', async () => {
        const text = newAnswerText.value.trim();
        const isCorrect = newAnswerIsCorrect.checked;
        if (!text) {
            alert("A válasz szövegének megadása kötelező.");
            return;
        }
        try {
            const res = await fetch(`/questions/${currentQuestionId}/answers`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, isCorrect })
            });
            if (res.ok) {
                newAnswerText.value = '';
                newAnswerIsCorrect.checked = false;
                loadAnswers();
            }
        } catch (error) {
            console.error(error);
        }
    });
    document.getElementById('btn-back-to-question-management').addEventListener('click', () => {
        showSection(questionManageSection);
        loadQuestions();
    });
    async function loadAvailableQuizzes() {
        availableQuizzesList.innerHTML = '';
        try {
            const res = await fetch('/quizzes');
            const data = await res.json();
            if (Array.isArray(data)) {
                data.forEach(q => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${q.title}</strong>`;
                    const btnStart = document.createElement('button');
                    btnStart.innerText = 'Kitöltés indítása';
                    btnStart.addEventListener('click', async () => {
                        const resp = await fetch('/attempts', {
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ quizId: q.id })
                        });
                        const result = await resp.json();
                        if (resp.ok) {
                            currentAttemptId = result.attemptId;
                            showSection(quizTakingSection);
                            displayQuizToTake(result.quiz);
                        } else {
                            alert(result.message);
                        }
                    });
                    li.appendChild(btnStart);
                    availableQuizzesList.appendChild(li);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
    function displayQuizToTake(quiz) {
        quizTakingTitle.innerText = quiz.title;
        quizQuestionsArea.innerHTML = '';
        quiz.questions.forEach(q => {
            const div = document.createElement('div');
            const p = document.createElement('p');
            p.innerText = q.question_text;
            div.appendChild(p);
            q.answers.forEach(a => {
                const label = document.createElement('label');
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'question_' + q.id;
                radio.value = a.id;
                label.appendChild(radio);
                label.appendChild(document.createTextNode(a.text));
                div.appendChild(label);
            });
            quizQuestionsArea.appendChild(div);
        });
    }
    btnCancelAttempt.addEventListener('click', () => {
        if (confirm('Biztosan megszakítod a kitöltést?')) {
            showSection(takeQuizListSection);
        }
    });
    btnSubmitAttempt.addEventListener('click', async () => {
        const questionDivs = quizQuestionsArea.children;
        for (let div of questionDivs) {
            const qid = div.querySelector('input').name.split('_')[1];
            const selected = div.querySelector('input:checked');
            const selectedId = selected ? parseInt(selected.value) : null;
            try {
                await fetch(`/attempts/${currentAttemptId}/answer`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ questionId: parseInt(qid), selectedAnswerId: selectedId })
                });
            } catch (error) {
                console.error(error);
            }
        }
        const res = await fetch(`/attempts/${currentAttemptId}/submit`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (res.ok) {
            resultQuizTitle.innerText = data.quizTitle;
            resultScore.innerText = data.score;
            resultTotal.innerText = data.totalQuestions;
            showSection(attemptResultSection);
        } else {
            alert(data.message);
        }
    });
    btnToAttemptDetails.addEventListener('click', () => {
        showSection(attemptDetailsSection);
        loadAttemptDetails(currentAttemptId);
    });
    async function loadMyAttempts() {
        myAttemptsList.innerHTML = '';
        try {
            const res = await fetch('/users/me/attempts', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                data.forEach(a => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${a.quiz.title}</strong> - pontszám: ${a.score !== null ? a.score : '-'}<br>Befejezve: ${a.completedAt ? new Date(a.completedAt).toLocaleString() : 'Függőben'}`;
                    const btnDetail = document.createElement('button');
                    btnDetail.innerText = 'Részletek';
                    btnDetail.addEventListener('click', () => {
                        currentAttemptId = a.id;
                        showSection(attemptDetailsSection);
                        loadAttemptDetails(a.id);
                    });
                    li.appendChild(btnDetail);
                    myAttemptsList.appendChild(li);
                });
            }
        } catch (error) {
            console.error(error);
        }
    }
    btnBackFromAttemptDetails.addEventListener('click', () => {
        showSection(myAttemptsSection);
        loadMyAttempts();
    });
    async function loadAttemptDetails(attemptId) {
        detailAnswersList.innerHTML = '';
        try {
            const res = await fetch(`/attempts/${attemptId}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const a = await res.json();
            detailQuizTitle.innerText = a.quiz.title;
            detailScore.innerText = a.score;
            detailTotalQuestions.innerText = a.quiz.questions.length;
            detailStatus.innerText = a.completedAt ? 'Befejezett' : 'Függőben';
            detailStartTime.innerText = new Date(a.startedAt).toLocaleString();
            detailCompletedAt.innerText = a.completedAt ? new Date(a.completedAt).toLocaleString() : '-';
            a.attempt_answers.forEach(ans => {
                const li = document.createElement('li');
                const q = ans.question;
                li.innerHTML = `<strong>${q.question_text}</strong><br>`;
                let userAnswer = q.answers.find(x => x.id === ans.selectedAnswerId);
                let correctAnswers = q.answers.filter(x => x.isCorrect);
                if (userAnswer) {
                    li.innerHTML += `A válaszod: ${userAnswer.text}<br>`;
                } else {
                    li.innerHTML += `Nem válaszoltál meg.<br>`;
                }
                if (correctAnswers.length > 0) {
                    li.innerHTML += `Helyes válasz: ${correctAnswers.map(x => x.text).join(', ')}<br>`;
                }
                detailAnswersList.appendChild(li);
            });
        } catch (error) {
            console.error(error);
        }
    }
    if (token) {
        loadUserInfo();
        showSection(mainSection);
    } else {
        showSection(authSection);
    }
});

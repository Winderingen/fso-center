// ================================================================
//  QUIZ.JS — Логика тестирования и экзаменов
// ================================================================

const Quiz = {
    state: null,
    timerInterval: null,

    startTraining(topicId) {
        const topic = Store.getQuestions()[topicId];
        if (!topic) return App.showNotification('Тема не найдена', 'error');

        let allQuestions = [];
        Object.entries(topic.blocks).forEach(([blockName, questions]) => {
            questions.forEach(q => allQuestions.push({ ...q, blockName, topicId, topicName: topic.name }));
        });

        if (!allQuestions.length) return App.showNotification('Нет вопросов', 'error');

        this._initQuiz('training', this._shuffle(allQuestions), { topicId, topicName: topic.name });
    },

    startExam(examId) {
        const exam = Store.getExamById(examId);
        if (!exam) return App.showNotification('Экзамен не найден', 'error');

        if (Auth.isAdmin()) {
            this._doStartExam(exam);
            return;
        }

        if (Auth.isCadet()) {
            this._doStartExam(exam);
            return;
        }

        App.showModal('🔐 Вход на экзамен', `
            <div class="password-modal">
                <p>Введите пароль, выданный администратором:</p>
                <input type="text" id="examPasswordInput" maxlength="6" placeholder="XXXXXX" autofocus 
                       style="text-transform:uppercase;">
                <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;">
                    <button class="btn btn-primary" onclick="Quiz._submitExamPassword('${examId}')">Начать экзамен</button>
                    <button class="btn btn-outline" onclick="document.getElementById('modalOverlay').classList.remove('show')">Отмена</button>
                </div>
                <p style="margin-top:12px;font-size:11px;color:var(--text-dim);">
                    Или <a href="#" onclick="event.preventDefault();document.getElementById('modalOverlay').classList.remove('show');App.showLoginModal();" style="color:var(--blue-light);">войдите как администратор</a>
                </p>
            </div>`);
        setTimeout(() => document.getElementById('examPasswordInput')?.focus(), 100);
    },

    _submitExamPassword(examId) {
        const input = document.getElementById('examPasswordInput');
        const password = input.value.trim().toUpperCase();
        if (!password) return;

        const cadet = Auth.loginAsCadet(password);
        if (cadet) {
            document.getElementById('modalOverlay').classList.remove('show');
            App.updateUserInterface();
            App.showNotification(`Добро пожаловать, ${cadet.fullName}!`, 'success');
            const exam = Store.getExamById(examId);
            if (exam) this._doStartExam(exam);
        } else {
            App.showNotification('Неверный пароль', 'error');
            input.value = '';
            input.focus();
        }
    },

    _doStartExam(exam) {
        let selectedQuestions = [];
        exam.topics.forEach(tc => {
            const topic = Store.getQuestions()[tc.topicId];
            if (!topic || !topic.blocks[tc.blockName]) return;
            const block = topic.blocks[tc.blockName];
            const shuffled = this._shuffle([...block]);
            shuffled.slice(0, Math.min(tc.questionCount, shuffled.length)).forEach(q => {
                selectedQuestions.push({
                    ...q,
                    blockName: tc.blockName,
                    topicId: tc.topicId,
                    topicName: topic.name
                });
            });
        });

        if (!selectedQuestions.length) return App.showNotification('Не удалось сформировать экзамен', 'error');

        this._initQuiz('exam', this._shuffle(selectedQuestions), {
            examId: exam.id,
            examTitle: exam.title,
            timeLimit: exam.timeLimit * 60,
            passingScore: exam.passingScore
        });
    },

    _initQuiz(mode, questions, meta) {
        this.state = {
            mode,
            questions,
            meta,
            currentIndex: 0,
            answers: new Array(questions.length).fill(-1),
            locked: false,
            startTime: Date.now(),
            timeLeft: meta.timeLimit || 0
        };
        App.activeQuiz = this.state;
        if (mode === 'exam' && meta.timeLimit) this._startTimer();
        this.render();
    },

    _startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.state) return clearInterval(this.timerInterval);
            this.state.timeLeft--;
            const el = document.getElementById('quizTimer');
            if (el) {
                el.textContent = this._formatTime(this.state.timeLeft);
                if (this.state.timeLeft < 60) el.classList.add('warning');
            }
            if (this.state.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this._finish(true);
            }
        }, 1000);
    },

    render() {
        if (!this.state) return;
        const s = this.state;
        const q = s.questions[s.currentIndex];
        if (!q) return this._finish();

        const total = s.questions.length;
        const cur = s.currentIndex + 1;
        const prog = (cur / total) * 100;

        document.getElementById('tabsContainer').innerHTML = `
            <span style="padding:0 16px;font-size:13px;color:var(--text-dim);display:flex;align-items:center;">
                ${s.mode === 'training' ? '📝 Подготовка' : '🎯 Экзамен'}: ${s.meta.topicName || s.meta.examTitle || ''}
            </span>`;
        document.getElementById('tabsContainer').style.display = 'flex';

        document.getElementById('contentArea').innerHTML = `
            <div class="quiz-container">
                <div class="quiz-header">
                    <h2 style="margin:0;">${s.mode === 'training' ? '📝 Тренировочный тест' : '🎯 ' + (s.meta.examTitle || 'Экзамен')}</h2>
                    ${s.mode === 'exam' ? `<span class="quiz-timer" id="quizTimer">${this._formatTime(s.timeLeft)}</span>` : ''}
                </div>
                <div class="quiz-progress" style="margin-bottom:20px;">
                    <span>Вопрос ${cur} из ${total}</span>
                    <div class="progress-bar"><div class="progress-fill" style="width:${prog}%"></div></div>
                    <span>${Math.round(prog)}%</span>
                </div>
                <div class="question-block">
                    <div class="question-category">${q.topicName || ''} → ${q.blockName || ''}</div>
                    <div class="question-text">${q.question}</div>
                    ${q.options.map((opt, i) => {
                        let cls = 'option';
                        if (s.answers[s.currentIndex] === i) cls += ' selected';
                        if (s.locked) {
                            cls += ' disabled';
                            if (i === q.correct) cls += ' correct';
                            else if (s.answers[s.currentIndex] === i) cls += ' wrong';
                        }
                        return `<div class="${cls}" data-option="${i}">
                            <div class="option-marker">${String.fromCharCode(65 + i)}</div>
                            <span>${opt}</span>
                            ${s.locked && i === q.correct ? '<span style="margin-left:auto;color:var(--success);">✓</span>' : ''}
                            ${s.locked && s.answers[s.currentIndex] === i && i !== q.correct ? '<span style="margin-left:auto;color:var(--danger);">✗</span>' : ''}
                        </div>`;
                    }).join('')}
                    <div class="quiz-explanation ${s.locked ? 'show ' + (s.answers[s.currentIndex] === q.correct ? 'correct-exp' : 'wrong-exp') : ''}">
                        ${s.locked ? `<strong>${s.answers[s.currentIndex] === q.correct ? '✅ Правильно!' : '❌ Неверно.'}</strong> ${q.explanation || ''}` : ''}
                    </div>
                </div>
                <div class="quiz-actions">
                    <button class="btn btn-outline" id="btnPrev" ${s.currentIndex === 0 ? 'disabled' : ''}>← Назад</button>
                    <div style="display:flex;gap:8px;">
                        ${!s.locked ? `<button class="btn btn-primary" id="btnAnswer" ${s.answers[s.currentIndex] === -1 ? 'disabled' : ''}>Ответить</button>` : ''}
                        <button class="btn ${s.locked ? 'btn-primary' : 'btn-outline'}" id="btnNext">
                            ${s.currentIndex < total - 1 ? 'Далее →' : 'Завершить'}
                        </button>
                    </div>
                </div>
                <div style="margin-top:16px;display:flex;gap:4px;flex-wrap:wrap;justify-content:center;">
                    ${s.answers.map((a, i) => `
                        <button class="btn btn-sm ${i === s.currentIndex ? 'btn-primary' : 'btn-outline'}" 
                                style="min-width:30px;padding:4px 6px;font-size:11px;" data-goto="${i}">${i + 1}</button>
                    `).join('')}
                </div>
            </div>`;
        this._bindEvents();
    },

    _bindEvents() {
        document.querySelectorAll('.option:not(.disabled)').forEach(o => {
            o.addEventListener('click', function() {
                if (Quiz.state.locked) return;
                Quiz.state.answers[Quiz.state.currentIndex] = parseInt(this.dataset.option);
                document.querySelectorAll('.option').forEach(x => x.classList.remove('selected'));
                this.classList.add('selected');
                const ba = document.getElementById('btnAnswer');
                if (ba) ba.disabled = false;
            });
        });

        document.getElementById('btnAnswer')?.addEventListener('click', () => {
            Quiz.state.locked = true;
            Quiz.render();
        });

        document.getElementById('btnPrev')?.addEventListener('click', () => {
            if (Quiz.state.currentIndex > 0) {
                Quiz.state.currentIndex--;
                Quiz.state.locked = false;
                Quiz.render();
            }
        });

        document.getElementById('btnNext')?.addEventListener('click', () => {
            if (Quiz.state.currentIndex < Quiz.state.questions.length - 1) {
                Quiz.state.currentIndex++;
                Quiz.state.locked = false;
                Quiz.render();
            } else {
                Quiz._finish();
            }
        });

        document.querySelectorAll('[data-goto]').forEach(b => {
            b.addEventListener('click', function() {
                Quiz.state.currentIndex = parseInt(this.dataset.goto);
                Quiz.state.locked = false;
                Quiz.render();
            });
        });

        document.addEventListener('keydown', this._handleKeyboard);
    },

    _handleKeyboard(e) {
        if (!Quiz.state) {
            document.removeEventListener('keydown', Quiz._handleKeyboard);
            return;
        }

        if (e.key >= '1' && e.key <= '9' && !Quiz.state.locked) {
            const idx = parseInt(e.key) - 1;
            if (idx < Quiz.state.questions[Quiz.state.currentIndex].options.length) {
                Quiz.state.answers[Quiz.state.currentIndex] = idx;
                const ba = document.getElementById('btnAnswer');
                if (ba) ba.disabled = false;
                Quiz.render();
            }
        }

        if (e.key === 'Enter' && !Quiz.state.locked && Quiz.state.answers[Quiz.state.currentIndex] !== -1) {
            Quiz.state.locked = true;
            Quiz.render();
        }

        if (e.key === 'ArrowRight' && Quiz.state.locked) {
            if (Quiz.state.currentIndex < Quiz.state.questions.length - 1) {
                Quiz.state.currentIndex++;
                Quiz.state.locked = false;
                Quiz.render();
            }
        }
        if (e.key === 'ArrowLeft' && Quiz.state.currentIndex > 0) {
            Quiz.state.currentIndex--;
            Quiz.state.locked = false;
            Quiz.render();
        }
    },

    _finish(timeExpired = false) {
        clearInterval(this.timerInterval);
        document.removeEventListener('keydown', this._handleKeyboard);

        const s = this.state;
        if (!s) return;

        const total = s.questions.length;
        let correct = 0;
        const wrongQuestions = [];

        s.questions.forEach((q, i) => {
            if (s.answers[i] === q.correct) {
                correct++;
            } else {
                wrongQuestions.push({ q, a: s.answers[i] });
            }
        });

        const score = total ? Math.round((correct / total) * 100) : 0;
        const timeSpent = Math.floor((Date.now() - s.startTime) / 1000);
        let passed = true;

        if (s.mode === 'exam' && Auth.isCadet()) {
            const user = Auth.getCurrentUser();
            passed = score >= (s.meta.passingScore || 70);
            Store.saveResult({
                cadetId: user.id,
                cadetName: user.name,
                cadetRank: user.rank,
                examId: s.meta.examId,
                examTitle: s.meta.examTitle,
                score,
                correct,
                total,
                passed,
                timeSpent
            });
        } else if (s.mode === 'exam') {
            passed = score >= (s.meta.passingScore || 70);
        }

        document.getElementById('tabsContainer').innerHTML = `
            <span style="padding:0 16px;font-size:13px;color:var(--text-dim);">
                ${s.mode === 'training' ? '📝 Результат тренировки' : '🎯 Результат экзамена'}
            </span>`;
        document.getElementById('tabsContainer').style.display = 'flex';

        document.getElementById('contentArea').innerHTML = `
            <div class="result-card card">
                <div class="result-icon">${passed ? '🎉' : '📚'}</div>
                <div class="result-score">${score}%</div>
                <div class="result-status" style="color:${passed ? 'var(--success)' : 'var(--danger)'};">
                    ${s.mode === 'training' ? 'Тренировка завершена' : (passed ? '✅ Экзамен сдан' : '❌ Экзамен не сдан')}
                </div>
                <div class="result-details">
                    <p>Правильных ответов: <strong style="color:var(--success);">${correct}</strong> из <strong>${total}</strong></p>
                    <p>Затрачено времени: <strong>${this._formatTime(timeSpent)}</strong></p>
                    ${s.mode === 'exam' ? `
                        <p>Проходной балл: <strong>${s.meta.passingScore}%</strong></p>
                        ${timeExpired ? '<p style="color:var(--danger);">⏰ Время вышло!</p>' : ''}
                    ` : ''}
                </div>
                ${wrongQuestions.length > 0 ? `
                    <div style="text-align:left;margin-top:20px;">
                        <h4>📋 Вопросы с ошибками (${wrongQuestions.length}):</h4>
                        ${wrongQuestions.map((wq, i) => `
                            <div class="doc-article" style="border-left-color:var(--danger);">
                                <p style="font-weight:600;margin-bottom:6px;">${i + 1}. ${wq.q.question}</p>
                                <p style="color:var(--danger);font-size:12px;">
                                    Ваш ответ: ${wq.a >= 0 ? wq.q.options[wq.a] : 'Нет ответа'}
                                </p>
                                <p style="color:var(--success);font-size:12px;">
                                    Правильный: ${wq.q.options[wq.q.correct]}
                                </p>
                                <p style="color:var(--text-dim);font-size:12px;margin-top:4px;">
                                    ${wq.q.explanation || ''}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                ` : `<p style="color:var(--success);margin-top:16px;">🎯 Все ответы правильные! Отличная работа!</p>`}
                <div class="result-actions">
                    <button class="btn btn-gold" onclick="Quiz.retry()">🔄 Пройти заново</button>
                    <button class="btn btn-outline" onclick="Quiz.exit()">↩ К списку</button>
                </div>
            </div>`;

        this.state = null;
        App.activeQuiz = null;
    },

    retry() {
        const meta = this.state?.meta;
        const mode = this.state?.mode;
        this.state = null;
        App.activeQuiz = null;
        clearInterval(this.timerInterval);
        document.removeEventListener('keydown', this._handleKeyboard);

        if (mode === 'training' && meta?.topicId) {
            this.startTraining(meta.topicId);
        } else if (mode === 'exam' && meta?.examId) {
            this.startExam(meta.examId);
        } else {
            App.navigate('training');
        }
    },

    exit() {
        clearInterval(this.timerInterval);
        document.removeEventListener('keydown', this._handleKeyboard);
        this.state = null;
        App.activeQuiz = null;
        App.navigate('training');
    },

    _shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    },

    _formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `⏱ ${m}:${sec.toString().padStart(2, '0')}`;
    }
};
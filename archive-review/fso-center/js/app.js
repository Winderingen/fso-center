// ================================================================
//  APP.JS — Основная логика приложения
// ================================================================

const App = {
    currentPage: 'legislation',
    currentTab: 0,
    activeQuiz: null,
    editMode: false,
    editingItem: null,

    init() {
        Store.init();
        Auth.init();
        this._bindNavigation();
        this._bindModal();
        this.updateUserInterface();
        this.navigate('legislation');
    },

    onDataChanged(dataKey) {
        if (this.currentPage === dataKey ||
            (dataKey === 'legislation' && this.currentPage === 'legislation') ||
            (dataKey === 'charter' && this.currentPage === 'charter') ||
            (dataKey === 'regulations' && this.currentPage === 'regulations') ||
            (dataKey === 'structure' && this.currentPage === 'structure') ||
            (dataKey === 'questions' && this.currentPage === 'training') ||
            (dataKey === 'exams' && this.currentPage === 'exams') ||
            (dataKey === 'results' && this.currentPage === 'statistics')) {
            this.renderPage();
        }
        this._updateBadges();
    },

    // ========= ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС =========
    updateUserInterface() {
        const avatar = document.getElementById('userAvatar');
        const name = document.getElementById('userName');
        const role = document.getElementById('userRole');
        const logoutBtn = document.getElementById('logoutBtn');

        if (Auth.isAdmin()) {
            avatar.textContent = 'А';
            name.textContent = 'Администратор';
            role.textContent = 'Режим редактирования';
            role.style.color = 'var(--danger)';
            logoutBtn.style.display = 'flex';
        } else if (Auth.isCadet()) {
            const u = Auth.getCurrentUser();
            avatar.textContent = u.name.charAt(0).toUpperCase();
            name.textContent = u.name;
            role.textContent = u.rank;
            role.style.color = 'var(--gold)';
            logoutBtn.style.display = 'flex';
        } else {
            avatar.textContent = 'Г';
            name.textContent = 'Гость';
            role.textContent = 'Не авторизован';
            role.style.color = 'var(--text-dim)';
            logoutBtn.style.display = 'none';
        }
    },

    // ========= НАВИГАЦИЯ =========
    navigate(page) {
        this.currentPage = page;
        this.currentTab = 0;
        this.editMode = false;
        this.editingItem = null;

        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`[data-page="${page}"]`);
        if (navItem) navItem.classList.add('active');

        this.renderPage();
    },

    _bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.navigate(page);
            });
        });
    },

    _bindTabEvents() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.currentTab = parseInt(e.target.dataset.tab);
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.renderPage();
            });
        });
    },

    _bindPageEvents() {
        document.querySelectorAll('[data-start-training]').forEach(el => {
            el.addEventListener('click', function() {
                Quiz.startTraining(this.dataset.startTraining);
            });
        });
    },

    // ========= МОДАЛЬНОЕ ОКНО =========
    _bindModal() {
        const overlay = document.getElementById('modalOverlay');
        const closeBtn = document.getElementById('modalClose');

        closeBtn.addEventListener('click', () => overlay.classList.remove('show'));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('show');
        });
    },

    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        document.getElementById('modalOverlay').classList.add('show');
    },

    showLoginModal() {
        this.showModal('🔐 Вход в систему', `
            <div style="display:flex;flex-direction:column;gap:12px;">
                <p>Введите пароль администратора:</p>
                <input type="password" id="adminPwd" class="form-input" placeholder="Пароль" autofocus>
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-primary" onclick="App._loginAdmin()">Войти</button>
                    <button class="btn btn-outline" onclick="document.getElementById('modalOverlay').classList.remove('show')">Отмена</button>
                </div>
            </div>`);
        setTimeout(() => document.getElementById('adminPwd')?.focus(), 100);
    },

    _loginAdmin() {
        const pwd = document.getElementById('adminPwd').value;
        if (Auth.loginAsAdmin(pwd)) {
            document.getElementById('modalOverlay').classList.remove('show');
            this.updateUserInterface();
            this.showNotification('Вход выполнен успешно', 'success');
            this.renderPage();
        } else {
            this.showNotification('Неверный пароль', 'error');
        }
    },

    _changePasswordPrompt() {
        this.showModal('🔐 Смена пароля', `
            <div style="display:flex;flex-direction:column;gap:12px;">
                <input type="password" id="oldPwd" class="form-input" placeholder="Старый пароль">
                <input type="password" id="newPwd" class="form-input" placeholder="Новый пароль">
                <div style="display:flex;gap:8px;">
                    <button class="btn btn-primary" onclick="App._changePassword()">Сменить</button>
                    <button class="btn btn-outline" onclick="document.getElementById('modalOverlay').classList.remove('show')">Отмена</button>
                </div>
            </div>`);
    },

    _changePassword() {
        const oldPwd = document.getElementById('oldPwd').value;
        const newPwd = document.getElementById('newPwd').value;
        if (Auth.changeAdminPassword(oldPwd, newPwd)) {
            document.getElementById('modalOverlay').classList.remove('show');
            this.showNotification('Пароль изменен', 'success');
        } else {
            this.showNotification('Неверный старый пароль', 'error');
        }
    },

    // ========= УВЕДОМЛЕНИЯ =========
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const el = document.createElement('div');
        el.className = `notification notification-${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => {
            el.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => el.remove(), 300);
        }, 3000);
    },

    _updateBadges() {
        const trainingBadge = document.getElementById('trainingBadge');
        const examsBadge = document.getElementById('examsBadge');
        if (trainingBadge) trainingBadge.textContent = Object.keys(Store.getQuestions()).length;
        if (examsBadge) examsBadge.textContent = Store.getExams().length;
    },

    // ========= АККОРДЕОН =========
    toggleAccordion(header) {
        const body = header.nextElementSibling;
        const isOpen = body.classList.contains('show');
        if (isOpen) {
            body.classList.remove('show');
            header.classList.remove('open');
        } else {
            body.classList.add('show');
            header.classList.add('open');
        }
    },

    // ========= РЕЖИМ РЕДАКТИРОВАНИЯ =========
    enterEditMode(item) {
        if (!Auth.isAdmin()) {
            this.showNotification('Требуются права администратора', 'error');
            return;
        }
        this.editMode = true;
        this.editingItem = item;
        this.renderPage();
    },

    exitEditMode() {
        this.editMode = false;
        this.editingItem = null;
        this.renderPage();
    },

    _renderEditor() {
        const item = this.editingItem;
        let html = '';

        switch (item.type) {
            // Законодательство
            case 'addCode':
                html = this._renderCodeForm();
                break;
            case 'editCode':
                const ec = Store.getCodeById(item.codeId);
                html = ec ? this._renderCodeForm(ec) : '<p>Кодекс не найден</p>';
                break;
            case 'addArticle':
                html = Editor.renderArticleForm(item.codeId);
                break;
            case 'editArticle':
                const code = Store.getCodeById(item.codeId);
                const article = code?.articles.find(a => a.id === item.articleId);
                html = article ? Editor.renderArticleForm(item.codeId, article) : '<p>Статья не найдена</p>';
                break;

            // Устав
            case 'addCharterSection':
                html = Editor.renderCharterSectionForm();
                break;
            case 'editCharterSection':
                const cs = Store.getCharterSectionById(item.sectionId);
                html = cs ? Editor.renderCharterSectionForm(cs) : '<p>Раздел не найден</p>';
                break;
            case 'addCharterArticle':
                html = Editor.renderCharterArticleForm(item.sectionId);
                break;
            case 'editCharterArticle':
                const chSection = Store.getCharterSectionById(item.sectionId);
                const chArticle = chSection?.articles.find(a => a.id === item.articleId);
                html = chArticle ? Editor.renderCharterArticleForm(item.sectionId, chArticle) : '<p>Статья не найдена</p>';
                break;

            // Инструкции
            case 'addInstruction':
                InstructionEditor.init(null, { title: 'Новая инструкция', blocks: [] });
                return;
            case 'editInstruction':
                const instr = Store.getInstructionById(item.id);
                if (instr) {
                    InstructionEditor.init(item.id, instr.content);
                } else {
                    html = '<p>Инструкция не найдена</p>';
                }
                return;

            // Структура
            case 'editDirector':
                html = Editor.renderDirectorForm();
                break;
            case 'addDepartment':
                html = Editor.renderDepartmentForm();
                break;
            case 'editDepartment':
                const dept = Store.getStructure().departments.find(d => d.id === item.deptId);
                html = dept ? Editor.renderDepartmentForm(dept) : '<p>Управление не найдено</p>';
                break;
            case 'addDeputyToDepartment':
                html = Editor.renderDeputyForm(item.deptId);
                break;
            case 'editDeputy':
                const deptForDep = Store.getStructure().departments.find(d => d.id === item.deptId);
                const deputy = deptForDep?.deputies.find(d => d.id === item.deputyId);
                html = deputy ? Editor.renderDeputyForm(item.deptId, deputy) : '<p>Заместитель не найден</p>';
                break;
            case 'addSubdivision':
                html = Editor.renderSubdivisionForm(item.deptId);
                break;
            case 'editSubdivision':
                const deptForSub = Store.getStructure().departments.find(d => d.id === item.deptId);
                const sub = deptForSub?.subdivisions.find(s => s.id === item.subId);
                html = sub ? Editor.renderSubdivisionForm(item.deptId, sub) : '<p>Отдел не найден</p>';
                break;
            case 'editRanks':
                html = this._renderRanksForm();
                break;

            // Вопросы
            case 'addTopic':
                html = this._renderTopicForm();
                break;
            case 'manageTopic':
                html = this._renderManageTopic(item.topicId);
                break;
            case 'addBlock':
                html = this._renderBlockForm(item.topicId);
                break;
            case 'addQuestion':
                html = Editor.renderQuestionForm(item.topicId, item.blockName);
                break;
            case 'editQuestion':
                const tq = Store.getQuestions()[item.topicId];
                const q = tq?.blocks[item.blockName]?.[item.index];
                html = q ? Editor.renderQuestionForm(item.topicId, item.blockName, q, item.index) : '<p>Вопрос не найден</p>';
                break;

            // Экзамены
            case 'addExam':
                html = Editor.renderExamForm();
                break;
            case 'editExam':
                const exam = Store.getExamById(item.examId);
                html = exam ? Editor.renderExamForm(exam) : '<p>Экзамен не найден</p>';
                break;

            // Курсанты
            case 'addCadet':
                html = Editor.renderCadetForm();
                break;

            default:
                html = '<p>Неизвестный тип редактора</p>';
        }

        document.getElementById('tabsContainer').innerHTML = '';
        document.getElementById('tabsContainer').style.display = 'none';
        document.getElementById('contentArea').innerHTML = `<div style="max-width:700px;">${html}</div>`;
    },

    // ========= ФОРМЫ РЕДАКТОРА (простые) =========
    _renderCodeForm(code = null) {
        const isNew = !code;
        return `
            <form class="editor-form" id="codeForm" onsubmit="return false;">
                <h4>${isNew ? '➕ Новый кодекс' : '✏️ Редактирование кодекса'}</h4>
                <div class="form-group"><label>Название *</label><input type="text" name="name" value="${code?.name || ''}" required></div>
                <div class="form-row">
                    <div class="form-group"><label>Краткое имя</label><input type="text" name="shortName" value="${code?.shortName || ''}"></div>
                    <div class="form-group"><label>Иконка</label><input type="text" name="icon" value="${code?.icon || '📋'}"></div>
                </div>
                <div class="form-group"><label>Описание</label><textarea name="desc">${code?.description || ''}</textarea></div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="App._submitCodeForm('${code?.id || ''}')">${isNew ? 'Создать' : 'Сохранить'}</button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    _submitCodeForm(codeId) {
        const fd = new FormData(document.getElementById('codeForm'));
        const data = { name: fd.get('name'), shortName: fd.get('shortName'), icon: fd.get('icon'), description: fd.get('desc') };
        if (codeId) Store.updateCode(codeId, data);
        else Store.addCode(data);
        this.exitEditMode();
        this.showNotification(codeId ? 'Кодекс обновлен' : 'Кодекс создан', 'success');
    },

    _renderTopicForm() {
        return `
            <form class="editor-form" id="topicForm" onsubmit="return false;">
                <h4>➕ Новая тема вопросов</h4>
                <div class="form-row">
                    <div class="form-group"><label>ID темы (латиница) *</label><input type="text" name="id" required></div>
                    <div class="form-group"><label>Название *</label><input type="text" name="name" required></div>
                </div>
                <div class="form-group"><label>Иконка</label><input type="text" name="icon" value="📝"></div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="App._submitTopicForm()">Создать</button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    _submitTopicForm() {
        const fd = new FormData(document.getElementById('topicForm'));
        const result = Store.addTopic(fd.get('id'), fd.get('name'), fd.get('icon'));
        if (result) { this.exitEditMode(); this.showNotification('Тема создана', 'success'); }
        else this.showNotification('Тема с таким ID уже существует', 'error');
    },

    _renderBlockForm(topicId) {
        return `
            <form class="editor-form" id="blockForm" onsubmit="return false;">
                <h4>➕ Новый блок вопросов</h4>
                <div class="form-group"><label>Название блока *</label><input type="text" name="blockName" required></div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="App._submitBlockForm('${topicId}')">Создать</button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    _submitBlockForm(topicId) {
        const name = document.getElementById('blockForm').querySelector('input').value;
        const result = Store.addBlock(topicId, name);
        if (result) { this.exitEditMode(); this.showNotification('Блок создан', 'success'); }
        else this.showNotification('Блок с таким названием уже существует', 'error');
    },

    _renderManageTopic(topicId) {
        const topic = Store.getQuestions()[topicId];
        if (!topic) return '<p>Тема не найдена</p>';
        return `
            <div>
                <h4>📚 Управление темой: ${topic.name}</h4>
                <div style="margin-bottom:12px;display:flex;gap:8px;">
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addBlock',topicId:'${topicId}'})">+ Блок</button>
                    <button class="btn btn-sm btn-outline" onclick="App.exitEditMode()">↩ Назад</button>
                </div>
                ${Object.entries(topic.blocks).map(([bName, questions]) => `
                    <div class="card" style="margin-bottom:10px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                            <h4 style="margin:0;">📦 ${bName} (${questions.length} вопр.)</h4>
                            <button class="btn btn-sm btn-danger" onclick="if(confirm('Удалить блок?')){Store.deleteBlock('${topicId}','${bName}');App.exitEditMode();App.showNotification('Блок удален','success');}">🗑</button>
                        </div>
                        ${questions.map((q, i) => `
                            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">
                                <span style="font-size:12px;">${q.question.substring(0, 80)}${q.question.length > 80 ? '...' : ''}</span>
                                <div style="display:flex;gap:4px;">
                                    <button class="btn btn-sm btn-outline" onclick="App.enterEditMode({type:'editQuestion',topicId:'${topicId}',blockName:'${bName}',index:${i}})">✏️</button>
                                    <button class="btn btn-sm btn-danger" onclick="Store.deleteQuestion('${topicId}','${bName}',${i});App.exitEditMode();App.showNotification('Вопрос удален','success');">🗑</button>
                                </div>
                            </div>
                        `).join('')}
                        <button class="btn btn-sm btn-primary" style="margin-top:8px;" onclick="App.enterEditMode({type:'addQuestion',topicId:'${topicId}',blockName:'${bName}'})">+ Вопрос</button>
                    </div>
                `).join('')}
            </div>`;
    },

    _renderRanksForm() {
        const ranks = Store.getStructure().ranks || [];
        return `
            <form class="editor-form" id="ranksForm" onsubmit="return false;">
                <h4>✏️ Редактирование системы званий</h4>
                <p style="color:var(--text-dim);font-size:12px;">По одной цепочке на строку</p>
                <textarea name="ranks" rows="6" style="font-family:monospace;">${ranks.join('\n')}</textarea>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="App._submitRanksForm()">Сохранить</button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    _submitRanksForm() {
        const fd = new FormData(document.getElementById('ranksForm'));
        Store.updateRanks(fd.get('ranks').split('\n').map(s => s.trim()).filter(Boolean));
        App.exitEditMode();
        App.showNotification('Звания обновлены', 'success');
    },

    // ========= РЕНДЕРЫ СТРАНИЦ =========
    _renderLegislation(code) {
        if (!code) return '<p class="empty-state">Нет данных</p>';

        const fsoArticles = code.articles.filter(a => a.isFsoMain === true);
        const allArticles = code.articles;

        const renderArticle = (article) => `
            <div class="doc-article">
                <div class="article-header">
                    <span class="article-num">${article.num} — ${article.title}</span>
                    <div style="display:flex;gap:6px;align-items:center;">
                        ${article.isFsoMain ? '<span class="article-badge-fso" title="Основная статья для ФСО">⭐ ФСО</span>' : ''}
                        <span class="article-tag">${article.severity || ''}</span>
                        ${Auth.isAdmin() ? `
                            <button class="edit-btn" style="opacity:1;" onclick="event.stopPropagation();App.enterEditMode({type:'editArticle',codeId:'${code.id}',articleId:'${article.id}'})">✏️</button>
                            <button class="edit-btn delete" style="opacity:1;" onclick="event.stopPropagation();if(confirm('Удалить статью?')){Store.deleteArticle('${code.id}','${article.id}');App.showNotification('Статья удалена','success');}">🗑</button>
                        ` : ''}
                    </div>
                </div>
                <div class="article-text">${article.fullText || article.text || ''}</div>
                ${article.part2 ? `<div class="article-text" style="margin-top:8px;">${article.part2}</div>` : ''}
                ${article.penalty ? `<div class="article-text" style="margin-top:8px;color:var(--warning);">⚖️ Наказание: ${article.penalty}</div>` : ''}
                ${article.fsoHint || article.hint ? `<div class="article-hint">💡 <strong>Для ФСО:</strong> ${article.fsoHint || article.hint}</div>` : ''}
                ${article.tags && article.tags.length ? `
                    <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap;">
                        ${article.tags.map(t => `<span style="font-size:10px;padding:2px 8px;background:var(--surface);border-radius:10px;color:var(--text-dim);">#${t}</span>`).join('')}
                    </div>` : ''}
            </div>`;

        return `
            <h2>${Store.getLegislation().title}</h2>
            <p class="subtitle">${Store.getLegislation().description}</p>
            <div class="page-description">📘 <strong>${code.name}</strong> — ${code.description || ''}</div>
            ${Auth.isAdmin() ? `
                <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addArticle',codeId:'${code.id}'})">+ Статья</button>
                    <button class="btn btn-sm btn-outline" onclick="App.enterEditMode({type:'editCode',codeId:'${code.id}'})">✏️ Кодекс</button>
                    <button class="btn btn-sm btn-danger" onclick="if(confirm('Удалить кодекс?')){Store.deleteCode('${code.id}');App.showNotification('Кодекс удален','success');}">🗑 Кодекс</button>
                </div>` : ''}
            <div class="accordion">
                <div class="accordion-header open" onclick="App.toggleAccordion(this)">
                    <span>⭐ Основные используемые ФСО (${fsoArticles.length} статей)</span>
                    <span class="accordion-arrow">▼</span>
                </div>
                <div class="accordion-body show">
                    <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">Ключевые статьи, наиболее часто применяемые в работе сотрудников Федеральной службы охраны.</p>
                    ${fsoArticles.length > 0 ? fsoArticles.map(renderArticle).join('') : '<div class="empty-state" style="padding:20px;"><p>Нет отмеченных статей.</p></div>'}
                </div>
            </div>
            <div class="accordion" style="margin-top:12px;">
                <div class="accordion-header" onclick="App.toggleAccordion(this)">
                    <span>📚 Полный перечень статей (${allArticles.length} статей)</span>
                    <span class="accordion-arrow">▼</span>
                </div>
                <div class="accordion-body">
                    <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px;">Все статьи законодательства, включая редко используемые и справочные.</p>
                    ${allArticles.length > 0 ? allArticles.map(renderArticle).join('') : '<p class="empty-state">Нет добавленных статей.</p>'}
                </div>
            </div>
            ${Auth.isAdmin() ? `<button class="btn btn-primary" style="margin-top:16px;" onclick="App.enterEditMode({type:'addArticle',codeId:'${code.id}'})">➕ Добавить статью</button>` : ''}`;
    },

    _renderCharter(section) {
        if (!section) {
            return `
                <h2>${Store.getCharter().title}</h2>
                <p class="subtitle">${Store.getCharter().description}</p>
                <div class="empty-state">
                    <div class="empty-icon">📜</div>
                    <h4>Устав пока пуст</h4>
                    <p style="margin-bottom:16px;">Добавьте первый раздел устава, чтобы начать наполнение.</p>
                    ${Auth.isAdmin() ? `<button class="btn btn-primary" onclick="App.enterEditMode({type:'addCharterSection'})">➕ Создать первый раздел</button>` : '<p style="color:var(--text-dim);">Обратитесь к администратору для добавления данных.</p>'}
                </div>`;
        }

        return `
            <h2>${Store.getCharter().title}</h2>
            <p class="subtitle">${Store.getCharter().description}</p>
            <div class="page-description">
                📜 <strong>${section.name}</strong>
                ${Auth.isAdmin() ? `<button class="btn btn-sm btn-outline" style="margin-left:12px;" onclick="App.enterEditMode({type:'addCharterSection'})">+ Новый раздел</button>` : ''}
            </div>
            ${Auth.isAdmin() ? `
                <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addCharterArticle',sectionId:'${section.id}'})">+ Статья</button>
                    <button class="btn btn-sm btn-outline" onclick="App.enterEditMode({type:'editCharterSection',sectionId:'${section.id}'})">✏️ Раздел</button>
                    <button class="btn btn-sm btn-danger" onclick="if(confirm('Удалить раздел?')){Store.deleteCharterSection('${section.id}');App.showNotification('Раздел удален','success');}">🗑 Раздел</button>
                </div>` : ''}
            ${section.articles.length > 0 ? section.articles.map(article => `
                <div class="doc-article">
                    <div class="article-header">
                        <span class="article-num">Пункт ${article.num} — ${article.title}</span>
                        ${Auth.isAdmin() ? `
                            <div style="display:flex;gap:4px;">
                                <button class="edit-btn" style="opacity:1;" onclick="event.stopPropagation();App.enterEditMode({type:'editCharterArticle',sectionId:'${section.id}',articleId:'${article.id}'})">✏️</button>
                                <button class="edit-btn delete" style="opacity:1;" onclick="event.stopPropagation();if(confirm('Удалить статью?')){Store.deleteCharterArticle('${section.id}','${article.id}');App.showNotification('Статья удалена','success');}">🗑</button>
                            </div>` : ''}
                    </div>
                    <div class="article-text">${article.text}</div>
                    ${article.hint ? `<div class="article-hint">💡 <strong>Примечание:</strong> ${article.hint}</div>` : ''}
                </div>`).join('') : `<div class="empty-state"><p>В этом разделе пока нет статей.</p>${Auth.isAdmin() ? `<button class="btn btn-sm btn-primary" style="margin-top:8px;" onclick="App.enterEditMode({type:'addCharterArticle',sectionId:'${section.id}'})">➕ Добавить первую статью</button>` : ''}</div>`}
            ${Auth.isAdmin() ? `<button class="btn btn-primary" style="margin-top:16px;" onclick="App.enterEditMode({type:'addCharterArticle',sectionId:'${section.id}'})">➕ Добавить статью</button>` : ''}`;
    },

    _renderRegulation(instruction) {
        if (!instruction) {
            return `
                <h2>${Store.getRegulations().title}</h2>
                <p class="subtitle">${Store.getRegulations().description}</p>
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h4>Инструкции пока отсутствуют</h4>
                    <p style="margin-bottom:16px;">Добавьте первую служебную инструкцию.</p>
                    ${Auth.isAdmin() ? `<button class="btn btn-primary" onclick="App.enterEditMode({type:'addInstruction'})">➕ Создать первую инструкцию</button>` : '<p style="color:var(--text-dim);">Обратитесь к администратору для добавления инструкций.</p>'}
                </div>`;
        }

        const content = instruction.content;
        let html = `
            <h2>${Store.getRegulations().title}</h2>
            <p class="subtitle">${Store.getRegulations().description}</p>
            ${Auth.isAdmin() ? `
                <div style="margin-bottom:12px;display:flex;gap:8px;">
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'editInstruction',id:'${instruction.id}'})">✏️ Редактировать</button>
                    <button class="btn btn-sm btn-danger" onclick="if(confirm('Удалить инструкцию?')){Store.deleteInstruction('${instruction.id}');App.showNotification('Инструкция удалена','success');}">🗑 Удалить</button>
                </div>` : ''}`;

        if (content.blocks) {
            html += this._renderInstructionBlocks(content.blocks);
        } else if (content.title || content.levels || content.postTypes || content.stages || content.procedure) {
            html += this._renderInstructionLegacy(instruction);
        } else {
            html += '<div class="empty-state"><p>Содержание инструкции пока не заполнено.</p></div>';
        }

        return html;
    },

    _renderInstructionBlocks(blocks) {
        if (!blocks || !blocks.length) return '<p class="empty-state">Пустая инструкция</p>';
        return blocks.map(block => {
            switch (block.type) {
                case 'title': return `<h3 style="margin-top:20px;">${block.content || ''}</h3>`;
                case 'text': return `<div class="instruction-text-block"><p>${block.content || ''}</p></div>`;
                case 'steps': return `
                    <div class="instruction-block">
                        <h4>${block.title || 'Порядок действий'}</h4>
                        ${(block.steps || []).map((step, i) => `
                            <div class="instruction-step"><div class="step-number">${i + 1}</div><div class="step-content">${step}</div></div>`).join('')}
                    </div>`;
                case 'warning': return `<div class="alert-box alert-warning"><strong>⚠️ Предупреждение:</strong> ${block.content || ''}</div>`;
                case 'info': return `<div class="alert-box alert-info"><strong>ℹ️ Информация:</strong> ${block.content || ''}</div>`;
                case 'danger': return `<div class="alert-box alert-danger"><strong>🚫 Опасно:</strong> ${block.content || ''}</div>`;
                case 'image': return `
                    <div style="text-align:center;margin:16px 0;">
                        ${block.src ? `<img src="${block.src}" alt="${block.alt || ''}" style="max-width:100%;max-height:400px;border-radius:var(--radius);">` : ''}
                        ${block.alt ? `<p style="font-size:12px;color:var(--text-dim);margin-top:4px;">${block.alt}</p>` : ''}
                    </div>`;
                case 'list': return `
                    <div style="margin:12px 0;">
                        ${block.title ? `<h4>${block.title}</h4>` : ''}
                        <ul style="padding-left:20px;">${(block.items || []).map(item => `<li style="margin-bottom:6px;">${item}</li>`).join('')}</ul>
                    </div>`;
                case 'divider': return '<hr class="section-divider">';
                default: return '';
            }
        }).join('');
    },

    _renderInstructionLegacy(instruction) {
        const content = instruction.content;
        let html = `<h3>${content.title || instruction.name}</h3>`;
        if (content.levels) {
            html += content.levels.map(l => `
                <div class="instruction-block">
                    <h4>${l.name}</h4>
                    <p style="color:var(--text-dim);margin-bottom:8px;">🚙 Транспорт: ${l.vehicles}</p>
                    ${l.procedure.map((s, i) => `<div class="instruction-step"><div class="step-number">${i + 1}</div><div class="step-content">${s}</div></div>`).join('')}
                </div>`).join('');
        }
        return html;
    },

    _renderStructure() {
        const s = Store.getStructure();
        if (!s) return '<div class="empty-state"><p>Ошибка загрузки структуры</p></div>';

        const director = s.director || { title: 'Директор ФСО', rank: '', name: '', duties: '' };
        const departments = s.departments || [];
        const ranks = s.ranks || [];

        let html = `
            <h2>${s.title || 'Структура ФСО'}</h2>
            <p class="subtitle">${s.description || ''}</p>`;

        if (Auth.isAdmin()) {
            html += `
                <div style="margin-bottom:20px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'editDirector'})">✏️ Директор</button>
                    <button class="btn btn-sm btn-success" onclick="App.enterEditMode({type:'addDepartment'})">➕ Управление</button>
                    <button class="btn btn-sm btn-outline" onclick="App.enterEditMode({type:'editRanks'})">🎖 Звания</button>
                </div>`;
        }

        // ДИРЕКТОР
        html += `
            <div style="display:flex;justify-content:center;margin-bottom:16px;">
                <div style="background:var(--surface);border:2px solid var(--gold);border-radius:var(--radius-lg);padding:20px 30px;text-align:center;max-width:400px;width:100%;">
                    <h3 style="color:var(--gold-light);margin-bottom:8px;">${director.title || 'Директор ФСО'}</h3>
                    ${director.rank ? `<p style="color:var(--blue-light);font-weight:600;">${director.rank}</p>` : ''}
                    ${director.name ? `<p style="color:var(--text-bright);font-size:18px;font-weight:700;">${director.name}</p>` : '<p style="color:var(--text-dim);font-style:italic;">Должность не назначена</p>'}
                    ${director.duties ? `<p style="color:var(--text-dim);font-size:12px;margin-top:8px;">${director.duties}</p>` : ''}
                </div>
            </div>`;

        // УПРАВЛЕНИЯ
        if (departments.length === 0) {
            html += `<div class="empty-state" style="padding:30px;"><div class="empty-icon">🏢</div><h4>Управления отсутствуют</h4><p>Добавьте управления ФСО через админ-панель.</p></div>`;
        } else {
            html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:20px;">';
            
            departments.forEach(dept => {
                html += `
                    <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border);">
                            <div>
                                <h4 style="color:var(--text-bright);">${dept.name}</h4>
                                ${dept.description ? `<p style="color:var(--text-dim);font-size:12px;">${dept.description}</p>` : ''}
                                ${dept.tasks ? `<p style="color:var(--text-dim);font-size:11px;margin-top:4px;"><strong>Задачи:</strong> ${dept.tasks}</p>` : ''}
                            </div>
                            ${Auth.isAdmin() ? `
                                <div style="display:flex;gap:4px;">
                                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();App.enterEditMode({type:'editDepartment',deptId:'${dept.id}'})">✏️</button>
                                    <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();App.enterEditMode({type:'addSubdivision',deptId:'${dept.id}'})">➕</button>
                                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();if(confirm('Удалить?')){Store.deleteDepartment('${dept.id}');App.showNotification('Удалено','success');}">🗑</button>
                                </div>` : ''}
                        </div>
                        
                        <!-- Руководитель -->
                        <div style="background:var(--surface-light);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:8px;">
                            <p style="font-size:10px;color:var(--blue-light);text-transform:uppercase;margin-bottom:4px;">Руководитель</p>
                            <p style="font-size:11px;color:var(--text-dim);">${dept.head.title || 'Руководитель'}</p>
                            ${dept.head.rank ? `<p style="color:var(--blue-light);font-weight:600;font-size:13px;">${dept.head.rank}</p>` : ''}
                            ${dept.head.name ? `<p style="color:var(--text-bright);font-weight:700;">${dept.head.name}</p>` : '<p style="color:var(--text-dim);font-style:italic;">Не назначен</p>'}
                        </div>
                        
                        <!-- Заместители -->
                        ${dept.deputies && dept.deputies.length > 0 ? `
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                                ${dept.deputies.map(dep => `
                                    <div style="background:var(--surface-light);border:1px solid var(--border);border-left:2px solid var(--gold-dim);border-radius:var(--radius);padding:10px;">
                                        <p style="font-size:10px;color:var(--gold-dim);text-transform:uppercase;margin-bottom:2px;">Заместитель</p>
                                        <p style="font-size:11px;color:var(--text-dim);">${dep.title}</p>
                                        ${dep.rank ? `<p style="color:var(--blue-light);font-weight:600;font-size:12px;">${dep.rank}</p>` : ''}
                                        ${dep.name ? `<p style="color:var(--text-bright);font-weight:600;font-size:13px;">${dep.name}</p>` : '<p style="color:var(--text-dim);font-style:italic;">Не назначен</p>'}
                                        ${Auth.isAdmin() ? `<button class="btn btn-xs btn-outline" style="margin-top:4px;font-size:10px;" onclick="event.stopPropagation();App.enterEditMode({type:'editDeputy',deptId:'${dept.id}',deputyId:'${dep.id}'})">✏️</button>` : ''}
                                    </div>`).join('')}
                            </div>` : ''}
                        ${Auth.isAdmin() ? `<button class="btn btn-xs btn-outline" style="margin-bottom:8px;" onclick="event.stopPropagation();App.enterEditMode({type:'addDeputyToDepartment',deptId:'${dept.id}'})">+ Заместитель</button>` : ''}
                        
                        <!-- Отделы -->
                        ${dept.subdivisions && dept.subdivisions.length > 0 ? `
                            <div style="border-top:1px dashed var(--border);padding-top:12px;margin-top:8px;">
                                <h5 style="color:var(--gold-light);margin-bottom:8px;text-align:center;">Отделы</h5>
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                                    ${dept.subdivisions.map(sub => `
                                        <div style="background:var(--surface-light);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
                                            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                                                <h5 style="color:var(--text-bright);font-size:12px;margin:0;">${sub.name}</h5>
                                                ${Auth.isAdmin() ? `
                                                    <div style="display:flex;gap:2px;">
                                                        <button class="btn btn-xs btn-outline" onclick="event.stopPropagation();App.enterEditMode({type:'editSubdivision',deptId:'${dept.id}',subId:'${sub.id}'})">✏️</button>
                                                        <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();if(confirm('Удалить?')){Store.deleteSubdivision('${dept.id}','${sub.id}');App.showNotification('Удален','success');}">×</button>
                                                    </div>` : ''}
                                            </div>
                                            <p style="font-size:10px;color:var(--blue-light);margin-top:6px;">Начальник: ${sub.head.rank || ''} ${sub.head.name || 'Не назначен'}</p>
                                        </div>`).join('')}
                                </div>
                            </div>` : ''}
                    </div>`;
            });
            
            html += '</div>';
        }

        // ЗВАНИЯ
        if (ranks.length > 0) {
            html += `
                <hr class="section-divider">
                <h3>🎖 Система званий</h3>
                <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;">
                    ${ranks.map(r => `<p style="color:var(--text-dim);font-size:13px;padding:4px 0;border-bottom:1px solid var(--border);">${r}</p>`).join('')}
                </div>`;
        }

        return html;
    },

    _renderTraining() {
        const topics = Store.getQuestions();
        const entries = Object.entries(topics);

        return `
            <h2>📚 Самостоятельная подготовка</h2>
            <p class="subtitle">Выберите тему для тренировочного тестирования.</p>
            ${Auth.isAdmin() ? `
                <div style="margin-bottom:16px;display:flex;gap:8px;">
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addTopic'})">+ Новая тема</button>
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addInstruction'})">+ Инструкция</button>
                </div>` : ''}
            <div class="card-grid">
                ${entries.map(([key, t]) => {
                    const totalQ = Object.values(t.blocks).reduce((s, b) => s + b.length, 0);
                    return `
                        <div class="card-item" data-start-training="${key}">
                            <div class="card-icon">${t.icon}</div>
                            <div class="card-title">${t.name}</div>
                            <div class="card-desc">Блоков: ${Object.keys(t.blocks).length} | Вопросов: ${totalQ}</div>
                            ${Auth.isAdmin() ? `
                                <div style="margin-top:8px;display:flex;gap:4px;" onclick="event.stopPropagation();">
                                    <button class="btn btn-sm btn-outline" onclick="App.enterEditMode({type:'manageTopic',topicId:'${key}'})">⚙️</button>
                                    <button class="btn btn-sm btn-danger" onclick="if(confirm('Удалить тему?')){Store.deleteTopic('${key}');App.showNotification('Тема удалена','success');}">🗑</button>
                                </div>` : ''}
                        </div>`;
                }).join('')}
            </div>
            ${entries.length === 0 ? '<p class="empty-state">Нет доступных тем для тренировки.</p>' : ''}`;
    },

    _renderExams() {
        const exams = Store.getExams();
        return `
            <h2>🎯 Экзамены</h2>
            <p class="subtitle">Экзамены открываются администратором по запросу.</p>
            ${Auth.isAdmin() ? `
                <div style="margin-bottom:16px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addExam'})">+ Новый экзамен</button>
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addCadet'})">+ Курсант</button>
                </div>` : ''}
            ${exams.length > 0 ? exams.map(e => `
                <div class="card" style="margin-bottom:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
                        <div style="flex:1;">
                            <h4>${e.title}</h4>
                            <p style="color:var(--text-dim);font-size:13px;">${e.description}</p>
                            <div class="card-meta"><span>⏱ ${e.timeLimit} мин</span><span>📋 ${e.topics.reduce((s,t)=>s+t.questionCount,0)} вопр.</span><span>✅ ${e.passingScore}%</span></div>
                        </div>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <button class="btn btn-primary" onclick="Quiz.startExam('${e.id}')">Начать экзамен</button>
                            ${Auth.isAdmin() ? `
                                <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();App.enterEditMode({type:'editExam',examId:'${e.id}'})">✏️</button>
                                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();if(confirm('Удалить экзамен?')){Store.deleteExam('${e.id}');App.showNotification('Экзамен удален','success');}">🗑</button>` : ''}
                        </div>
                    </div>
                </div>`).join('') : '<p class="empty-state">Нет активных экзаменов.</p>'}
            <div class="alert-box alert-warning">⚠️ <strong>Внимание!</strong> Во время экзамена ведется запись. Попытка списывания ведет к аннулированию результата.</div>`;
    },

    _renderStatistics() {
        const allResults = Store.getAllResults();
        const cadetId = Auth.isCadet() ? Auth.getCurrentUser().id : null;
        const filtered = cadetId ? allResults.filter(r => r.cadetId === cadetId) : allResults;
        const total = filtered.length;
        const passed = filtered.filter(r => r.passed).length;
        const avg = total ? Math.round(filtered.reduce((s, r) => s + r.score, 0) / total) : 0;

        return `
            <h2>📊 Статистика и успеваемость</h2>
            <p class="subtitle">${Auth.isCadet() ? 'Ваши персональные результаты' : 'Результаты всех курсантов'}</p>
            <div class="stat-grid">
                <div class="stat-card"><div class="stat-value" style="color:var(--text-bright);">${total}</div><div class="stat-label">Всего экзаменов</div></div>
                <div class="stat-card"><div class="stat-value" style="color:var(--success);">${passed}</div><div class="stat-label">Сдано</div></div>
                <div class="stat-card"><div class="stat-value" style="color:var(--danger);">${total - passed}</div><div class="stat-label">Не сдано</div></div>
                <div class="stat-card"><div class="stat-value" style="color:var(--gold-light);">${avg}%</div><div class="stat-label">Средний балл</div></div>
            </div>
            ${filtered.length > 0 ? `
                <h3>История прохождений</h3>
                <div style="overflow-x:auto;">
                    <table class="results-table">
                        <thead><tr>${!cadetId ? '<th>Курсант</th>' : ''}<th>Экзамен</th><th>Дата</th><th>Балл</th><th>Время</th><th>Статус</th></tr></thead>
                        <tbody>${filtered.map(r => `
                            <tr>
                                ${!cadetId ? `<td>${r.cadetName} <span style="font-size:10px;color:var(--text-dim);">(${r.cadetRank})</span></td>` : ''}
                                <td>${r.examTitle}</td>
                                <td>${new Date(r.date).toLocaleDateString('ru-RU')}</td>
                                <td style="font-weight:600;">${r.score}%</td>
                                <td>${Math.floor(r.timeSpent / 60)}:${(r.timeSpent % 60).toString().padStart(2, '0')}</td>
                                <td><span class="status-badge ${r.passed ? 'status-passed' : 'status-failed'}">${r.passed ? 'Сдано' : 'Не сдано'}</span></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>` : '<p class="empty-state">Нет результатов для отображения.</p>'}`;
    },

    _renderAdmin() {
        if (!Auth.isAdmin()) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🔒</div>
                    <h4>Доступ ограничен</h4>
                    <p style="margin-bottom:16px;">Для доступа к админ-панели необходимы права администратора.</p>
                    <button class="btn btn-primary" onclick="App.showLoginModal()">🔑 Войти как администратор</button>
                </div>`;
        }

        const cadets = Store.getCadets();
        const codes = Store.getLegislation().codes;
        const instructions = Store.getRegulations().instructions;
        const questions = Store.getQuestions();
        const exams = Store.getExams();

        return `
            <h2>⚙️ Админ-панель</h2>
            <p class="subtitle">Управление справочной системой и экзаменационным отделом</p>
            <div class="admin-grid">
                <div class="admin-section">
                    <h4>📝 Законодательство</h4>
                    <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">Кодексов: ${codes.length}</p>
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addCode'})">+ Добавить кодекс</button>
                </div>
                <div class="admin-section">
                    <h4>📋 Инструкции</h4>
                    <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">Инструкций: ${instructions.length}</p>
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addInstruction'})">+ Добавить инструкцию</button>
                </div>
                <div class="admin-section">
                    <h4>📚 База вопросов</h4>
                    <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">Тем: ${Object.keys(questions).length}</p>
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addTopic'})">+ Новая тема</button>
                </div>
                <div class="admin-section">
                    <h4>🎯 Экзамены</h4>
                    <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">Экзаменов: ${exams.length}</p>
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addExam'})">+ Новый экзамен</button>
                </div>
                <div class="admin-section">
                    <h4>👤 Курсанты</h4>
                    <p style="font-size:12px;color:var(--text-dim);margin-bottom:8px;">Зарегистрировано: ${cadets.length}</p>
                    <button class="btn btn-sm btn-primary" onclick="App.enterEditMode({type:'addCadet'})">+ Зарегистрировать курсанта</button>
                    ${cadets.length > 0 ? `<div style="margin-top:8px;max-height:150px;overflow-y:auto;">${cadets.map(c => `<p style="font-size:11px;color:var(--text-dim);padding:2px 0;">• ${c.fullName} — ${c.rank}</p>`).join('')}</div>` : ''}
                </div>
                <div class="admin-section">
                    <h4>🔐 Безопасность</h4>
                    <button class="btn btn-sm btn-outline" onclick="App._changePasswordPrompt()">🔑 Сменить пароль</button>
                    <button class="btn btn-sm btn-danger" style="margin-top:8px;" onclick="if(confirm('ВНИМАНИЕ! Полный сброс системы?')){localStorage.clear();location.reload();}">⚠️ Полный сброс</button>
                </div>
            </div>`;
    },

    // ========= ОСНОВНОЙ РЕНДЕР =========
    renderPage() {
        if (this.activeQuiz) { Quiz.render(); return; }
        if (this.editMode) { this._renderEditor(); return; }

        const contentArea = document.getElementById('contentArea');
        const tabsContainer = document.getElementById('tabsContainer');
        let tabs = [], html = '';

        switch (this.currentPage) {
            case 'legislation':
                const codes = Store.getLegislation().codes;
                tabs = codes.map(c => c.shortName || c.name);
                html = this._renderLegislation(codes[this.currentTab]);
                break;
            case 'charter':
                const sections = Store.getCharter().sections;
                tabs = sections.map(s => s.name);
                html = this._renderCharter(sections[this.currentTab] || null);
                break;
            case 'regulations':
                const instructions = Store.getRegulations().instructions;
                tabs = instructions.map(i => i.name);
                html = this._renderRegulation(instructions[this.currentTab] || null);
                break;
            case 'structure':
                html = this._renderStructure();
                break;
            case 'training':
                html = this._renderTraining();
                break;
            case 'exams':
                html = this._renderExams();
                break;
            case 'statistics':
                html = this._renderStatistics();
                break;
            case 'admin':
                html = this._renderAdmin();
                break;
            default:
                html = '<div class="empty-state"><div class="empty-icon">🔍</div><p>Страница не найдена</p></div>';
        }

        tabsContainer.innerHTML = tabs.length ? tabs.map((t, i) =>
            `<button class="tab ${i === this.currentTab ? 'active' : ''}" data-tab="${i}">${t}</button>`
        ).join('') : '';
        tabsContainer.style.display = tabs.length ? 'flex' : 'none';

        contentArea.innerHTML = html;
        contentArea.scrollTop = 0;

        this._bindTabEvents();
        this._bindPageEvents();
        this._updateBadges();
    }
};

// ========= ЗАПУСК ПРИЛОЖЕНИЯ =========
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
// ================================================================
//  EDITOR.JS — Компоненты форм редактирования
// ================================================================

const Editor = {

    // ========= СТАТЬЯ ЗАКОНОДАТЕЛЬСТВА =========
    renderArticleForm(codeId, article = null) {
        const isNew = !article;
        const isFsoMain = article?.isFsoMain !== undefined ? article.isFsoMain : (article?.fsoHint || article?.hint ? true : false);
        
        return `
            <form class="editor-form" id="articleForm" onsubmit="return false;">
                <h4>${isNew ? '➕ Добавление статьи' : '✏️ Редактирование статьи'}</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Номер статьи *</label>
                        <input type="text" name="num" value="${this._esc(article?.num || '')}" required placeholder="Ст. 105">
                    </div>
                    <div class="form-group">
                        <label>Название *</label>
                        <input type="text" name="title" value="${this._esc(article?.title || '')}" required placeholder="Убийство">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Категория</label>
                        <select name="severity">
                            ${['', 'Административное', 'Небольшой тяжести', 'Средней тяжести', 'Тяжкое', 'Особо тяжкое', 'Процессуальная норма', 'Регулятивная норма', 'Учредительная норма', 'Правоустанавливающая норма', 'Обязывающая норма', 'Запретительная норма', 'Отсылочная норма', 'Охранительная норма'].map(s =>
                                `<option value="${s}" ${article?.severity === s ? 'selected' : ''}>${s || 'Не указана'}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Наказание</label>
                        <input type="text" name="penalty" value="${this._esc(article?.penalty || '')}" placeholder="Штраф / срок">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="isFsoMain" ${isFsoMain ? 'checked' : ''}>
                        <span>⭐ Отображать в разделе "Основные используемые ФСО"</span>
                    </label>
                    <small style="color:var(--text-dim);margin-top:4px;display:block;">
                        Отмеченные статьи будут показываться в приоритетном списке для сотрудников
                    </small>
                </div>
                
                <div class="form-group">
                    <label>Полный текст</label>
                    <textarea name="fullText" rows="5">${this._esc(article?.fullText || article?.text || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Часть 2 (опционально)</label>
                    <textarea name="part2" rows="3">${this._esc(article?.part2 || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Примечание для ФСО <span style="color:var(--text-dim);font-weight:400;">(опционально)</span></label>
                    <textarea name="fsoHint" rows="4">${this._esc(article?.fsoHint || article?.hint || '')}</textarea>
                    <small style="color:var(--text-dim);margin-top:4px;display:block;">
                        Практическое применение статьи сотрудниками ФСО, порядок действий, важные нюансы
                    </small>
                </div>
                <div class="form-group">
                    <label>Теги (через запятую)</label>
                    <input type="text" name="tags" value="${(article?.tags || []).join(', ')}" placeholder="задержание, оружие, КПП">
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Editor.submitArticleForm('${codeId}', '${article?.id || ''}')">
                        ${isNew ? 'Добавить' : 'Сохранить'}
                    </button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    submitArticleForm(codeId, articleId) {
        const f = document.getElementById('articleForm');
        const fd = new FormData(f);
        const data = {
            num: fd.get('num'),
            title: fd.get('title'),
            severity: fd.get('severity'),
            fullText: fd.get('fullText'),
            part2: fd.get('part2') || undefined,
            penalty: fd.get('penalty') || undefined,
            fsoHint: fd.get('fsoHint') || undefined,
            isFsoMain: fd.get('isFsoMain') === 'on',
            tags: fd.get('tags') ? fd.get('tags').split(',').map(t => t.trim()).filter(Boolean) : []
        };
        
        if (articleId) {
            Store.updateArticle(codeId, articleId, data);
        } else {
            Store.addArticle(codeId, data);
        }
        App.exitEditMode();
        App.showNotification(articleId ? 'Статья обновлена' : 'Статья добавлена', 'success');
    },

    // ========= УСТАВ: РАЗДЕЛ =========
    renderCharterSectionForm(section = null) {
        const isNew = !section;
        return `
            <form class="editor-form" id="charterSectionForm" onsubmit="return false;">
                <h4>${isNew ? '➕ Новый раздел устава' : '✏️ Редактирование раздела'}</h4>
                <div class="form-group">
                    <label>Название раздела *</label>
                    <input type="text" name="sectionName" value="${this._esc(section?.name || '')}" required placeholder="Общие положения">
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Editor.submitCharterSectionForm('${section?.id || ''}')">
                        ${isNew ? 'Создать раздел' : 'Сохранить'}
                    </button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    submitCharterSectionForm(sectionId) {
        const form = document.getElementById('charterSectionForm');
        const fd = new FormData(form);
        const data = { name: fd.get('sectionName') };
        
        if (sectionId) {
            Store.updateCharterSection(sectionId, data);
        } else {
            Store.addCharterSection(data);
        }
        App.exitEditMode();
        App.showNotification(sectionId ? 'Раздел обновлен' : 'Раздел создан', 'success');
    },

    // ========= УСТАВ: СТАТЬЯ =========
    renderCharterArticleForm(sectionId, article = null) {
        const isNew = !article;
        return `
            <form class="editor-form" id="charterArticleForm" onsubmit="return false;">
                <h4>${isNew ? '➕ Новая статья устава' : '✏️ Редактирование статьи'}</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Номер пункта *</label>
                        <input type="text" name="num" value="${this._esc(article?.num || '')}" required placeholder="1.1">
                    </div>
                    <div class="form-group">
                        <label>Название *</label>
                        <input type="text" name="title" value="${this._esc(article?.title || '')}" required placeholder="Назначение Устава">
                    </div>
                </div>
                <div class="form-group">
                    <label>Текст статьи *</label>
                    <textarea name="text" rows="5" required>${this._esc(article?.text || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Примечание (опционально)</label>
                    <textarea name="hint" rows="3">${this._esc(article?.hint || '')}</textarea>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Editor.submitCharterArticleForm('${sectionId}', '${article?.id || ''}')">
                        ${isNew ? 'Добавить статью' : 'Сохранить'}
                    </button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    submitCharterArticleForm(sectionId, articleId) {
        const form = document.getElementById('charterArticleForm');
        const fd = new FormData(form);
        const data = {
            num: fd.get('num'),
            title: fd.get('title'),
            text: fd.get('text'),
            hint: fd.get('hint')
        };
        
        if (articleId) {
            Store.updateCharterArticle(sectionId, articleId, data);
        } else {
            Store.addCharterArticle(sectionId, data);
        }
        App.exitEditMode();
        App.showNotification(articleId ? 'Статья обновлена' : 'Статья добавлена', 'success');
    },

    // ========= ВОПРОС =========
    renderQuestionForm(topicId, blockName, question = null, index = -1) {
        const isNew = !question;
        return `
            <form class="editor-form" id="questionForm" onsubmit="return false;">
                <h4>${isNew ? '➕ Новый вопрос' : '✏️ Редактирование вопроса'}</h4>
                <div class="form-group">
                    <label>Вопрос *</label>
                    <textarea name="q" rows="3" required>${this._esc(question?.question || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Варианты ответов (по одному на строку) *</label>
                    <textarea name="opts" rows="4" required>${question ? question.options.join('\n') : 'Вариант 1\nВариант 2\nВариант 3\nВариант 4'}</textarea>
                </div>
                <div class="form-group">
                    <label>Номер правильного ответа (0 — первый)</label>
                    <input type="number" name="corr" value="${question?.correct || 0}" min="0" max="9">
                </div>
                <div class="form-group">
                    <label>Пояснение к ответу</label>
                    <textarea name="expl" rows="3">${this._esc(question?.explanation || '')}</textarea>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Editor.submitQuestionForm('${topicId}','${blockName}',${index})">
                        ${isNew ? 'Добавить' : 'Сохранить'}
                    </button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    submitQuestionForm(topicId, blockName, index) {
        const fd = new FormData(document.getElementById('questionForm'));
        const data = {
            question: fd.get('q'),
            options: fd.get('opts').split('\n').map(o => o.trim()).filter(Boolean),
            correct: parseInt(fd.get('corr')) || 0,
            explanation: fd.get('expl')
        };
        
        if (index >= 0) {
            Store.updateQuestion(topicId, blockName, index, data);
        } else {
            Store.addQuestion(topicId, blockName, data);
        }
        App.exitEditMode();
        App.showNotification(index >= 0 ? 'Вопрос обновлен' : 'Вопрос добавлен', 'success');
    },

    // ========= ЭКЗАМЕН =========
    renderExamForm(exam = null) {
        const isNew = !exam;
        const allTopics = Store.getQuestions();
        let topicsHtml = '';
        
        if (exam && exam.topics) {
            topicsHtml = exam.topics.map(t => this._examTopicRowHtml(allTopics, t)).join('');
        }
        
        return `
            <form class="editor-form" id="examForm" onsubmit="return false;">
                <h4>${isNew ? '➕ Новый экзамен' : '✏️ Редактирование экзамена'}</h4>
                <div class="form-group">
                    <label>Название *</label>
                    <input type="text" name="title" value="${this._esc(exam?.title || '')}" required>
                </div>
                <div class="form-group">
                    <label>Описание</label>
                    <textarea name="desc" rows="2">${this._esc(exam?.description || '')}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Лимит времени (мин)</label>
                        <input type="number" name="time" value="${exam?.timeLimit || 15}" min="5" max="120">
                    </div>
                    <div class="form-group">
                        <label>Проходной балл (%)</label>
                        <input type="number" name="pass" value="${exam?.passingScore || 70}" min="50" max="100">
                    </div>
                </div>
                <div class="form-group">
                    <label>Темы и блоки вопросов</label>
                    <div id="examTopics">${topicsHtml}</div>
                    <button type="button" class="btn btn-sm btn-outline" onclick="Editor.addExamTopicRow()">
                        + Добавить тему
                    </button>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Editor.submitExamForm('${exam?.id || ''}')">
                        ${isNew ? 'Создать' : 'Сохранить'}
                    </button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    _examTopicRowHtml(allTopics, t = {}) {
        return `<div class="exam-topic-row">
            <select>${Object.entries(allTopics).map(([k, v]) => `<option value="${k}" ${t.topicId === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
            <input type="text" class="block-name" value="${this._esc(t.blockName || '')}" placeholder="Название блока">
            <input type="number" class="q-count" value="${t.questionCount || 5}" min="1" max="50" style="width:60px;">
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">×</button>
        </div>`;
    },

    addExamTopicRow() {
        const allTopics = Store.getQuestions();
        const div = document.createElement('div');
        div.innerHTML = this._examTopicRowHtml(allTopics);
        document.getElementById('examTopics').appendChild(div.firstElementChild);
    },

    submitExamForm(id) {
        const fd = new FormData(document.getElementById('examForm'));
        const topics = Array.from(document.querySelectorAll('.exam-topic-row')).map(row => ({
            topicId: row.querySelector('select').value,
            blockName: row.querySelector('.block-name').value,
            questionCount: parseInt(row.querySelector('.q-count').value) || 5
        })).filter(t => t.topicId && t.blockName);

        const data = {
            title: fd.get('title'),
            description: fd.get('desc'),
            timeLimit: parseInt(fd.get('time')) || 15,
            passingScore: parseInt(fd.get('pass')) || 70,
            topics: topics
        };
        
        if (id) {
            Store.updateExam(id, data);
        } else {
            Store.addExam(data);
        }
        App.exitEditMode();
        App.showNotification(id ? 'Экзамен обновлен' : 'Экзамен создан', 'success');
    },

    // ========= КУРСАНТ =========
    renderCadetForm() {
        return `
            <form class="editor-form" id="cadetForm" onsubmit="return false;">
                <h4>➕ Регистрация курсанта</h4>
                <div class="form-group">
                    <label>ФИО *</label>
                    <input type="text" name="name" required placeholder="Иванов Алексей Петрович">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Звание</label>
                        <select name="rank">
                            ${['Рядовой', 'Младший сержант', 'Сержант', 'Старший сержант', 'Старшина', 'Младший лейтенант', 'Лейтенант', 'Старший лейтенант', 'Капитан'].map(r => `<option>${r}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Подразделение</label>
                        <input type="text" name="dept" placeholder="Отдел охраны объектов">
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Editor.submitCadetForm()">Зарегистрировать</button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    submitCadetForm() {
        const fd = new FormData(document.getElementById('cadetForm'));
        const cadet = Store.addCadet({
            fullName: fd.get('name'),
            rank: fd.get('rank'),
            department: fd.get('dept')
        });
        
        App.showModal('✅ Курсант зарегистрирован', `
            <div style="text-align:center;">
                <p><strong>${cadet.fullName}</strong></p>
                <p>${cadet.rank}, ${cadet.department || 'Не указано'}</p>
                <div style="background:var(--surface-light);padding:20px;border-radius:var(--radius);margin:16px 0;">
                    <p style="color:var(--text-dim);">Пароль для экзаменов:</p>
                    <p style="font-size:32px;font-weight:700;color:var(--gold-light);letter-spacing:6px;">${cadet.password}</p>
                </div>
                <p style="color:var(--danger);font-size:12px;">⚠️ Пароль показан только один раз! Запишите его.</p>
                <button class="btn btn-primary" onclick="document.getElementById('modalOverlay').classList.remove('show');App.renderPage();">Закрыть</button>
            </div>`);
        App.exitEditMode();
    },

    // ========= СТРУКТУРА: ДИРЕКТОР =========
    renderDirectorForm() {
        const director = Store.getStructure().director;
        return `
            <form class="editor-form" id="directorForm" onsubmit="return false;">
                <h4>✏️ Редактирование данных Директора ФСО</h4>
                <div class="form-group">
                    <label>Должность</label>
                    <input type="text" name="title" value="${this._esc(director.title)}" placeholder="Директор ФСО">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Звание</label>
                        <input type="text" name="rank" value="${this._esc(director.rank)}" placeholder="Генерал-полковник">
                    </div>
                    <div class="form-group">
                        <label>ФИО</label>
                        <input type="text" name="name" value="${this._esc(director.name)}" placeholder="Иванов Иван Иванович">
                    </div>
                </div>
                <div class="form-group">
                    <label>Обязанности</label>
                    <textarea name="duties" rows="3">${this._esc(director.duties)}</textarea>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Editor.submitDirectorForm()">Сохранить</button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    submitDirectorForm() {
        const fd = new FormData(document.getElementById('directorForm'));
        Store.updateDirector({
            title: fd.get('title'),
            rank: fd.get('rank'),
            name: fd.get('name'),
            duties: fd.get('duties')
        });
        App.exitEditMode();
        App.showNotification('Данные директора обновлены', 'success');
    },

    // ========= СТРУКТУРА: УПРАВЛЕНИЕ =========
    renderDepartmentForm(department = null) {
        const isNew = !department;
        return `
            <form class="editor-form" id="departmentForm" onsubmit="return false;">
                <h4>${isNew ? '➕ Новое управление' : '✏️ Редактирование управления'}</h4>
                <div class="form-group">
                    <label>Название управления *</label>
                    <input type="text" name="name" value="${this._esc(department?.name || '')}" required placeholder="Служба безопасности Президента">
                </div>
                <div class="form-group">
                    <label>Описание</label>
                    <textarea name="description" rows="2">${this._esc(department?.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Задачи</label>
                    <textarea name="tasks" rows="2">${this._esc(department?.tasks || '')}</textarea>
                </div>
                
                <h5 style="margin-top:8px;color:var(--gold-light);">👤 Руководитель управления</h5>
                <div class="form-row">
                    <div class="form-group">
                        <label>Должность</label>
                        <input type="text" name="headTitle" value="${this._esc(department?.head?.title || '')}" placeholder="Руководитель управления">
                    </div>
                    <div class="form-group">
                        <label>Звание</label>
                        <input type="text" name="headRank" value="${this._esc(department?.head?.rank || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>ФИО руководителя</label>
                        <input type="text" name="headName" value="${this._esc(department?.head?.name || '')}">
                    </div>
                    <div class="form-group">
                        <label>Обязанности</label>
                        <input type="text" name="headDuties" value="${this._esc(department?.head?.duties || '')}">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Editor.submitDepartmentForm('${department?.id || ''}')">
                        ${isNew ? 'Создать управление' : 'Сохранить'}
                    </button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    submitDepartmentForm(deptId) {
        const fd = new FormData(document.getElementById('departmentForm'));
        const data = {
            name: fd.get('name'),
            description: fd.get('description'),
            tasks: fd.get('tasks'),
            headTitle: fd.get('headTitle'),
            headRank: fd.get('headRank'),
            headName: fd.get('headName'),
            headDuties: fd.get('headDuties')
        };
        
        if (deptId) {
            Store.updateDepartment(deptId, data);
        } else {
            Store.addDepartment(data);
        }
        App.exitEditMode();
        App.showNotification(deptId ? 'Управление обновлено' : 'Управление создано', 'success');
    },

    // ========= СТРУКТУРА: ЗАМЕСТИТЕЛЬ В УПРАВЛЕНИИ =========
    renderDeputyForm(deptId, deputy = null) {
        const isNew = !deputy;
        return `
            <form class="editor-form" id="deputyForm" onsubmit="return false;">
                <h4>${isNew ? '➕ Добавить заместителя' : '✏️ Редактировать заместителя'}</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>Должность *</label>
                        <input type="text" name="title" value="${this._esc(deputy?.title || '')}" required placeholder="Первый заместитель">
                    </div>
                    <div class="form-group">
                        <label>Звание</label>
                        <input type="text" name="rank" value="${this._esc(deputy?.rank || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>ФИО</label>
                        <input type="text" name="name" value="${this._esc(deputy?.name || '')}">
                    </div>
                    <div class="form-group">
                        <label>Обязанности</label>
                        <input type="text" name="duties" value="${this._esc(deputy?.duties || '')}">
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Editor.submitDeputyForm('${deptId}', '${deputy?.id || ''}')">
                        ${isNew ? 'Добавить' : 'Сохранить'}
                    </button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    submitDeputyForm(deptId, deputyId) {
        const fd = new FormData(document.getElementById('deputyForm'));
        const data = {
            title: fd.get('title'),
            rank: fd.get('rank'),
            name: fd.get('name'),
            duties: fd.get('duties')
        };
        
        if (deputyId) {
            Store.updateDeputyInDepartment(deptId, deputyId, data);
        } else {
            Store.addDeputyToDepartment(deptId, data);
        }
        App.exitEditMode();
        App.showNotification(deputyId ? 'Заместитель обновлен' : 'Заместитель добавлен', 'success');
    },

    // ========= СТРУКТУРА: ОТДЕЛ ВНУТРИ УПРАВЛЕНИЯ =========
    renderSubdivisionForm(deptId, subdivision = null) {
        const isNew = !subdivision;
        return `
            <form class="editor-form" id="subdivisionForm" onsubmit="return false;">
                <h4>${isNew ? '➕ Новый отдел' : '✏️ Редактирование отдела'}</h4>
                <div class="form-group">
                    <label>Название отдела *</label>
                    <input type="text" name="name" value="${this._esc(subdivision?.name || '')}" required placeholder="Отдел личной охраны">
                </div>
                <div class="form-group">
                    <label>Описание</label>
                    <textarea name="description" rows="2">${this._esc(subdivision?.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label>Задачи</label>
                    <textarea name="tasks" rows="2">${this._esc(subdivision?.tasks || '')}</textarea>
                </div>
                
                <h5 style="margin-top:8px;color:var(--gold-light);">👤 Начальник отдела</h5>
                <div class="form-row">
                    <div class="form-group">
                        <label>Должность</label>
                        <input type="text" name="headTitle" value="${this._esc(subdivision?.head?.title || '')}" placeholder="Начальник отдела">
                    </div>
                    <div class="form-group">
                        <label>Звание</label>
                        <input type="text" name="headRank" value="${this._esc(subdivision?.head?.rank || '')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>ФИО начальника</label>
                        <input type="text" name="headName" value="${this._esc(subdivision?.head?.name || '')}">
                    </div>
                    <div class="form-group">
                        <label>Обязанности</label>
                        <input type="text" name="headDuties" value="${this._esc(subdivision?.head?.duties || '')}">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="Editor.submitSubdivisionForm('${deptId}', '${subdivision?.id || ''}')">
                        ${isNew ? 'Создать отдел' : 'Сохранить'}
                    </button>
                    <button class="btn btn-outline" onclick="App.exitEditMode()">Отмена</button>
                </div>
            </form>`;
    },

    submitSubdivisionForm(deptId, subId) {
        const fd = new FormData(document.getElementById('subdivisionForm'));
        const data = {
            name: fd.get('name'),
            description: fd.get('description'),
            tasks: fd.get('tasks'),
            headTitle: fd.get('headTitle'),
            headRank: fd.get('headRank'),
            headName: fd.get('headName'),
            headDuties: fd.get('headDuties')
        };
        
        if (subId) {
            Store.updateSubdivision(deptId, subId, data);
        } else {
            Store.addSubdivision(deptId, data);
        }
        App.exitEditMode();
        App.showNotification(subId ? 'Отдел обновлен' : 'Отдел создан', 'success');
    },

    // ========= ВСПОМОГАТЕЛЬНЫЕ =========
    _esc(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};
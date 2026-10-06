// ================================================================
//  STORE.JS — Хранилище данных с CRUD операциями
//  Все изменения сохраняются в localStorage
// ================================================================

const Store = {
    STORAGE_KEYS: {
        LEGISLATION: 'fso_legislation',
        CHARTER: 'fso_charter',
        REGULATIONS: 'fso_regulations',
        STRUCTURE: 'fso_structure',
        QUESTIONS: 'fso_questions',
        EXAMS: 'fso_exams',
        CADETS: 'fso_cadets',
        RESULTS: 'fso_results',
        SETTINGS: 'fso_settings'
    },

    _data: {},
    _listeners: {},

    // ========= ИНИЦИАЛИЗАЦИЯ =========
    init() {
        const keys = [
            { key: 'legislation', storage: this.STORAGE_KEYS.LEGISLATION, default: DATA.legislation },
            { key: 'charter', storage: this.STORAGE_KEYS.CHARTER, default: DATA.charter },
            { key: 'regulations', storage: this.STORAGE_KEYS.REGULATIONS, default: DATA.regulations },
            { key: 'structure', storage: this.STORAGE_KEYS.STRUCTURE, default: DATA.structure },
            { key: 'questions', storage: this.STORAGE_KEYS.QUESTIONS, default: DATA.questionBank },
            { key: 'exams', storage: this.STORAGE_KEYS.EXAMS, default: DATA.examPresets },
            { key: 'cadets', storage: this.STORAGE_KEYS.CADETS, default: [] },
            { key: 'results', storage: this.STORAGE_KEYS.RESULTS, default: [] },
            { key: 'settings', storage: this.STORAGE_KEYS.SETTINGS, default: { adminPassword: 'admin123' } }
        ];

        keys.forEach(({ key, storage, default: def }) => {
            try {
                const stored = localStorage.getItem(storage);
                if (stored) {
                    this._data[key] = JSON.parse(stored);
                } else {
                    this._data[key] = JSON.parse(JSON.stringify(def));
                    localStorage.setItem(storage, JSON.stringify(this._data[key]));
                }
            } catch (e) {
                console.warn(`Ошибка загрузки ${key}:`, e);
                this._data[key] = JSON.parse(JSON.stringify(def));
            }
        });
    },

    _save(dataKey) {
        const storageKey = this.STORAGE_KEYS[dataKey.toUpperCase()];
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(this._data[dataKey]));
        }
        this._notify(dataKey);
    },

    subscribe(dataKey, callback) {
        if (!this._listeners[dataKey]) this._listeners[dataKey] = [];
        this._listeners[dataKey].push(callback);
        return () => {
            this._listeners[dataKey] = this._listeners[dataKey].filter(cb => cb !== callback);
        };
    },

    _notify(dataKey) {
        if (this._listeners[dataKey]) {
            this._listeners[dataKey].forEach(cb => {
                try { cb(this._data[dataKey]); } catch (e) { console.error(e); }
            });
        }
        if (typeof App !== 'undefined' && App.onDataChanged) {
            App.onDataChanged(dataKey);
        }
    },

    // ========= ГЕТТЕРЫ =========
    getLegislation() { return this._data.legislation; },
    getCharter() { return this._data.charter; },
    getRegulations() { return this._data.regulations; },
    getStructure() { return this._data.structure; },
    getQuestions() { return this._data.questions; },
    getExams() { return this._data.exams; },
    getCadets() { return this._data.cadets; },
    getResults() { return this._data.results; },
    getSettings() { return this._data.settings; },

    // ========= CRUD: ЗАКОНОДАТЕЛЬСТВО =========
    getCodeById(id) { return this._data.legislation.codes.find(c => c.id === id); },

    addCode(data) {
        const code = {
            id: 'code_' + Date.now(),
            name: data.name || 'Новый кодекс',
            icon: data.icon || '📋',
            shortName: data.shortName || '',
            description: data.description || '',
            articles: []
        };
        this._data.legislation.codes.push(code);
        this._save('legislation');
        return code;
    },

    updateCode(id, updates) {
        const code = this._data.legislation.codes.find(c => c.id === id);
        if (code) {
            Object.assign(code, updates);
            this._save('legislation');
        }
        return code;
    },

    deleteCode(id) {
        this._data.legislation.codes = this._data.legislation.codes.filter(c => c.id !== id);
        this._save('legislation');
    },

    addArticle(codeId, data) {
        const code = this._data.legislation.codes.find(c => c.id === codeId);
        if (!code) return null;
        const article = {
            id: 'art_' + Date.now(),
            num: data.num || 'Новая статья',
            title: data.title || '',
            fullText: data.fullText || data.text || '',
            part2: data.part2 || '',
            severity: data.severity || '',
            penalty: data.penalty || '',
            fsoHint: data.fsoHint || data.hint || '',
            isFsoMain: data.isFsoMain !== undefined ? data.isFsoMain : false,
            tags: data.tags || []
        };
        code.articles.push(article);
        this._save('legislation');
        return article;
    },

    updateArticle(codeId, articleId, updates) {
        const code = this._data.legislation.codes.find(c => c.id === codeId);
        if (!code) return null;
        const article = code.articles.find(a => a.id === articleId);
        if (article) {
            Object.assign(article, updates);
            this._save('legislation');
        }
        return article;
    },

    deleteArticle(codeId, articleId) {
        const code = this._data.legislation.codes.find(c => c.id === codeId);
        if (code) {
            code.articles = code.articles.filter(a => a.id !== articleId);
            this._save('legislation');
        }
    },

    // ========= CRUD: УСТАВ =========
    getCharterSectionById(sectionId) {
        return this._data.charter.sections.find(s => s.id === sectionId);
    },

    addCharterSection(data) {
        const section = {
            id: 'chs_' + Date.now(),
            name: data.name || 'Новый раздел',
            articles: []
        };
        this._data.charter.sections.push(section);
        this._save('charter');
        return section;
    },

    updateCharterSection(sectionId, updates) {
        const section = this._data.charter.sections.find(s => s.id === sectionId);
        if (section) {
            Object.assign(section, updates);
            this._save('charter');
        }
        return section;
    },

    deleteCharterSection(sectionId) {
        this._data.charter.sections = this._data.charter.sections.filter(s => s.id !== sectionId);
        this._save('charter');
    },

    addCharterArticle(sectionId, data) {
        const section = this._data.charter.sections.find(s => s.id === sectionId);
        if (!section) return null;
        const article = {
            id: 'cha_' + Date.now(),
            num: data.num || 'Новый пункт',
            title: data.title || '',
            text: data.text || '',
            hint: data.hint || ''
        };
        section.articles.push(article);
        this._save('charter');
        return article;
    },

    updateCharterArticle(sectionId, articleId, updates) {
        const section = this._data.charter.sections.find(s => s.id === sectionId);
        if (!section) return null;
        const article = section.articles.find(a => a.id === articleId);
        if (article) {
            Object.assign(article, updates);
            this._save('charter');
        }
        return article;
    },

    deleteCharterArticle(sectionId, articleId) {
        const section = this._data.charter.sections.find(s => s.id === sectionId);
        if (section) {
            section.articles = section.articles.filter(a => a.id !== articleId);
            this._save('charter');
        }
    },

    // ========= CRUD: ИНСТРУКЦИИ =========
    getInstructionById(id) {
        return this._data.regulations.instructions.find(i => i.id === id);
    },

    addInstruction(data) {
        const inst = {
            id: 'instr_' + Date.now(),
            name: data.name || 'Новая инструкция',
            icon: data.icon || '📋',
            content: data.content || { title: 'Новая инструкция', blocks: [] }
        };
        this._data.regulations.instructions.push(inst);
        this._save('regulations');
        return inst;
    },

    updateInstruction(id, updates) {
        const inst = this._data.regulations.instructions.find(i => i.id === id);
        if (inst) {
            Object.assign(inst, updates);
            this._save('regulations');
        }
        return inst;
    },

    deleteInstruction(id) {
        this._data.regulations.instructions = this._data.regulations.instructions.filter(i => i.id !== id);
        this._save('regulations');
    },

    // ========= CRUD: СТРУКТУРА (иерархическая) =========
    updateDirector(updates) {
        Object.assign(this._data.structure.director, updates);
        this._save('structure');
    },

    addDepartment(data) {
        const dept = {
            id: 'dept_' + Date.now(),
            name: data.name || 'Новое управление',
            description: data.description || '',
            tasks: data.tasks || '',
            head: {
                title: data.headTitle || 'Руководитель управления',
                rank: data.headRank || '',
                name: data.headName || '',
                duties: data.headDuties || ''
            },
            deputies: data.deputies || [],
            subdivisions: []
        };
        this._data.structure.departments.push(dept);
        this._save('structure');
        return dept;
    },

    updateDepartment(deptId, updates) {
        const dept = this._data.structure.departments.find(d => d.id === deptId);
        if (dept) {
            if (updates.head) {
                Object.assign(dept.head, updates.head);
                delete updates.head;
            }
            if (updates.headTitle !== undefined) {
                dept.head.title = updates.headTitle;
                dept.head.rank = updates.headRank || dept.head.rank;
                dept.head.name = updates.headName || dept.head.name;
                dept.head.duties = updates.headDuties || dept.head.duties;
            }
            Object.assign(dept, updates);
            // Удаляем временные поля
            delete dept.headTitle;
            delete dept.headRank;
            delete dept.headName;
            delete dept.headDuties;
            this._save('structure');
        }
        return dept;
    },

    deleteDepartment(deptId) {
        this._data.structure.departments = this._data.structure.departments.filter(d => d.id !== deptId);
        this._save('structure');
    },

    addDeputyToDepartment(deptId, data) {
        const dept = this._data.structure.departments.find(d => d.id === deptId);
        if (!dept) return null;
        const deputy = {
            id: 'dep_' + Date.now(),
            title: data.title || 'Заместитель',
            rank: data.rank || '',
            name: data.name || '',
            duties: data.duties || ''
        };
        dept.deputies.push(deputy);
        this._save('structure');
        return deputy;
    },

    updateDeputyInDepartment(deptId, deputyId, updates) {
        const dept = this._data.structure.departments.find(d => d.id === deptId);
        if (!dept) return null;
        const deputy = dept.deputies.find(d => d.id === deputyId);
        if (deputy) {
            Object.assign(deputy, updates);
            this._save('structure');
        }
        return deputy;
    },

    deleteDeputyFromDepartment(deptId, deputyId) {
        const dept = this._data.structure.departments.find(d => d.id === deptId);
        if (dept) {
            dept.deputies = dept.deputies.filter(d => d.id !== deputyId);
            this._save('structure');
        }
    },

    addSubdivision(deptId, data) {
        const dept = this._data.structure.departments.find(d => d.id === deptId);
        if (!dept) return null;
        const sub = {
            id: 'sub_' + Date.now(),
            name: data.name || 'Новый отдел',
            description: data.description || '',
            tasks: data.tasks || '',
            head: {
                title: data.headTitle || 'Начальник отдела',
                rank: data.headRank || '',
                name: data.headName || '',
                duties: data.headDuties || ''
            },
            deputies: data.deputies || []
        };
        dept.subdivisions.push(sub);
        this._save('structure');
        return sub;
    },

    updateSubdivision(deptId, subId, updates) {
        const dept = this._data.structure.departments.find(d => d.id === deptId);
        if (!dept) return null;
        const sub = dept.subdivisions.find(s => s.id === subId);
        if (sub) {
            if (updates.headTitle !== undefined) {
                sub.head.title = updates.headTitle;
                sub.head.rank = updates.headRank || sub.head.rank;
                sub.head.name = updates.headName || sub.head.name;
                sub.head.duties = updates.headDuties || sub.head.duties;
            }
            Object.assign(sub, updates);
            delete sub.headTitle;
            delete sub.headRank;
            delete sub.headName;
            delete sub.headDuties;
            this._save('structure');
        }
        return sub;
    },

    deleteSubdivision(deptId, subId) {
        const dept = this._data.structure.departments.find(d => d.id === deptId);
        if (dept) {
            dept.subdivisions = dept.subdivisions.filter(s => s.id !== subId);
            this._save('structure');
        }
    },

    addDeputyToSubdivision(deptId, subId, data) {
        const dept = this._data.structure.departments.find(d => d.id === deptId);
        if (!dept) return null;
        const sub = dept.subdivisions.find(s => s.id === subId);
        if (!sub) return null;
        const deputy = {
            id: 'sdep_' + Date.now(),
            title: data.title || 'Заместитель начальника отдела',
            rank: data.rank || '',
            name: data.name || '',
            duties: data.duties || ''
        };
        sub.deputies.push(deputy);
        this._save('structure');
        return deputy;
    },

    updateDeputyInSubdivision(deptId, subId, deputyId, updates) {
        const dept = this._data.structure.departments.find(d => d.id === deptId);
        if (!dept) return null;
        const sub = dept.subdivisions.find(s => s.id === subId);
        if (!sub) return null;
        const deputy = sub.deputies.find(d => d.id === deputyId);
        if (deputy) {
            Object.assign(deputy, updates);
            this._save('structure');
        }
        return deputy;
    },

    deleteDeputyFromSubdivision(deptId, subId, deputyId) {
        const dept = this._data.structure.departments.find(d => d.id === deptId);
        if (!dept) return;
        const sub = dept.subdivisions.find(s => s.id === subId);
        if (sub) {
            sub.deputies = sub.deputies.filter(d => d.id !== deputyId);
            this._save('structure');
        }
    },

    updateRanks(ranks) {
        this._data.structure.ranks = ranks;
        this._save('structure');
    },

    // ========= CRUD: ВОПРОСЫ =========
    addTopic(id, name, icon = '📝') {
        if (this._data.questions[id]) return null;
        this._data.questions[id] = { name, icon, blocks: {} };
        this._save('questions');
        return this._data.questions[id];
    },

    deleteTopic(id) {
        delete this._data.questions[id];
        this._save('questions');
    },

    addBlock(topicId, name) {
        if (!this._data.questions[topicId] || this._data.questions[topicId].blocks[name]) return null;
        this._data.questions[topicId].blocks[name] = [];
        this._save('questions');
        return this._data.questions[topicId].blocks[name];
    },

    deleteBlock(topicId, name) {
        if (this._data.questions[topicId]) {
            delete this._data.questions[topicId].blocks[name];
            this._save('questions');
        }
    },

    addQuestion(topicId, blockName, data) {
        const topic = this._data.questions[topicId];
        if (!topic || !topic.blocks[blockName]) return null;
        const q = {
            question: data.question || '',
            options: data.options || [],
            correct: data.correct || 0,
            explanation: data.explanation || ''
        };
        topic.blocks[blockName].push(q);
        this._save('questions');
        return q;
    },

    updateQuestion(topicId, blockName, index, updates) {
        const topic = this._data.questions[topicId];
        if (topic && topic.blocks[blockName] && topic.blocks[blockName][index]) {
            Object.assign(topic.blocks[blockName][index], updates);
            this._save('questions');
            return topic.blocks[blockName][index];
        }
        return null;
    },

    deleteQuestion(topicId, blockName, index) {
        const topic = this._data.questions[topicId];
        if (topic && topic.blocks[blockName]) {
            topic.blocks[blockName].splice(index, 1);
            this._save('questions');
        }
    },

    // ========= CRUD: ЭКЗАМЕНЫ =========
    getExamById(id) { return this._data.exams.find(e => e.id === id); },

    addExam(data) {
        const exam = {
            id: 'exam_' + Date.now(),
            title: data.title || 'Новый экзамен',
            description: data.description || '',
            timeLimit: data.timeLimit || 15,
            passingScore: data.passingScore || 70,
            topics: data.topics || []
        };
        this._data.exams.push(exam);
        this._save('exams');
        return exam;
    },

    updateExam(id, updates) {
        const exam = this._data.exams.find(e => e.id === id);
        if (exam) {
            Object.assign(exam, updates);
            this._save('exams');
        }
        return exam;
    },

    deleteExam(id) {
        this._data.exams = this._data.exams.filter(e => e.id !== id);
        this._save('exams');
    },

    // ========= КУРСАНТЫ =========
    addCadet(data) {
        const password = Array.from({ length: 6 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');
        const cadet = {
            id: 'cadet_' + Date.now(),
            fullName: data.fullName || '',
            rank: data.rank || '',
            department: data.department || '',
            password,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        this._data.cadets.push(cadet);
        this._save('cadets');
        return cadet;
    },

    findCadetByPassword(password) {
        return this._data.cadets.find(c => c.password === password && c.isActive);
    },

    // ========= РЕЗУЛЬТАТЫ =========
    saveResult(data) {
        const result = {
            id: 'res_' + Date.now(),
            cadetId: data.cadetId || '',
            cadetName: data.cadetName || '',
            cadetRank: data.cadetRank || '',
            examId: data.examId || '',
            examTitle: data.examTitle || '',
            score: data.score || 0,
            correct: data.correct || 0,
            total: data.total || 0,
            passed: data.passed || false,
            timeSpent: data.timeSpent || 0,
            date: new Date().toISOString()
        };
        this._data.results.push(result);
        this._save('results');
        return result;
    },

    getResultsByCadet(cadetId) {
        return this._data.results.filter(r => r.cadetId === cadetId);
    },

    getAllResults() {
        return [...this._data.results].sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // ========= СБРОС =========
    resetSection(sectionKey) {
        const storageKey = this.STORAGE_KEYS[sectionKey.toUpperCase()];
        if (storageKey && DATA[sectionKey]) {
            this._data[sectionKey] = JSON.parse(JSON.stringify(DATA[sectionKey]));
            localStorage.setItem(storageKey, JSON.stringify(this._data[sectionKey]));
            this._notify(sectionKey);
        }
    }
};
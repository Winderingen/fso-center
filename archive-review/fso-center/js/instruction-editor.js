// ================================================================
//  INSTRUCTION-EDITOR.JS — Визуальный редактор инструкций
// ================================================================

const InstructionEditor = {
    currentInstructionId: null,
    blocks: [],
    selectedBlockIndex: -1,

    // Инициализация редактора
    init(instructionId, existingContent) {
        this.currentInstructionId = instructionId;
        this.blocks = existingContent?.blocks || [];
        this.selectedBlockIndex = -1;
        this._originalName = existingContent?.title || '';
        this.render();
    },

    // Рендер всего редактора
    render() {
        const contentArea = document.getElementById('contentArea');
        
        let html = `
            <div class="instruction-editor">
                <div class="editor-header">
                    <h3>✏️ Редактор инструкции</h3>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-primary" onclick="InstructionEditor.save()">💾 Сохранить</button>
                        <button class="btn btn-outline" onclick="InstructionEditor.cancel()">Отмена</button>
                    </div>
                </div>

                <!-- Панель инструментов -->
                <div class="editor-toolbar">
                    <button class="toolbar-btn" onclick="InstructionEditor.addBlock('title')" title="Заголовок">
                        <span style="font-weight:bold;font-size:18px;">H</span> Заголовок
                    </button>
                    <button class="toolbar-btn" onclick="InstructionEditor.addBlock('text')" title="Текст">
                        📝 Текст
                    </button>
                    <button class="toolbar-btn" onclick="InstructionEditor.addBlock('steps')" title="Нумерованные шаги">
                        🔢 Шаги
                    </button>
                    <button class="toolbar-btn" onclick="InstructionEditor.addBlock('warning')" title="Предупреждение">
                        ⚠️ Предупреждение
                    </button>
                    <button class="toolbar-btn" onclick="InstructionEditor.addBlock('info')" title="Информация">
                        ℹ️ Инфо
                    </button>
                    <button class="toolbar-btn" onclick="InstructionEditor.addBlock('danger')" title="Опасность">
                        🚫 Опасно
                    </button>
                    <button class="toolbar-btn" onclick="InstructionEditor.addBlock('image')" title="Изображение">
                        🖼 Изображение
                    </button>
                    <button class="toolbar-btn" onclick="InstructionEditor.addBlock('list')" title="Список">
                        📋 Список
                    </button>
                    <button class="toolbar-btn" onclick="InstructionEditor.addBlock('divider')" title="Разделитель">
                        ➖ Разделитель
                    </button>
                </div>

                <!-- Рабочая область -->
                <div class="editor-canvas" id="editorCanvas">
                    ${this.blocks.length === 0 ? `
                        <div class="empty-state" style="padding:60px 20px;">
                            <div class="empty-icon">📝</div>
                            <h4>Инструкция пуста</h4>
                            <p>Используйте кнопки выше, чтобы добавить блоки содержания.</p>
                        </div>
                    ` : ''}
                    ${this.blocks.map((block, index) => this.renderBlock(block, index)).join('')}
                </div>
            </div>
        `;

        contentArea.innerHTML = html;
        this.bindEvents();
    },

    // Рендер отдельного блока
    renderBlock(block, index) {
        const isSelected = index === this.selectedBlockIndex;
        const blockClass = isSelected ? 'editor-block selected' : 'editor-block';
        
        const controls = isSelected ? `
            <div class="block-controls">
                <button class="btn btn-sm btn-outline" onclick="InstructionEditor.moveBlock(${index}, -1)" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button class="btn btn-sm btn-outline" onclick="InstructionEditor.moveBlock(${index}, 1)" ${index === this.blocks.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="btn btn-sm btn-outline" onclick="InstructionEditor.duplicateBlock(${index})">📋</button>
                <button class="btn btn-sm btn-danger" onclick="InstructionEditor.deleteBlock(${index})">🗑</button>
            </div>
        ` : '';

        let blockContent = '';

        switch (block.type) {
            case 'title':
                blockContent = `
                    <div class="block-title-display">
                        ${isSelected 
                            ? `<input type="text" class="block-input block-title-input" value="${this.escapeHtml(block.content || '')}" 
                                   placeholder="Введите заголовок..." onchange="InstructionEditor.updateBlockContent(${index}, 'content', this.value)">`
                            : `<h4>${block.content || 'Заголовок'}</h4>`
                        }
                    </div>
                `;
                break;

            case 'text':
                blockContent = `
                    <div class="block-text-display">
                        ${isSelected 
                            ? `<textarea class="block-input block-text-input" rows="4" 
                                   placeholder="Введите текст..." onchange="InstructionEditor.updateBlockContent(${index}, 'content', this.value)">${this.escapeHtml(block.content || '')}</textarea>`
                            : `<p>${block.content || 'Текст'}</p>`
                        }
                    </div>
                `;
                break;

            case 'steps':
                const steps = block.steps || [];
                blockContent = `
                    <div class="block-steps-display">
                        <h4>${block.title || 'Порядок действий'}</h4>
                        ${isSelected ? `
                            <input type="text" class="block-input" value="${this.escapeHtml(block.title || '')}" 
                                   placeholder="Заголовок шагов" onchange="InstructionEditor.updateBlockContent(${index}, 'title', this.value)" style="margin-bottom:8px;">
                        ` : ''}
                        <ol>
                            ${steps.map((step, si) => `
                                <li>
                                    ${isSelected 
                                        ? `<div style="display:flex;gap:8px;align-items:center;">
                                            <input type="text" class="block-input" value="${this.escapeHtml(step)}" 
                                                   onchange="InstructionEditor.updateStep(${index}, ${si}, this.value)" style="flex:1;">
                                            <button class="btn btn-sm btn-danger" onclick="InstructionEditor.deleteStep(${index}, ${si})">×</button>
                                           </div>`
                                        : step
                                    }
                                </li>
                            `).join('')}
                        </ol>
                        ${isSelected ? `<button class="btn btn-sm btn-outline" style="margin-top:8px;" onclick="InstructionEditor.addStep(${index})">+ Добавить шаг</button>` : ''}
                    </div>
                `;
                break;

            case 'warning':
                blockContent = `
                    <div class="block-alert-display alert-warning">
                        ${isSelected 
                            ? `<textarea class="block-input block-alert-input" rows="3" 
                                   placeholder="Текст предупреждения..." onchange="InstructionEditor.updateBlockContent(${index}, 'content', this.value)">${this.escapeHtml(block.content || '')}</textarea>`
                            : `<strong>⚠️ Предупреждение:</strong> ${block.content || ''}`
                        }
                    </div>
                `;
                break;

            case 'info':
                blockContent = `
                    <div class="block-alert-display alert-info">
                        ${isSelected 
                            ? `<textarea class="block-input block-alert-input" rows="3" 
                                   placeholder="Информационное сообщение..." onchange="InstructionEditor.updateBlockContent(${index}, 'content', this.value)">${this.escapeHtml(block.content || '')}</textarea>`
                            : `<strong>ℹ️ Информация:</strong> ${block.content || ''}`
                        }
                    </div>
                `;
                break;

            case 'danger':
                blockContent = `
                    <div class="block-alert-display alert-danger">
                        ${isSelected 
                            ? `<textarea class="block-input block-alert-input" rows="3" 
                                   placeholder="Текст опасности..." onchange="InstructionEditor.updateBlockContent(${index}, 'content', this.value)">${this.escapeHtml(block.content || '')}</textarea>`
                            : `<strong>🚫 Опасно:</strong> ${block.content || ''}`
                        }
                    </div>
                `;
                break;

            case 'image':
                blockContent = `
                    <div class="block-image-display">
                        ${block.src 
                            ? `<img src="${block.src}" alt="${block.alt || ''}" style="max-width:100%;border-radius:var(--radius);">`
                            : '<div class="empty-state" style="padding:20px;">🖼 Нет изображения</div>'
                        }
                        ${isSelected ? `
                            <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px;">
                                <input type="text" class="block-input" value="${this.escapeHtml(block.src || '')}" 
                                       placeholder="URL изображения" onchange="InstructionEditor.updateBlockContent(${index}, 'src', this.value)">
                                <input type="text" class="block-input" value="${this.escapeHtml(block.alt || '')}" 
                                       placeholder="Подпись к изображению" onchange="InstructionEditor.updateBlockContent(${index}, 'alt', this.value)">
                                <input type="file" accept="image/*" onchange="InstructionEditor.uploadImage(${index}, this)" style="font-size:12px;">
                                <small style="color:var(--text-dim);">Поддерживаются URL и локальные файлы (конвертируются в base64)</small>
                            </div>
                        ` : ''}
                    </div>
                `;
                break;

            case 'list':
                const items = block.items || [];
                blockContent = `
                    <div class="block-list-display">
                        ${block.title ? `<h4>${block.title}</h4>` : ''}
                        ${isSelected ? `
                            <input type="text" class="block-input" value="${this.escapeHtml(block.title || '')}" 
                                   placeholder="Заголовок списка" onchange="InstructionEditor.updateBlockContent(${index}, 'title', this.value)" style="margin-bottom:8px;">
                        ` : ''}
                        <ul>
                            ${items.map((item, ii) => `
                                <li>
                                    ${isSelected 
                                        ? `<div style="display:flex;gap:8px;align-items:center;">
                                            <input type="text" class="block-input" value="${this.escapeHtml(item)}" 
                                                   onchange="InstructionEditor.updateListItem(${index}, ${ii}, this.value)" style="flex:1;">
                                            <button class="btn btn-sm btn-danger" onclick="InstructionEditor.deleteListItem(${index}, ${ii})">×</button>
                                           </div>`
                                        : item
                                    }
                                </li>
                            `).join('')}
                        </ul>
                        ${isSelected ? `<button class="btn btn-sm btn-outline" style="margin-top:8px;" onclick="InstructionEditor.addListItem(${index})">+ Добавить пункт</button>` : ''}
                    </div>
                `;
                break;

            case 'divider':
                blockContent = `<hr class="section-divider" style="margin:8px 0;">`;
                break;

            default:
                blockContent = `<p style="color:var(--text-dim);">Неизвестный тип блока</p>`;
        }

        return `
            <div class="${blockClass}" onclick="InstructionEditor.selectBlock(${index})" id="block-${index}">
                ${controls}
                ${blockContent}
            </div>
        `;
    },

    // Привязка событий
    bindEvents() {
        document.getElementById('editorCanvas').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.selectedBlockIndex = -1;
                this.render();
            }
        });
    },

    // Выбор блока
    selectBlock(index) {
        this.selectedBlockIndex = index;
        this.render();
        setTimeout(() => {
            const block = document.getElementById(`block-${index}`);
            if (block) block.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    },

    // Добавление блока
    addBlock(type) {
        const newBlock = this.createEmptyBlock(type);
        this.blocks.push(newBlock);
        this.selectedBlockIndex = this.blocks.length - 1;
        this.render();
    },

    createEmptyBlock(type) {
        switch (type) {
            case 'title': return { type: 'title', content: '' };
            case 'text': return { type: 'text', content: '' };
            case 'steps': return { type: 'steps', title: 'Порядок действий', steps: ['Шаг 1'] };
            case 'warning': return { type: 'warning', content: '' };
            case 'info': return { type: 'info', content: '' };
            case 'danger': return { type: 'danger', content: '' };
            case 'image': return { type: 'image', src: '', alt: '' };
            case 'list': return { type: 'list', title: '', items: ['Пункт 1'] };
            case 'divider': return { type: 'divider' };
            default: return { type: 'text', content: '' };
        }
    },

    // Обновление содержимого блока
    updateBlockContent(index, field, value) {
        if (this.blocks[index]) {
            this.blocks[index][field] = value;
        }
    },

    // Перемещение блока
    moveBlock(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.blocks.length) return;
        [this.blocks[index], this.blocks[newIndex]] = [this.blocks[newIndex], this.blocks[index]];
        this.selectedBlockIndex = newIndex;
        this.render();
    },

    // Дублирование блока
    duplicateBlock(index) {
        const copy = JSON.parse(JSON.stringify(this.blocks[index]));
        this.blocks.splice(index + 1, 0, copy);
        this.selectedBlockIndex = index + 1;
        this.render();
    },

    // Удаление блока
    deleteBlock(index) {
        if (confirm('Удалить этот блок?')) {
            this.blocks.splice(index, 1);
            this.selectedBlockIndex = -1;
            this.render();
        }
    },

    // Шаги
    addStep(index) {
        if (this.blocks[index]?.type === 'steps') {
            if (!this.blocks[index].steps) this.blocks[index].steps = [];
            this.blocks[index].steps.push(`Шаг ${this.blocks[index].steps.length + 1}`);
            this.render();
        }
    },

    deleteStep(blockIndex, stepIndex) {
        if (this.blocks[blockIndex]?.steps) {
            this.blocks[blockIndex].steps.splice(stepIndex, 1);
            this.render();
        }
    },

    updateStep(blockIndex, stepIndex, value) {
        if (this.blocks[blockIndex]?.steps) {
            this.blocks[blockIndex].steps[stepIndex] = value;
        }
    },

    // Список
    addListItem(index) {
        if (this.blocks[index]?.type === 'list') {
            if (!this.blocks[index].items) this.blocks[index].items = [];
            this.blocks[index].items.push(`Пункт ${this.blocks[index].items.length + 1}`);
            this.render();
        }
    },

    deleteListItem(blockIndex, itemIndex) {
        if (this.blocks[blockIndex]?.items) {
            this.blocks[blockIndex].items.splice(itemIndex, 1);
            this.render();
        }
    },

    updateListItem(blockIndex, itemIndex, value) {
        if (this.blocks[blockIndex]?.items) {
            this.blocks[blockIndex].items[itemIndex] = value;
        }
    },

    // Загрузка изображения
    uploadImage(index, fileInput) {
        const file = fileInput.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите изображение');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (this.blocks[index]) {
                this.blocks[index].src = e.target.result;
                this.blocks[index].alt = file.name;
                this.render();
            }
        };
        reader.readAsDataURL(file);
    },

    // Сохранение
    save() {
        if (this.blocks.length === 0) {
            App.showNotification('Добавьте хотя бы один блок перед сохранением', 'error');
            return;
        }

        let title = '';
        const titleBlock = this.blocks.find(b => b.type === 'title');
        if (titleBlock) {
            title = titleBlock.content || 'Новая инструкция';
        } else {
            title = 'Новая инструкция';
        }

        const contentData = {
            title: title,
            blocks: this.blocks
        };

        if (this.currentInstructionId) {
            const instruction = Store.getInstructionById(this.currentInstructionId);
            if (instruction) {
                Store.updateInstruction(this.currentInstructionId, {
                    name: title,
                    content: contentData
                });
            }
        } else {
            const newInstruction = Store.addInstruction({
                name: title,
                icon: '📋',
                content: contentData
            });
            this.currentInstructionId = newInstruction.id;
        }

        App.exitEditMode();
        App.showNotification('Инструкция сохранена', 'success');
    },

    // Отмена
    cancel() {
        if (this.blocks.length > 0) {
            if (!confirm('У вас есть несохраненные изменения. Выйти без сохранения?')) {
                return;
            }
        }
        App.exitEditMode();
    },

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const e = escapeHtml;
export const questionTypes = { single: 'Один вариант', multiple: 'Несколько вариантов', matching: 'Соответствие' };
export const departments = { sbp: ['СБП', 'Служба безопасности правительства'], as: ['АС', 'Административная служба'], academy: ['Академия', 'Подготовка и обучение'], kmk: ['КМК', 'Комендатура Московского Кремля'] };
const label = (text, key, value = '', textarea = false) => `<label>${text}${textarea ? `<textarea data-q="${key}" rows="3">${e(value)}</textarea>` : `<input data-q="${key}" value="${e(value)}">`}</label>`;
const btn = (text, action, index = '') => `<button class="btn btn-sm btn-outline" type="button" data-q-action="${action}" data-index="${index}">${text}</button>`;
const safeImage = src => /^https:\/\/[^\s]+$/i.test(src || '') || /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(src || '');
export function imageGallery(images = []) { return `<div class="question-images">${images.filter(img => safeImage(img.src)).map(img => `<figure><img src="${e(img.src)}" alt="${e(img.alt || 'Иллюстрация к вопросу')}" referrerpolicy="no-referrer">${img.alt ? `<figcaption class="muted">${e(img.alt)}</figcaption>` : ''}</figure>`).join('')}</div>`; }
export function answerComplete(q, answer) {
  if (q.type === 'multiple') return Array.isArray(answer) && answer.length > 0;
  if (q.type === 'matching') return Array.isArray(answer) && answer.length === q.left.length && answer.every(v => v !== null);
  return answer !== null && answer !== undefined;
}
export function renderQuestion(q, answer) {
  const gallery = imageGallery(q.images);
  if (q.type === 'matching') {
    const values = Array.isArray(answer) ? answer : q.left.map(() => null);
    return `${gallery}<p class="muted">Выберите определение в списке или перетащите его из правой колонки к термину. Каждое определение используется один раз.</p><div class="matching-grid"><div>${q.left.map((term, i) => `<div class="match-target" data-match-left="${i}"><label><strong>${String.fromCharCode(1040 + i)}. ${e(term)}</strong><select data-match-select="${i}" aria-label="Соответствие для ${e(term)}"><option value="">Выберите определение</option>${q.right.map((definition,j) => `<option value="${j}" ${values[i] === j ? 'selected' : ''}>${j+1}. ${e(definition)}</option>`).join('')}</select></label></div>`).join('')}</div><div>${q.right.map((definition,j) => `<div class="match-source ${values.includes(j) ? 'assigned' : ''}" draggable="true" tabindex="0" data-match-right="${j}"><strong>${j+1}.</strong> ${e(definition)}${values.includes(j) ? `<span class="muted"> → ${String.fromCharCode(1040 + values.indexOf(j))}</span>` : ''}</div>`).join('')}</div></div>`;
  }
  return `${gallery}<p class="muted">${q.type === 'multiple' ? 'Выберите все подходящие варианты.' : 'Выберите один вариант.'}</p>${q.options.map((o,i) => {
    const selected = q.type === 'multiple' ? Array.isArray(answer) && answer.includes(i) : answer === i;
    return `<button class="answer-option ${selected ? 'selected' : ''}" data-action="answer" data-id="${i}" aria-pressed="${selected}"><span>${q.type === 'multiple' ? selected ? '☑' : '☐' : selected ? '◉' : '○'}</span>${e(o)}</button>`;
  }).join('')}`;
}
export function bindMatching(container, q, answer, submit) {
  const assign = (left, right) => {
    const values = Array.isArray(answer) ? [...answer] : q.left.map(() => null);
    if (right !== null) { const previous = values.indexOf(right); if (previous >= 0) values[previous] = null; }
    values[left] = right; submit(values);
  };
  container.querySelectorAll('[data-match-select]').forEach(select => select.addEventListener('change', () => assign(Number(select.dataset.matchSelect), select.value === '' ? null : Number(select.value))));
  container.querySelectorAll('[data-match-right]').forEach(source => source.addEventListener('dragstart', event => { event.dataTransfer.setData('application/x-fso-match', source.dataset.matchRight); event.dataTransfer.effectAllowed = 'move'; }));
  container.querySelectorAll('[data-match-left]').forEach(target => {
    target.addEventListener('dragover', event => { event.preventDefault(); target.classList.add('drag-over'); });
    target.addEventListener('dragleave', () => target.classList.remove('drag-over'));
    target.addEventListener('drop', event => { event.preventDefault(); target.classList.remove('drag-over'); const raw = event.dataTransfer.getData('application/x-fso-match'); if (/^\d+$/.test(raw) && Number(raw) < q.right.length) assign(Number(target.dataset.matchLeft), Number(raw)); });
  });
}
export function formatAnswer(q, answer) {
  if (answer === null || answer === undefined || (Array.isArray(answer) && !answer.length)) return 'Не выбран';
  if (q.type === 'matching') return q.left.map((term,i) => `${String.fromCharCode(1040+i)}-${answer[i] === null ? '—' : answer[i]+1}: ${term} → ${answer[i] === null ? 'не выбрано' : q.right[answer[i]]}`).join('\n');
  if (q.type === 'multiple') return answer.map(i => q.options[i]).join('; ');
  return q.options[answer];
}
export function reviewQuestion(q, answer) {
  const right = q.type === 'multiple' ? Array.isArray(answer) && [...answer].sort((a,b)=>a-b).join(',') === [...q.correct].sort((a,b)=>a-b).join(',') : q.type === 'matching' ? Array.isArray(answer) && q.correct.every((v,i)=>answer[i]===v) : answer === q.correct;
  return `${imageGallery(q.images)}<p class="material-body">Ответ сотрудника: ${e(formatAnswer(q,answer))}</p><p class="${right ? 'success' : 'danger'}">${right ? 'Верно' : 'Ошибка'}</p><p class="material-body">Правильный ответ: ${e(formatAnswer(q,q.correct))}</p>`;
}

export function mountQuestionEditor(container, original, save, categories=[]) {
  let draft = structuredClone({ ...original, type: original.type || 'single', options: original.options || ['', ''], correct: original.correct ?? 0, left: original.left || ['', ''], right: original.right || ['', ''], images: original.images || [] });
  let uploadBusy = false;
  function collect() {
    container.querySelectorAll('[data-q]').forEach(input => draft[input.dataset.q] = input.value);
    if (draft.type === 'matching') {
      draft.left = [...container.querySelectorAll('[data-left]')].map(input => input.value);
      draft.right = [...container.querySelectorAll('[data-right]')].map(input => input.value);
      draft.correct = [...container.querySelectorAll('[data-pair]')].map(input => input.value === '' ? null : Number(input.value));
    } else {
      draft.options = [...container.querySelectorAll('[data-option]')].map(input => input.value);
      const indices = [...container.querySelectorAll('[data-correct]:checked')].map(input => Number(input.dataset.correct));
      draft.correct = draft.type === 'multiple' ? indices : indices[0] ?? null;
    }
    container.querySelectorAll('[data-image-alt]').forEach(input => draft.images[Number(input.dataset.imageAlt)].alt = input.value);
  }
  function render() {
    container.innerHTML = `<form class="trial-form question-editor">${label('Тема', 'topic', draft.topic)}${label('Текст вопроса', 'text', draft.text, true)}<label>Тип вопроса<select id="questionType">${Object.entries(questionTypes).map(([type,text])=>`<option value="${type}" ${draft.type===type?'selected':''}>${text}</option>`).join('')}</select></label>${draft.type === 'matching' ? renderPairs() : renderOptions()}<h4>Иллюстрации к вопросу</h4><p class="muted">Файлы сохраняются вместе с вопросом в базе сервера. До 6 изображений, каждое до 450 КБ; общий запрос до 2 МБ.</p>${draft.images.map((img,i)=>`<div class="editor-group">${safeImage(img.src) ? `<img class="editor-image-preview" src="${e(img.src)}" alt="${e(img.alt)}" referrerpolicy="no-referrer">` : ''}<label>Подпись изображения ${i+1}<input data-image-alt="${i}" value="${e(img.alt)}"></label>${btn('Убрать изображение','remove-image',i)}</div>`).join('')}<label>Добавить изображения<input type="file" id="questionImages" accept="image/png,image/jpeg,image/webp,image/gif" multiple></label><p class="error-message" role="alert"></p><button class="btn btn-primary" type="submit">Сохранить вопрос</button></form>`;
    if(categories.length) { const topic=container.querySelector('[data-q=topic]').closest('label'); topic.outerHTML=`<label>Категория вопроса<select data-q="categoryId">${categories.map(c=>`<option value="${e(c.id)}" ${c.id===draft.categoryId?'selected':''}>${e(c.title)}</option>`).join('')}</select></label>`; }
    const error = text => container.querySelector('.error-message').textContent = text;
    container.querySelector('#questionType').addEventListener('change', event => {
      collect(); const oldType=draft.type; draft.type=event.target.value;
      if(draft.type==='matching') draft.correct=draft.left.map((_,i)=>i);
      else if(oldType==='matching') draft.correct=draft.type==='multiple'?[0]:0;
      else if(draft.type==='multiple') draft.correct=draft.correct===null?[]:[draft.correct];
      else draft.correct=Array.isArray(draft.correct)?draft.correct[0]??null:draft.correct;
      render();
    });
    container.querySelectorAll('[data-q-action]').forEach(button=>button.addEventListener('click',()=>{
      if(uploadBusy)return; collect(); const i=Number(button.dataset.index), action=button.dataset.qAction;
      if(action==='add-option' && draft.options.length<12) draft.options.push('');
      if(action==='remove-option' && draft.options.length>2){ draft.options.splice(i,1); draft.correct=draft.type==='multiple'?draft.correct.filter(v=>v!==i).map(v=>v>i?v-1:v):draft.correct===i?null:draft.correct>i?draft.correct-1:draft.correct; }
      if(action==='add-pair' && draft.left.length<10){draft.left.push('');draft.right.push('');draft.correct.push(null);}
      if(action==='remove-pair' && draft.left.length>2){draft.left.splice(i,1);draft.right.splice(i,1);draft.correct.splice(i,1);draft.correct=draft.correct.map(v=>v===i?null:v>i?v-1:v);}
      if(action==='remove-image')draft.images.splice(i,1);
      render();
    }));
    container.querySelector('#questionImages').addEventListener('change',async event=>{
      if(uploadBusy)return; const files=[...event.target.files]; collect();
      if(draft.images.length+files.length>6 || files.some(f=>f.size>450000||!['image/png','image/jpeg','image/webp','image/gif'].includes(f.type))){error('Допустимо до 6 PNG/JPEG/WebP/GIF, каждый до 450 КБ.');event.target.value='';return;}
      uploadBusy=true;container.querySelector('[type=submit]').disabled=true;
      try{ const images=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({src:reader.result,alt:file.name});reader.onerror=()=>reject(new Error('Не удалось прочитать файл'));reader.readAsDataURL(file);})));draft.images.push(...images);render(); }
      catch(err){error(err.message);}finally{uploadBusy=false;container.querySelector('[type=submit]').disabled=false;}
    });
    container.querySelector('form').addEventListener('submit',async event=>{
      event.preventDefault();if(uploadBusy)return;collect();const button=event.submitter;button.disabled=true;
      try{await save(draft);}catch(err){error(err.message);}finally{button.disabled=false;}
    });
  }
  function renderOptions(){return `<h4>Варианты ответа</h4><p class="muted">${draft.type==='multiple'?'Отметьте все правильные варианты.':'Отметьте один правильный вариант.'}</p>${draft.options.map((option,i)=>`<div class="option-editor-row"><label class="check"><input type="${draft.type==='multiple'?'checkbox':'radio'}" name="correct" data-correct="${i}" ${draft.type==='multiple'?draft.correct.includes(i)?'checked':'':draft.correct===i?'checked':''} aria-label="Правильный вариант ${i+1}"></label><label>Вариант ${i+1}<input data-option="${i}" value="${e(option)}" required maxlength="1000"></label>${btn('Убрать','remove-option',i)}</div>`).join('')}${btn('+ Добавить вариант','add-option')}`;}
  function renderPairs(){return `<p class="muted">Введите термины слева и определения справа. Задайте правильные пары отдельным списком. При экзамене правая колонка перемешивается.</p>${draft.left.map((term,i)=>`<div class="editor-group"><div class="form-row"><label>Термин ${String.fromCharCode(1040+i)}<input data-left="${i}" value="${e(term)}" required maxlength="1000"></label><label>Определение ${i+1}<input data-right="${i}" value="${e(draft.right[i])}" required maxlength="2000"></label></div><label>Правильное соответствие для ${String.fromCharCode(1040+i)}<select data-pair="${i}"><option value="">Выберите номер определения</option>${draft.right.map((_,j)=>`<option value="${j}" ${draft.correct[i]===j?'selected':''}>${j+1}</option>`).join('')}</select></label>${btn('Убрать пару','remove-pair',i)}</div>`).join('')}${btn('+ Добавить пару','add-pair')}`;}
  render();
}

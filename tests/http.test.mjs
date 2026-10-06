import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';

test('HTTP integration: admin CRUD, exam, filtering data and persistence across restart', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'fso-test-'));
  let child;
  t.after(async () => { if (child && child.exitCode === null) { child.kill(); await once(child, 'exit'); } await rm(directory, { recursive: true, force: true }); });
  async function startServer() {
    child = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, PORT: '0', FSO_DATA_DIR: directory, FSO_ADMIN_LOGIN: 'tester', FSO_ADMIN_PASSWORD: 'test-password' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const url = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
      child.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timeout); resolve(match[0]); } });
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited ${code}`)); });
    }); return url;
  }
  let base = await startServer();
  const call = async (action, input = {}, token = '') => {
    const res = await fetch(base + '/api', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify({ action, input }) });
    return { status: res.status, data: await res.json() };
  };
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(base + '/js/app.js')).status, 200);
  assert.equal((await fetch(base + '/.runtime/database.json')).status, 404);
  assert.equal((await call('admin.data')).status, 401);
  assert.equal((await call('auth.login', { username: 'tester', password: 'wrong' })).status, 401);
  const login = await call('auth.login', { username: 'tester', password: 'test-password' }); assert.equal(login.status, 200);
  const admin = login.data.token;
  const material = await call('admin.saveMaterial', { title: 'Интеграционный материал', body: 'Текст', section: 'instructions', published: true }, admin);
  assert.equal(material.status, 200);
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aY2kAAAAASUVORK5CYII=';
  const pictureQuestion=await call('admin.saveQuestion',{topic:'Картинки',type:'multiple',text:'С картинкой',options:['А','Б'],correct:[0],images:[{src:image,alt:'Схема'}]},admin);
  assert.equal(pictureQuestion.status,200);
  const generated=await call('admin.generateCode',{},admin);
  const assembled=await call('admin.saveAssessment',{title:'Сохранённая компоновка',type:'exam',blocks:[{categoryId:pictureQuestion.data.categoryId,mode:'random',count:1}],questionCount:1,timeLimit:10,passingScore:70,published:true,departments:['academy'],code:generated.data.code},admin);
  assert.equal(assembled.status,200);
  const start = await call('attempt.start', { assessmentId: 'exam-demo', code: 'АКАДЕМИЯ', rank: 'Рядовой', fullName: 'Тестовый Курсант', certificate: '111_222' });
  assert.equal(start.status, 200);
  const id = start.data.attempt.id, token = start.data.token;
  assert.equal((await call('attempt.answer', { id, token, index: 0, answer: 0 })).status, 200);
  const end = await call('attempt.finish', { id, token }); assert.equal(end.status, 200);
  assert.equal(end.data.attempt.questions, undefined); assert.equal(end.data.attempt.answers, undefined);
  const summary = await call('admin.data', {}, admin); assert.equal(summary.data.attempts[0].cadet.certificate, '111_222');
  const database = new DatabaseSync(path.join(directory, 'database.sqlite'), { readOnly: true });
  const persisted = JSON.parse(database.prepare('SELECT data FROM fso_state WHERE id=1').get().data);
  database.close(); assert.equal(persisted.attempts.length, 1);
  child.kill(); await once(child, 'exit'); base = await startServer();
  const resumed = await call('attempt.get', { id, token }); assert.equal(resumed.data.attempt.status, 'completed');
  const catalog = await call('catalog'); assert.ok(catalog.data.materials.some(m => m.id === material.data.id));
  assert.equal((await call('admin.data', {}, admin)).status, 401);
  const newLogin=await call('auth.login',{username:'tester',password:'test-password'});
  const restored=await call('admin.data',{},newLogin.data.token);
  assert.equal(restored.data.questions.find(q=>q.id===pictureQuestion.data.id).images[0].src,image);
  const assessment=restored.data.assessments.find(a=>a.id===assembled.data.id);
  assert.equal(assessment.accessCode,generated.data.code);assert.equal(assessment.blocks[0].count,1);
  const safe= catalog.data.assessments.find(a=>a.id===assembled.data.id);assert.equal(safe.accessCode,undefined);assert.equal(safe.blocks,undefined);
  const composedStart=await call('attempt.start',{assessmentId:assembled.data.id,department:'academy',code:generated.data.code,rank:'Рядовой',fullName:'Проверка компоновки',certificate:'222_333'});
  assert.equal(composedStart.status,200);assert.equal(composedStart.data.attempt.questions[0].id,pictureQuestion.data.id);
});

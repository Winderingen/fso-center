import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatch, codeHash } from '../supabase/functions/_shared/domain.mjs';
import { seed } from '../supabase/functions/_shared/seed.mjs';
const ctx={pepper:'results-test',client:'test',now:1000000},admin={...ctx,admin:true};
const input={assessmentId:'exam-demo',code:'EXAM',fullName:'Иван Иванов',rank:'Рядовой',certificate:'123-456'};
async function setup(){const state=seed();state.assessments[1].accessHash=await codeHash('EXAM',ctx.pepper);return state;}
test('instructor is optional and survives completion, persistence and admin review',async()=>{
  const state=await setup();
  const absent=await dispatch(state,'attempt.start',input,ctx);assert.equal(absent.attempt.instructor,null);
  const started=await dispatch(state,'attempt.start',{...input,instructorFullName:' Пётр Петров ',instructorCertificate:' 456-789 '},ctx);
  const instructor={fullName:'Пётр Петров',certificate:'456-789'};
  assert.deepEqual(started.attempt.instructor,instructor);
  const finished=await dispatch(state,'attempt.finish',{id:started.attempt.id,token:started.token},ctx);
  assert.equal(finished.attempt.instructor,undefined);assert.equal(finished.attempt.questions,undefined);
  const data=await dispatch(JSON.parse(JSON.stringify(state)),'admin.data',{},admin);
  assert.deepEqual(data.attempts.find(a=>a.id===started.attempt.id).instructor,instructor);
  for(const optional of [{instructorFullName:'Пётр Петров'},{instructorCertificate:'456-789'}]) await dispatch(state,'attempt.start',{...input,...optional},ctx);
});
test('instructor certificate format is checked server-side without creating an invalid attempt',async()=>{
  const state=await setup();
  await assert.rejects(dispatch(state,'attempt.start',{...input,instructorCertificate:'123_456'},ctx),/Жетон инструктора/);
  assert.equal(state.attempts.length,0);
});
test('only admin can delete a result; other results, questions and exams stay intact',async()=>{
  const state=await setup();const first=await dispatch(state,'attempt.start',input,ctx);
  const other=await dispatch(state,'attempt.start',input,ctx);
  await dispatch(state,'attempt.finish',{id:first.attempt.id,token:first.token},ctx);
  const collections=JSON.stringify({questions:state.questions,assessments:state.assessments});
  await assert.rejects(dispatch(state,'admin.delete',{collection:'attempts',id:first.attempt.id},ctx),e=>e.status===401);
  await dispatch(state,'admin.delete',{collection:'attempts',id:first.attempt.id},admin);
  assert.deepEqual(state.attempts.map(a=>a.id),[other.attempt.id]);
  assert.equal(JSON.stringify({questions:state.questions,assessments:state.assessments}),collections);
  await assert.rejects(dispatch(state,'attempt.get',{id:first.attempt.id,token:first.token},ctx),e=>e.status===404);
  await dispatch(state,'admin.delete',{collection:'attempts',id:other.attempt.id},admin);
  await assert.rejects(dispatch(state,'attempt.answer',{id:other.attempt.id,token:other.token,index:0,answer:0},ctx),e=>e.status===404);
  assert.equal((await dispatch(state,'admin.data',{},admin)).attempts.length,0);
});

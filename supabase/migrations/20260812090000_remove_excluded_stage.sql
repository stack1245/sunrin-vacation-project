-- 기획에서 제외된 스테이지와 연결된 진행·저장 데이터를 함께 제거한다.
delete from public.stages
where id = 3;

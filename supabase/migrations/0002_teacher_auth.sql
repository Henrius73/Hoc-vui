-- 0002_teacher_auth.sql — gắn quiz_sets & host_keys với auth.uid() cho giáo viên đăng nhập
-- Chạy trong Supabase SQL Editor sau 0001_init.sql.

alter table public.quiz_sets
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.host_keys
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists quiz_sets_user_idx on public.quiz_sets (user_id);
create index if not exists host_keys_user_idx on public.host_keys (user_id);

-- ===== RPC: Gộp dữ liệu localStorage cũ vào tài khoản giáo viên khi đăng nhập =====

create or replace function public.claim_local_teacher_data(
  p_owner text default null,
  p_host text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_quizzes int := 0;
  v_rooms int := 0;
begin
  if v_uid is null then
    raise exception 'Chưa đăng nhập';
  end if;

  if p_owner is not null and length(p_owner) >= 8 then
    update quiz_sets
    set user_id = v_uid
    where owner_token = p_owner and user_id is null;
    get diagnostics v_quizzes = row_count;
  end if;

  if p_host is not null and length(p_host) >= 8 then
    update host_keys
    set user_id = v_uid
    where host_token = p_host and user_id is null;
    get diagnostics v_rooms = row_count;
  end if;

  return jsonb_build_object('quizzes', v_quizzes, 'rooms', v_rooms);
end $$;

-- ===== Cập nhật các RPC giáo viên: ưu tiên auth.uid(), fallback token cho smoke test =====

create or replace function public.save_quiz(
  p_owner text, p_name text, p_questions jsonb, p_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null and (p_owner is null or length(p_owner) < 8) then
    raise exception 'Vui lòng đăng nhập giáo viên';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Thiếu tên bộ câu hỏi';
  end if;
  if p_questions is null or jsonb_array_length(p_questions) = 0 then
    raise exception 'Bộ câu hỏi trống';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_questions) t(q)
    where length(trim(coalesce(q->>'body', ''))) = 0
       or length(trim(coalesce(q->>'a', ''))) = 0
       or length(trim(coalesce(q->>'b', ''))) = 0
       or length(trim(coalesce(q->>'c', ''))) = 0
       or length(trim(coalesce(q->>'d', ''))) = 0
       or coalesce(q->>'correct', '') !~ '^[0-3]$'
       or (coalesce(q->>'seconds', '') <> '' and q->>'seconds' !~ '^\d+$')
  ) then
    raise exception 'Có câu hỏi thiếu nội dung/đáp án, đáp án đúng phải 0–3, thời gian là số giây';
  end if;

  if p_id is null then
    insert into quiz_sets (name, owner_token, user_id)
    values (trim(p_name), coalesce(nullif(p_owner, ''), coalesce(v_uid::text, '')), v_uid)
    returning id into v_id;
  else
    update quiz_sets set name = trim(p_name)
    where id = p_id
      and (
        (v_uid is not null and user_id = v_uid)
        or (v_uid is null and owner_token = p_owner)
      )
    returning id into v_id;
    if v_id is null then
      raise exception 'Không tìm thấy bộ câu hỏi (hoặc thuộc tài khoản khác)';
    end if;
    delete from questions where quiz_set_id = v_id;
  end if;

  insert into questions (quiz_set_id, idx, body, choice_a, choice_b, choice_c, choice_d, correct_idx, seconds)
  select v_id,
         t.ord,
         trim(q->>'body'),
         trim(q->>'a'), trim(q->>'b'), trim(q->>'c'), trim(q->>'d'),
         (q->>'correct')::int,
         least(300, greatest(5, coalesce(nullif(q->>'seconds','')::int, 20)))
  from jsonb_array_elements(p_questions) with ordinality as t(q, ord);

  return v_id;
end $$;

create or replace function public.list_quizzes(p_owner text)
returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id, 'name', s.name, 'created_at', s.created_at,
      'count', coalesce(x.cnt, 0)
    ) order by s.created_at desc
  ), '[]'::jsonb)
  from quiz_sets s
  left join (select quiz_set_id, count(*) cnt from questions group by 1) x
    on x.quiz_set_id = s.id
  where (auth.uid() is not null and s.user_id = auth.uid())
     or (auth.uid() is null and s.owner_token = p_owner);
$$;

create or replace function public.get_quiz(p_owner text, p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  select jsonb_build_object(
    'id', s.id, 'name', s.name,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'body', q.body, 'a', q.choice_a, 'b', q.choice_b, 'c', q.choice_c, 'd', q.choice_d,
        'correct', q.correct_idx, 'seconds', q.seconds
      ) order by q.idx)
      from questions q where q.quiz_set_id = s.id
    ), '[]'::jsonb)
  )
  into v_result
  from quiz_sets s
  where s.id = p_id
    and (
      (v_uid is not null and s.user_id = v_uid)
      or (v_uid is null and s.owner_token = p_owner)
    );

  if v_result is null then
    raise exception 'Không tìm thấy bộ câu hỏi (hoặc thuộc tài khoản khác)';
  end if;
  return v_result;
end $$;

create or replace function public.delete_quiz(p_owner text, p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  delete from quiz_sets
  where id = p_id
    and (
      (v_uid is not null and user_id = v_uid)
      or (v_uid is null and owner_token = p_owner)
    );
  if not found then
    raise exception 'Không tìm thấy bộ câu hỏi (hoặc thuộc tài khoản khác)';
  end if;
exception when foreign_key_violation then
  raise exception 'Bộ câu hỏi này đã có phòng chơi nên không xóa được';
end $$;

create or replace function public.create_room(p_owner text, p_host text, p_quiz uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_id uuid;
begin
  if v_uid is null and (p_host is null or length(p_host) < 8) then
    raise exception 'Vui lòng đăng nhập giáo viên';
  end if;
  if not exists (
    select 1 from quiz_sets
    where id = p_quiz
      and (
        (v_uid is not null and user_id = v_uid)
        or (v_uid is null and owner_token = p_owner)
      )
  ) then
    raise exception 'Không tìm thấy bộ câu hỏi';
  end if;
  if not exists (select 1 from questions where quiz_set_id = p_quiz) then
    raise exception 'Bộ câu hỏi chưa có câu nào';
  end if;
  loop
    v_code := lpad(floor(random() * 1000000)::text, 6, '0');
    exit when not exists (select 1 from rooms where code = v_code);
  end loop;
  insert into rooms (code, quiz_set_id) values (v_code, p_quiz) returning id into v_id;
  insert into host_keys (room_id, host_token, user_id)
  values (v_id, coalesce(nullif(p_host, ''), coalesce(v_uid::text, '')), v_uid);
  return v_code;
end $$;

create or replace function public.host_snapshot(p_host text, p_code text, p_player uuid default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_room rooms%rowtype;
  v_q jsonb;
  v_players jsonb;
  v_mine jsonb;
  v_stats jsonb;
  v_pq jsonb;
  v_total int;
begin
  select r.* into v_room
  from rooms r join host_keys k on k.room_id = r.id
  where r.code = trim(p_code)
    and (
      (v_uid is not null and k.user_id = v_uid)
      or (v_uid is null and k.host_token = p_host)
    );
  if not found then
    raise exception 'Không có quyền điều khiển phòng này';
  end if;
  select count(*) into v_total from questions where quiz_set_id = v_room.quiz_set_id;

  if v_room.phase in ('question', 'reveal') then
    select jsonb_build_object(
      'idx', qq.idx, 'body', qq.body,
      'a', qq.choice_a, 'b', qq.choice_b, 'c', qq.choice_c, 'd', qq.choice_d,
      'correct', qq.correct_idx, 'seconds', qq.seconds, 'started_at', v_room.started_at
    )
    into v_q
    from questions qq
    where qq.quiz_set_id = v_room.quiz_set_id and qq.idx = v_room.q_index;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', p.id, 'name', p.name, 'score', p.total_score,
      'answered', (select count(*) from answers a where a.player_id = p.id and a.room_id = v_room.id),
      'correct', (select count(*) from answers a where a.player_id = p.id and a.room_id = v_room.id and a.is_correct)
    ) order by p.total_score desc, p.created_at
  ), '[]'::jsonb)
  into v_players
  from players p where p.room_id = v_room.id;

  select coalesce(jsonb_agg(
    jsonb_build_object('player', ap.name, 'choice', a.choice, 'correct', a.is_correct, 'points', a.points)
    order by a.answered_at
  ), '[]'::jsonb)
  into v_stats
  from answers a join players ap on ap.id = a.player_id
  where a.room_id = v_room.id and a.q_index = v_room.q_index;

  select coalesce(jsonb_agg(
    jsonb_build_object('idx', qq.idx, 'answered', coalesce(x.cnt, 0), 'correct', coalesce(x.ok, 0))
    order by qq.idx
  ), '[]'::jsonb)
  into v_pq
  from questions qq
  left join (
    select a.q_index, count(*) cnt,
           sum(case when a.is_correct then 1 else 0 end) ok
    from answers a where a.room_id = v_room.id group by a.q_index
  ) x on x.q_index = qq.idx
  where qq.quiz_set_id = v_room.quiz_set_id;

  if p_player is not null then
    select jsonb_build_object(
      'answered', a.player_id is not null,
      'choice', a.choice,
      'is_correct', a.is_correct,
      'points', a.points,
      'my_correct', (select count(*) from answers ax
                     where ax.player_id = p_player and ax.room_id = v_room.id and ax.is_correct)
    )
    into v_mine
    from (select 1) one
    left join answers a on a.player_id = p_player and a.room_id = v_room.id
                       and a.q_index = v_room.q_index;
  end if;

  return jsonb_build_object(
    'room_id', v_room.id, 'code', v_room.code, 'phase', v_room.phase,
    'q_index', v_room.q_index, 'total', v_total,
    'server_now', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'question', v_q, 'players', v_players, 'mine', v_mine,
    'stats', v_stats, 'per_question', v_pq
  );
end $$;

create or replace function public.host_action(
  p_host text, p_code text, p_action text, p_q_index int default null
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_room rooms%rowtype;
  v_total int;
begin
  select r.* into v_room
  from rooms r join host_keys k on k.room_id = r.id
  where r.code = trim(p_code)
    and (
      (v_uid is not null and k.user_id = v_uid)
      or (v_uid is null and k.host_token = p_host)
    );
  if not found then
    raise exception 'Không có quyền điều khiển phòng này';
  end if;
  select count(*) into v_total from questions where quiz_set_id = v_room.quiz_set_id;

  if p_action in ('start', 'next') then
    if p_action = 'start' then
      if p_q_index is null or p_q_index < 1 or p_q_index > v_total then
        raise exception 'Câu hỏi không hợp lệ';
      end if;
      update rooms set phase = 'question', q_index = p_q_index, started_at = now() where id = v_room.id;
    else
      if v_room.q_index >= v_total then
        raise exception 'Đã ở câu cuối cùng';
      end if;
      update rooms set phase = 'question', q_index = v_room.q_index + 1, started_at = now() where id = v_room.id;
    end if;
  elsif p_action = 'reveal' then
    if v_room.phase <> 'question' then
      raise exception 'Không đang ở giữa câu hỏi';
    end if;
    update rooms set phase = 'reveal', started_at = null where id = v_room.id;
  elsif p_action = 'finish' then
    update rooms set phase = 'finished', started_at = null where id = v_room.id;
  else
    raise exception 'Hành động không hợp lệ';
  end if;
  return true;
end $$;

create or replace function public.list_rooms(p_host text)
returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'code', r.code, 'quiz', s.name, 'created_at', r.created_at,
      'phase', r.phase, 'players', coalesce(x.cnt, 0)
    ) order by r.created_at desc
  ), '[]'::jsonb)
  from rooms r
  join host_keys k on k.room_id = r.id
    and (
      (auth.uid() is not null and k.user_id = auth.uid())
      or (auth.uid() is null and k.host_token = p_host)
    )
  join quiz_sets s on s.id = r.quiz_set_id
  left join (select room_id, count(*) cnt from players group by 1) x on x.room_id = r.id;
$$;

grant execute on all functions in schema public to anon, authenticated, service_role;

-- 0001_init.sql — schema + RPC cho web trắc nghiệm kiểu Kahoot
-- Chạy trong Supabase SQL Editor (1 lần duy nhất).

create extension if not exists pgcrypto;

-- ===== Bảng =====

create table if not exists public.quiz_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_token text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_set_id uuid not null references public.quiz_sets(id) on delete cascade,
  idx int not null,
  body text not null,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  correct_idx int not null check (correct_idx between 0 and 3),
  seconds int not null default 20 check (seconds between 5 and 300),
  unique (quiz_set_id, idx)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  quiz_set_id uuid not null references public.quiz_sets(id),
  phase text not null default 'lobby' check (phase in ('lobby','question','reveal','finished')),
  q_index int not null default 1,
  started_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.host_keys (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  host_token text not null
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null,
  total_score int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.answers (
  player_id uuid not null references public.players(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  q_index int not null,
  choice int not null check (choice between 0 and 3),
  is_correct boolean not null,
  points int not null default 0,
  answered_at timestamptz not null default now(),
  primary key (player_id, q_index)
);

create index if not exists questions_set_idx on public.questions (quiz_set_id);
create index if not exists players_room_idx on public.players (room_id);
create index if not exists answers_room_idx on public.answers (room_id);
create index if not exists host_keys_token_idx on public.host_keys (host_token);

-- ===== RLS =====
-- Chỉ rooms/players cho đọc công khai (cần cho realtime signal).
-- Đáp án đúng + answers + bộ câu hỏi chỉ đi qua RPC (security definer).

alter table public.quiz_sets enable row level security;
alter table public.questions enable row level security;
alter table public.rooms enable row level security;
alter table public.host_keys enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;

drop policy if exists "rooms readable" on public.rooms;
create policy "rooms readable" on public.rooms for select using (true);

drop policy if exists "players readable" on public.players;
create policy "players readable" on public.players for select using (true);

-- realtime signal: pha phòng thay đổi + học sinh vào phòng
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms') then
    alter publication supabase_realtime add table public.rooms;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'players') then
    alter publication supabase_realtime add table public.players;
  end if;
end $$;

-- ===== RPC: bộ câu hỏi =====

create or replace function public.save_quiz(
  p_owner text, p_name text, p_questions jsonb, p_id uuid default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if p_owner is null or length(p_owner) < 8 then
    raise exception 'Token chủ sở hữu không hợp lệ';
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
    insert into quiz_sets (name, owner_token) values (trim(p_name), p_owner)
    returning id into v_id;
  else
    update quiz_sets set name = trim(p_name) where id = p_id and owner_token = p_owner
    returning id into v_id;
    if v_id is null then
      raise exception 'Không tìm thấy bộ câu hỏi (hoặc thuộc máy khác)';
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
  where s.owner_token = p_owner;
$$;

create or replace function public.get_quiz(p_owner text, p_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
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
  where s.id = p_id and s.owner_token = p_owner;

  if v_result is null then
    raise exception 'Không tìm thấy bộ câu hỏi (hoặc thuộc máy khác)';
  end if;
  return v_result;
end $$;

create or replace function public.delete_quiz(p_owner text, p_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from quiz_sets where id = p_id and owner_token = p_owner;
  if not found then
    raise exception 'Không tìm thấy bộ câu hỏi (hoặc thuộc máy khác)';
  end if;
exception when foreign_key_violation then
  raise exception 'Bộ câu hỏi này đã có phòng chơi nên không xóa được';
end $$;

-- ===== RPC: phòng chơi =====

create or replace function public.create_room(p_owner text, p_host text, p_quiz uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_id uuid;
begin
  if p_host is null or length(p_host) < 8 then
    raise exception 'Token chủ phòng không hợp lệ';
  end if;
  if not exists (select 1 from quiz_sets where id = p_quiz and owner_token = p_owner) then
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
  insert into host_keys (room_id, host_token) values (v_id, p_host);
  return v_code;
end $$;

create or replace function public.join_room(p_code text, p_name text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_room rooms%rowtype;
  v_base text;
  v_name text;
  v_n int := 2;
  v_id uuid;
begin
  select * into v_room from rooms where code = trim(p_code);
  if not found then
    raise exception 'Mã phòng không tồn tại';
  end if;
  if v_room.phase = 'finished' then
    raise exception 'Ván này đã kết thúc';
  end if;
  v_base := trim(p_name);
  if length(v_base) = 0 or length(v_base) > 20 then
    raise exception 'Tên phải có 1–20 ký tự';
  end if;
  v_name := v_base;
  while exists (select 1 from players where room_id = v_room.id and name = v_name) loop
    if v_n > 50 then
      raise exception 'Tên này đã được dùng quá nhiều lần';
    end if;
    v_name := v_base || ' (' || v_n || ')';
    v_n := v_n + 1;
  end loop;
  insert into players (room_id, name) values (v_room.id, v_name) returning id into v_id;
  return v_id;
end $$;

-- Trạng thái phòng cho học sinh (không lộ đáp án đúng khi chưa công bố).
create or replace function public.get_room_state(p_code text, p_player uuid default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_room rooms%rowtype;
  v_q jsonb;
  v_players jsonb;
  v_mine jsonb;
  v_total int;
begin
  select * into v_room from rooms where code = trim(p_code);
  if not found then
    raise exception 'Mã phòng không tồn tại';
  end if;
  select count(*) into v_total from questions where quiz_set_id = v_room.quiz_set_id;

  if v_room.phase in ('question', 'reveal') then
    select jsonb_build_object(
      'idx', qq.idx, 'body', qq.body,
      'a', qq.choice_a, 'b', qq.choice_b, 'c', qq.choice_c, 'd', qq.choice_d,
      'correct', case when v_room.phase = 'reveal' then qq.correct_idx else null end,
      'seconds', qq.seconds, 'started_at', v_room.started_at
    )
    into v_q
    from questions qq
    where qq.quiz_set_id = v_room.quiz_set_id and qq.idx = v_room.q_index;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object('id', p.id, 'name', p.name, 'score', p.total_score)
    order by p.total_score desc, p.created_at
  ), '[]'::jsonb)
  into v_players
  from players p where p.room_id = v_room.id;

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
    'question', v_q, 'players', v_players, 'mine', v_mine
  );
end $$;

-- Toàn bộ trạng thái cho giáo viên (có đáp án, thống kê theo câu).
create or replace function public.host_snapshot(p_host text, p_code text, p_player uuid default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
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
  where r.code = trim(p_code) and k.host_token = p_host;
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
  v_room rooms%rowtype;
  v_total int;
begin
  select r.* into v_room
  from rooms r join host_keys k on k.room_id = r.id
  where r.code = trim(p_code) and k.host_token = p_host;
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

-- Trả lời: 1 đáp án/câu, chặn muộn theo đồng hồ server, đúng được 1000 điểm.
create or replace function public.submit_answer(
  p_code text, p_player uuid, p_q_index int, p_choice int
)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_room rooms%rowtype;
  v_q questions%rowtype;
  v_ok boolean;
  v_points int;
begin
  select * into v_room from rooms where code = trim(p_code);
  if not found then
    raise exception 'Mã phòng không tồn tại';
  end if;
  -- shortcut: sai pha/sai câu trả về false im lặng (hết giờ hoặc host đã sang câu)
  if v_room.phase <> 'question' or v_room.q_index <> p_q_index or v_room.started_at is null then
    return false;
  end if;
  if not exists (select 1 from players where id = p_player and room_id = v_room.id) then
    raise exception 'Người chơi không hợp lệ';
  end if;
  if p_choice not between 0 and 3 then
    raise exception 'Lựa chọn không hợp lệ';
  end if;

  select * into v_q from questions
  where quiz_set_id = v_room.quiz_set_id and idx = p_q_index;
  if not found then
    return false;
  end if;
  if now() > v_room.started_at + make_interval(secs => v_q.seconds) then
    return false; -- hết giờ (đồng hồ server)
  end if;

  v_ok := (p_choice = v_q.correct_idx);
  v_points := case when v_ok then 1000 else 0 end;

  insert into answers (player_id, room_id, q_index, choice, is_correct, points)
  values (p_player, v_room.id, p_q_index, p_choice, v_ok, v_points)
  on conflict (player_id, q_index) do nothing;
  if not found then
    return false; -- đã trả lời rồi
  end if;

  update players set total_score = total_score + v_points where id = p_player;
  return v_ok;
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
  join host_keys k on k.room_id = r.id and k.host_token = p_host
  join quiz_sets s on s.id = r.quiz_set_id
  left join (select room_id, count(*) cnt from players group by 1) x on x.room_id = r.id;
$$;

grant execute on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

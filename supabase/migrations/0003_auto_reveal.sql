-- 0003_auto_reveal.sql — Chế độ tự động công bố đáp án khi hết giờ
-- Chạy trong Supabase SQL Editor sau 0002_teacher_auth.sql.

alter table public.rooms
  add column if not exists auto_reveal boolean not null default false;

create or replace function public.create_room(
  p_owner text,
  p_host text,
  p_quiz uuid,
  p_auto_reveal boolean default false
) returns text
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
  insert into rooms (code, quiz_set_id, auto_reveal)
  values (v_code, p_quiz, coalesce(p_auto_reveal, false))
  returning id into v_id;
  insert into host_keys (room_id, host_token, user_id)
  values (v_id, coalesce(nullif(p_host, ''), coalesce(v_uid::text, '')), v_uid);
  return v_code;
end $$;

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

  if v_room.phase = 'question' and v_room.auto_reveal and v_room.started_at is not null then
    if exists (
      select 1 from questions qq
      where qq.quiz_set_id = v_room.quiz_set_id
        and qq.idx = v_room.q_index
        and now() > v_room.started_at + make_interval(secs => qq.seconds)
    ) then
      update rooms
      set phase = 'reveal', started_at = null
      where id = v_room.id and phase = 'question';
      select * into v_room from rooms where id = v_room.id;
    end if;
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
    'auto_reveal', v_room.auto_reveal,
    'q_index', v_room.q_index, 'total', v_total,
    'server_now', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'question', v_q, 'players', v_players, 'mine', v_mine
  );
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

  if v_room.phase = 'question' and v_room.auto_reveal and v_room.started_at is not null then
    if exists (
      select 1 from questions qq
      where qq.quiz_set_id = v_room.quiz_set_id
        and qq.idx = v_room.q_index
        and now() > v_room.started_at + make_interval(secs => qq.seconds)
    ) then
      update rooms
      set phase = 'reveal', started_at = null
      where id = v_room.id and phase = 'question';
      select * into v_room from rooms where id = v_room.id;
    end if;
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
    'auto_reveal', v_room.auto_reveal,
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
    if v_room.phase = 'reveal' then
      return true;
    end if;
    if v_room.phase <> 'question' then
      raise exception 'Không đang ở giữa câu hỏi';
    end if;
    update rooms set phase = 'reveal', started_at = null where id = v_room.id;
  elsif p_action = 'toggle_auto_reveal' then
    update rooms set auto_reveal = not auto_reveal where id = v_room.id;
  elsif p_action = 'finish' then
    update rooms set phase = 'finished', started_at = null where id = v_room.id;
  else
    raise exception 'Hành động không hợp lệ';
  end if;
  return true;
end $$;

grant execute on all functions in schema public to anon, authenticated, service_role;

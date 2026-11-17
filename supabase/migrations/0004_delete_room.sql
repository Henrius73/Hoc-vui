-- 0004_delete_room.sql — xóa lịch sử phòng chơi (kèm players/answers nhờ ON DELETE CASCADE)
-- Chạy sau 0003_auto_reveal.sql.

create or replace function public.delete_room(p_host text, p_code text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_room_id uuid;
begin
  if (p_host is null or length(p_host) < 8) and v_uid is null then
    raise exception 'Không có quyền xóa phòng này';
  end if;

  select r.id into v_room_id
  from rooms r
  join host_keys k on k.room_id = r.id
  where r.code = trim(p_code)
    and (
      (p_host is not null and length(p_host) >= 8 and k.host_token = p_host)
      or (v_uid is not null and k.user_id = v_uid)
    )
  limit 1;

  if v_room_id is null then
    raise exception 'Không tìm thấy phòng hoặc bạn không có quyền xóa';
  end if;

  delete from rooms where id = v_room_id;
end $$;

grant execute on function public.delete_room(text, text) to anon, authenticated, service_role;

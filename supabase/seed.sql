-- seed.sql — Tạo sẵn 3 tài khoản giáo viên (đã xác nhận email) + 2 bộ câu hỏi mẫu
-- Chạy trong Supabase SQL Editor SAU KHI đã chạy 0001_init.sql và 0002_teacher_auth.sql.
-- Mật khẩu mặc định cho tất cả tài khoản seed: 123456

-- pgcrypto trên Supabase nằm ở schema `extensions` (không có trong search_path mặc định).
set search_path = public, extensions;

do $$
declare
  v_teachers text[] := array[
    'giaovien1@hocvui.vn',
    'giaovien2@hocvui.vn',
    'admin@hocvui.vn'
  ];
  v_email text;
  v_uid uuid;
  v_gv1_id uuid;
  v_quiz_id uuid;
begin
  foreach v_email in array v_teachers loop
    select id into v_uid from auth.users where email = v_email;

    if v_uid is null then
      v_uid := gen_random_uuid();

      insert into auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000',
        v_uid,
        'authenticated',
        'authenticated',
        v_email,
        crypt('123456', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );

      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) values (
        gen_random_uuid(),
        v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
        'email',
        v_uid::text,
        now(),
        now(),
        now()
      );
    end if;

    if v_email = 'giaovien1@hocvui.vn' then
      v_gv1_id := v_uid;
    end if;
  end loop;

  -- Seed 1 bộ câu hỏi mẫu cho giaovien1@hocvui.vn nếu chưa có bộ nào
  if v_gv1_id is not null and not exists (select 1 from public.quiz_sets where user_id = v_gv1_id) then
    insert into public.quiz_sets (name, owner_token, user_id)
    values ('Kiến thức chung (Mẫu)', v_gv1_id::text, v_gv1_id)
    returning id into v_quiz_id;

    insert into public.questions (quiz_set_id, idx, body, choice_a, choice_b, choice_c, choice_d, correct_idx, seconds)
    values
      (v_quiz_id, 1, 'Thủ đô của Việt Nam là thành phố nào?', 'Hà Nội', 'Đà Nẵng', 'Huế', 'TP. Hồ Chí Minh', 0, 20),
      (v_quiz_id, 2, 'Hành tinh nào gần Mặt Trời nhất?', 'Trái Đất', 'Sao Kim', 'Sao Thủy', 'Sao Hỏa', 2, 20),
      (v_quiz_id, 3, '5 + 7 x 2 = ?', '24', '19', '17', '21', 1, 15),
      (v_quiz_id, 4, 'Đại dương nào lớn nhất trên Trái Đất?', 'Đại Tây Dương', 'Ấn Độ Dương', 'Bắc Băng Dương', 'Thái Bình Dương', 3, 20),
      (v_quiz_id, 5, 'Nước sôi ở nhiệt độ bao nhiêu (áp suất tiêu chuẩn)?', '90°C', '100°C', '80°C', '120°C', 1, 15);
  end if;
end $$;

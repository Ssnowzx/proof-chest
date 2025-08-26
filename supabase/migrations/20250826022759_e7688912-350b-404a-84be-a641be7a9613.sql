-- Corrigir função is_admin para funcionar corretamente com auth.uid()
DROP FUNCTION IF EXISTS public.is_admin(UUID);

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Se não há usuário autenticado, retornar false
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se o usuário é admin
  RETURN EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = user_id AND u.is_admin = true
  );
END;
$$;

-- Recriar políticas RLS para avisos usando função corrigida
DROP POLICY IF EXISTS "avisos_select_all" ON public.avisos;
DROP POLICY IF EXISTS "avisos_insert_admin" ON public.avisos;
DROP POLICY IF EXISTS "avisos_update_admin" ON public.avisos;
DROP POLICY IF EXISTS "avisos_delete_admin" ON public.avisos;

-- Políticas RLS para avisos
CREATE POLICY "avisos_select_all" ON public.avisos
  FOR SELECT USING (true);

CREATE POLICY "avisos_insert_admin" ON public.avisos
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "avisos_update_admin" ON public.avisos
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "avisos_delete_admin" ON public.avisos
  FOR DELETE USING (public.is_admin());

-- Garantir que o usuário admin existe
INSERT INTO public.users (id, username, password, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin',
  '$2b$10$rOvHDzNiS9/1R8x8MkK7.OzN5zrP1NXv6zJ8cJ2M1lF5vP9Q4dN2K',
  true
) ON CONFLICT (username) DO UPDATE SET is_admin = true;

-- Criar usuário no auth.users para o admin se não existir
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'authenticated',
  'authenticated',
  '00000000-0000-0000-0000-000000000001@proofchest.local',
  crypt('00000000-0000-0000-0000-000000000001', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;
-- Primeiro, vamos verificar e corrigir as políticas RLS para avisos
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "avisos_select_public" ON public.avisos;
DROP POLICY IF EXISTS "avisos_insert_admin_only" ON public.avisos;
DROP POLICY IF EXISTS "avisos_update_admin_only" ON public.avisos;
DROP POLICY IF EXISTS "avisos_delete_admin_only" ON public.avisos;

-- Criar uma função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = user_id AND u.is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Criar políticas RLS simplificadas para avisos
CREATE POLICY "avisos_select_all" ON public.avisos
  FOR SELECT USING (true);

CREATE POLICY "avisos_insert_admin" ON public.avisos
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "avisos_update_admin" ON public.avisos
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "avisos_delete_admin" ON public.avisos
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Verificar se a tabela de usuários tem o usuário admin
UPDATE public.users 
SET is_admin = true 
WHERE username = 'admin';

-- Se não existir, criar usuário admin
INSERT INTO public.users (id, username, password, is_admin)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin',
  '$2b$10$rOvHDzNiS9/1R8x8MkK7.OzN5zrP1NXv6zJ8cJ2M1lF5vP9Q4dN2K',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE username = 'admin'
);

-- Limpar políticas de storage e recriar
DROP POLICY IF EXISTS "Admin can upload aviso images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view aviso images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update aviso images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete aviso images" ON storage.objects;

-- Políticas de storage mais simples
CREATE POLICY "aviso_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avisos');

CREATE POLICY "aviso_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avisos' AND 
    public.is_admin(auth.uid())
  );

CREATE POLICY "aviso_images_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avisos' AND 
    public.is_admin(auth.uid())
  );

CREATE POLICY "aviso_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avisos' AND 
    public.is_admin(auth.uid())
  );
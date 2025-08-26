-- Adicionar campo de imagem para avisos
ALTER TABLE public.avisos ADD COLUMN image_url TEXT;

-- Adicionar campos extras para documents
ALTER TABLE public.documents ADD COLUMN evento TEXT;
ALTER TABLE public.documents ADD COLUMN horas INTEGER;
ALTER TABLE public.documents ADD COLUMN observacao TEXT;

-- Verificar e limpar políticas duplicadas para avisos
DROP POLICY IF EXISTS "Anyone can view avisos" ON public.avisos;
DROP POLICY IF EXISTS "Only admins can insert avisos" ON public.avisos;
DROP POLICY IF EXISTS "Only admins can update avisos" ON public.avisos;
DROP POLICY IF EXISTS "Only admins can delete avisos" ON public.avisos;
DROP POLICY IF EXISTS "Avisos: admins manage" ON public.avisos;
DROP POLICY IF EXISTS "Avisos: public select" ON public.avisos;
DROP POLICY IF EXISTS "avisos_insert_admin_only" ON public.avisos;
DROP POLICY IF EXISTS "avisos_select_public" ON public.avisos;
DROP POLICY IF EXISTS "avisos_update_admin_only" ON public.avisos;
DROP POLICY IF EXISTS "avisos_delete_admin_only" ON public.avisos;

-- Criar políticas RLS corretas para avisos
CREATE POLICY "avisos_select_public" ON public.avisos
  FOR SELECT USING (true);

CREATE POLICY "avisos_insert_admin_only" ON public.avisos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

CREATE POLICY "avisos_update_admin_only" ON public.avisos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

CREATE POLICY "avisos_delete_admin_only" ON public.avisos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

-- Criar bucket para imagens de avisos se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avisos', 'avisos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para imagens de avisos (apenas admins)
CREATE POLICY "Admin can upload aviso images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avisos' AND 
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

CREATE POLICY "Admin can view aviso images" ON storage.objects
  FOR SELECT USING (bucket_id = 'avisos');

CREATE POLICY "Admin can update aviso images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avisos' AND 
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );

CREATE POLICY "Admin can delete aviso images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avisos' AND 
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
  );
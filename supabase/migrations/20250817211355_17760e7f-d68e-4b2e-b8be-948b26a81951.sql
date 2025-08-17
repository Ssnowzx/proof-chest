-- Criar tabela de usuários personalizada
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de documentos
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('APC', 'ACE', 'RECIBO')) NOT NULL,
  image_url TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de avisos
CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de controle de horas
CREATE TABLE public.hours_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('APC', 'ACE')) NOT NULL,
  hours INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hours_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários (apenas visualizar próprio perfil)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (id = auth.uid()::uuid);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid()::uuid);

-- Políticas RLS para documentos (apenas próprios documentos)
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (user_id = auth.uid()::uuid);

-- Políticas RLS para avisos (todos podem ver, apenas admin pode gerenciar)
CREATE POLICY "Anyone can view avisos" ON public.avisos
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert avisos" ON public.avisos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND is_admin = true)
  );

CREATE POLICY "Only admins can update avisos" ON public.avisos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND is_admin = true)
  );

CREATE POLICY "Only admins can delete avisos" ON public.avisos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND is_admin = true)
  );

-- Políticas RLS para hours_log (apenas próprios logs)
CREATE POLICY "Users can view own hours" ON public.hours_log
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own hours" ON public.hours_log
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- Criar bucket para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Políticas de storage para documentos
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Inserir usuário admin padrão (password: admin123)
INSERT INTO public.users (username, password, is_admin) 
VALUES ('admin', '$2b$10$rOvHDzNiS9/1R8x8MkK7.OzN5zrP1NXv6zJ8cJ2M1lF5vP9Q4dN2K', true);

-- Inserir alguns avisos de exemplo
INSERT INTO public.avisos (title, description) VALUES 
('Bem-vindos ao ProofChest', 'Sistema para gerenciar seus comprovantes e documentos acadêmicos.'),
('Datas Importantes', 'Lembrete: Prazo para entrega de APC é dia 30 de cada mês.'),
('Como usar o sistema', 'Use a opção ADICIONAR IMG para fazer upload dos seus comprovantes e o sistema extrairá o texto automaticamente.');
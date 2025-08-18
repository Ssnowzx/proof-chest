# Proof Chest

Resumo curto

- App React + Supabase para upload/gestão de documentos.
- Removidas menções ao Lovable e adicionados fallbacks DEV para login/upload.

Status atual (onde paramos)

- Issue bloqueadora: signUp cria conta no Auth, mas INSERT na tabela `users` falha com erro RLS: `42501 new row violates row-level security policy for table "users"` e às vezes 401 no endpoint REST.
- Causa provável: INSERT está a ser feita sem sessão válida ou as policies RLS não permitem inserir (a tabela `users.id` é do tipo UUID; policies devem usar `auth.uid()::uuid`).
- Código relevante: `src/contexts/AuthContext.tsx` (função `signUp`) — já implementa tentativas para obter `authUserId` (getSession / signInWithPassword / onAuthStateChange wait), mas o INSERT continua a ser bloqueado enquanto não existir sessão ou se policy estiver incorreta.

Como rodar localmente

1. Instalar e rodar:
   - npm install
   - npm run dev
2. Frontend usa a key anon/public do Supabase (ver `src/integrations/supabase/client.ts`).
3. Em modo DEV existem fallbacks:
   - login: admin/admin e admin/admin123 criam `dev_user` em localStorage (mantém permissões locais)
   - signUp/upload em DEV podem gravar em localStorage

SQL a aplicar no Supabase (IMPORTANTE: sua coluna `users.id` é UUID)
Cole e execute no SQL editor do Supabase — estas policies habilitam RLS e permitem que o usuário autenticado insira a própria linha (id = auth.uid()::uuid):

-- Habilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- INSERT: apenas quando id = auth.uid()::uuid
CREATE POLICY users_insert_own
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::uuid = id);

-- SELECT: dono ou admin
CREATE POLICY users_select_own_or_admin
ON public.users
FOR SELECT
TO authenticated
USING (
auth.uid()::uuid = id
OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.is_admin = TRUE)
);

-- UPDATE: dono ou admin
CREATE POLICY users_update_own_or_admin
ON public.users
FOR UPDATE
TO authenticated
USING (
auth.uid()::uuid = id
OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.is_admin = TRUE)
)
WITH CHECK (
auth.uid()::uuid = id
OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.is_admin = TRUE)
);

-- DELETE: admin apenas
CREATE POLICY users_delete_admin_only
ON public.users
FOR DELETE
TO authenticated
USING (
EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.is_admin = TRUE)
);

Políticas para `documents` (assumindo owner UUID)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_insert_owner
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (owner = auth.uid()::uuid);

CREATE POLICY documents_select_owner_or_admin
ON public.documents
FOR SELECT
TO authenticated
USING (
owner = auth.uid()::uuid
OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.is_admin = TRUE)
);

CREATE POLICY documents_update_owner_or_admin
ON public.documents
FOR UPDATE
TO authenticated
USING (
owner = auth.uid()::uuid
OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.is_admin = TRUE)
)
WITH CHECK (
owner = auth.uid()::uuid
OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.is_admin = TRUE)
);

CREATE POLICY documents_delete_owner_or_admin
ON public.documents
FOR DELETE
TO authenticated
USING (
owner = auth.uid()::uuid
OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid()::uuid AND u.is_admin = TRUE)
);

Debug / passos para verificar no cliente

1. Antes de chamar `supabase.from('users').insert(...)` adicione logs em `src/contexts/AuthContext.tsx`:
   - console.log('session before insert', await supabase.auth.getSession());
   - console.log('authUserId to insert', authUserId);
     Confirme que `session.data.session.user.id` (ou `session.user.id`) === `authUserId`.
2. Se o id estiver `null` ou não bater, a inserção será bloqueada. O código já aguarda onAuthStateChange por até 20s — verifique se esse fluxo obtém o id.
3. Se quiser testar rápido sem RLS (somente DEBUG), rode:
   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
   (reabilite depois!)

Notas importantes

- Não use a service_role key no frontend.
- Se o fluxo de signUp requer confirmação de e-mail, o Supabase pode não criar uma sessão imediatamente; então o cliente não terá auth.uid() e o INSERT será bloqueado por RLS. Soluções:
  - exigir confirmação e criar a linha `users` manualmente via função server-side (service role) quando apropriado; ou
  - permitir INSERT na tabela `users` para o fluxo de signUp AUTENTICADO com a policy acima e garantir que o cliente tenha sessão.
- Em DEV as ids geradas pelo fallback (ex.: `dev-...`) não são UUID e irão falhar se a coluna for UUID. Use apenas para testes locais desligando policies ou adaptando a coluna para text.

Próximos passos sugeridos (curto prazo)

- Aplique as policies acima (versão UUID) no SQL editor do Supabase.
- Adicione logs no cliente (passo Debug acima) e tente novo signUp para confirmar sessão e id presentes antes do INSERT.
- Opcional: gerar `supabase-policies.sql` no repositório e commitar.

Onde paramos localmente

- Arquivo a editar para debug/ajustes: `src/contexts/AuthContext.tsx` (linha `signUp`).
- SQL a aplicar no Supabase: as queries acima (UUID).

Se quiser eu:

- crio o arquivo `supabase-policies.sql` no repositório com estas queries; ou
- insiro os logs/um pequeno retry no `AuthContext.tsx` e testo localmente.

-- fim

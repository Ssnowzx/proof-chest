# ProofChest — Local Development Guide & Change Log

Este README descreve como rodar o projeto localmente e resume as mudanças feitas para facilitar desenvolvimento sem um backend Supabase totalmente configurado.

## Resumo das alterações (feitas neste branch/workspace)

- Removidas referências ao pacote e marca "Lovable" e dependências associadas.
- Login:
  - Adicionado fallback de desenvolvimento (DEV): credenciais rápidas `admin`/`admin` e `admin`/`admin123` criam um usuário `dev-admin` com permissões de administrador.
  - Persistência do usuário DEV em `localStorage` (chave `dev_user`) para manter permissões após atualizar a página.
  - Implementado método `signUp` no `AuthContext` para criar contas. Em ambiente DEV, se a inserção no Supabase falhar, o usuário é persistido localmente.
- Upload de documentos:
  - Fallback DEV: quando o `user.id` começa com `dev`, os uploads salvam os documentos em `localStorage` (`dev_documents`) como alternativa ao Supabase Storage/table.
  - UI simplificada para seleção de arquivo (caixa grande removida). Mantém preview, extração de OCR e remoção.
  - `DocumentsPage` adaptada para ler/excluir documentos do `localStorage` em modo DEV, evitar erros de UUID inválido e exibir imagens data-URL.
  - Adicionado botão "Adicionar Documento" no cabeçalho para usuários (não-admin) quando já existirem documentos.
- Melhorias gerais:
  - Logs de debug e tratamento de erros mais informativo para upload/login.
  - Correções TypeScript/sonner (uso correto de toasts).

## Arquivos principais modificados

- `src/contexts/AuthContext.tsx` — persistência DEV, `login`, `signUp`, `logout` aprimorados
- `src/pages/Login.tsx` — UI para alternar entre Login e Criar Conta
- `src/pages/UploadPage.tsx` — fallback DEV para salvar documentos em `localStorage`, UI de seleção de arquivo
- `src/pages/DocumentsPage.tsx` — fallback DEV para listar/excluir documentos, aceitar data URLs, botão "Adicionar Documento"
- `README.md`, `vite.config.ts`, `package.json`, `index.html` — remoções/limpezas relacionadas a Lovable (já aplicadas)

## Como rodar localmente (passo a passo)

Requisitos: Node.js + npm

1. Clone o repositório:

```sh
git clone https://github.com/Ssnowzx/proof-chest
cd proof-chest
```

2. Instale dependências:

```sh
npm install
```

3. Rode em modo desenvolvimento:

```sh
npm run dev
```

4. Variáveis de ambiente (opcional):

- Para integrar com Supabase, crie um `.env` com as chaves esperadas (ver `src/integrations/supabase/client.ts`).

## Como testar os fallbacks e funcionalidades introduzidas

- Login Dev (mantém admin após reload):

  - Use `admin` / `admin` ou `admin` / `admin123` na tela de login. Isso seta `dev_user` em `localStorage` e mantém o usuário logado com permissões de admin após atualizar a página.

- Criar conta (Sign Up):

  - Na tela de login clique em "Não tem conta? Criar conta" e preencha usuário/senha. Em ambiente DEV, se o Supabase não estiver disponível, a conta será criada localmente e persistida em `localStorage`.

- Upload e visualização de documentos em DEV:

  - Faça login como `dev-admin` ou como usuário criado.
  - Vá para Upload → selecione imagem → Salvar Documento.
  - Em DEV os documentos serão salvos em `localStorage` na chave `dev_documents`. A página de documentos (`/documents/:category`) mostra imagens e texto extraído.

- Excluir documentos em DEV:
  - Use o ícone de lixeira em cada cartão; isso remove o item de `localStorage` e da UI.

## Observações sobre Supabase e produção

- Em produção (quando `import.meta.env.DEV` não estiver ativo) o app espera que:
  - A tabela `users` e a tabela `documents` existam no Supabase.
  - Políticas RLS estejam configuradas para permitir os inserts/selects/ deletes conforme seu modelo (o projeto já identifica erros comuns: RLS, 400/406 etc.).

Se precisar, posso gerar exemplos SQL de policies RLS mínimas para permitir leitura/escrita por proprietários e leitura para admins.

## Commit e push remotos

Este workspace aplica os commits localmente. Se desejar que eu faça push para `https://github.com/Ssnowzx/proof-chest`, eu irei tentar empurrar os commits para o repositório remoto (pode exigir que você tenha permissões e credenciais configuradas no ambiente local).

---

Se quiser que eu também gere as instruções SQL para o Supabase (users/documents table + policies RLS) ou adicione uma tela para gerenciar `dev_documents`, diga qual prefere que eu faça a seguir.

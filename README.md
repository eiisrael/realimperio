# Real Império FC — aplicativo web

Aplicativo web responsivo do **Real Império FC**, de Indianópolis, Caruaru-PE.

## O que já funciona localmente

- Página inicial com identidade visual do time.
- Agenda pública de jogos e treinos.
- Informações do clube.
- Elenco público com foto, posição, número e descrição.
- Galeria **Extras** com fotos recentes.
- Notícias do time.
- Cadastro de jogador com nome, e-mail e senha.
- Solicitações de cadastro com fluxo de **aceitar / negar**.
- Login de administrador e de jogador.
- Painel administrativo responsivo com CRUD de:
  - jogadores;
  - jogos e treinos;
  - notícias;
  - fotos da galeria;
  - informações do time.
- Dados persistidos no navegador com `localStorage` durante a fase local.
- Sessão mantida somente na aba/janela atual com `sessionStorage`.

## Rodar localmente

Por segurança e compatibilidade com APIs do navegador, abra por um servidor HTTP local em vez de clicar diretamente no `index.html`.

### Python

```bash
python -m http.server 5500
```

Depois acesse `http://localhost:5500`.

### VS Code

Também funciona com a extensão **Live Server**.

## Administração no protótipo

Existem dois níveis administrativos definidos para a fase local:

- administrador geral: exibido publicamente na aba de informações do time;
- administrador total: não é exibido em nenhuma área pública.

As credenciais não ficam gravadas em texto puro no `localStorage`. O protótipo compara hashes SHA-256 no navegador. Isso **não substitui autenticação de backend**.

> Antes de publicar para usuários reais, migrar a autenticação para o Supabase Auth e trocar as senhas usadas no protótipo.

## Preparação para Vercel + Supabase

A interface é estática e já pode ser hospedada na Vercel. Para a próxima etapa, o arquivo `supabase-schema.sql` contém uma base de tabelas e políticas para migrarmos o armazenamento local para:

- Supabase Auth para login;
- PostgreSQL para jogadores, agenda, notícias e dados do time;
- Supabase Storage para fotos;
- Row Level Security (RLS) para separar acesso público, jogador e administrador.

## Estrutura

```text
realimperio/
├─ assets/
│  └─ logo-real-imperio.png
├─ app.js
├─ index.html
├─ manifest.json
├─ styles.css
├─ supabase-schema.sql
└─ vercel.json
```

## Observação sobre fotos no modo local

Imagens enviadas pelo painel são comprimidas no navegador e salvas em `localStorage`. Navegadores possuem limite de armazenamento; para muitas fotos, use URLs durante o protótipo. Na versão Supabase, as imagens serão armazenadas no Storage.

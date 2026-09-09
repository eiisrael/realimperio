# Real Império FC — aplicativo web

Aplicativo web responsivo do **Real Império FC**, de Indianópolis, Caruaru-PE.

## O que já funciona localmente

- Página inicial com identidade visual do time.
- Resumo do elenco e próximos eventos posicionado acima do destaque principal.
- Notícias e próximos compromissos lado a lado na página inicial.
- Notícias clicáveis, abertas em uma janela modal com botão de fechar.
- Agenda pública de jogos e treinos.
- Informações do clube.
- Elenco público com foto, posição, número, descrição e saldo de gols.
- Aba pública **Escalação** com mini campo profissional, informações do atleta e formação definida pela administração.
- Cadastro de jogador com aprovação ou recusa pela administração.
- Login de administrador e de jogador.
- Área **Minha Conta** do jogador com edição de:
  - foto;
  - nome;
  - e-mail;
  - número da camisa;
  - posição;
  - WhatsApp;
  - descrição;
  - senha.
- O saldo de gols e o status continuam controlados pela administração.
- Painel administrativo responsivo com gestão de:
  - jogadores, incluindo foto, dados, gols e senha;
  - jogos e treinos;
  - notícias;
  - informações do time.
- Editor visual da **Escalação** no painel administrativo:
  - escolha entre diversas formações clássicas e modernas;
  - modo **Livre / Personalizada**;
  - seleção de jogador e clique na posição para escalar ou substituir;
  - arrastar e soltar jogadores para qualquer ponto do campo;
  - restauração das posições originais da formação;
  - remoção individual ou limpeza completa da escalação.
- Área **Extras** removida da navegação pública e do painel administrativo.
- Interface sem emojis para manter aparência mais profissional.
- Rodapé mantido no fim da página, inclusive em telas com pouco conteúdo.
- Dados persistidos no navegador com `localStorage` durante a fase local.
- Sessão mantida somente na aba/janela atual com `sessionStorage`.

## Rodar localmente

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

A interface é estática e já pode ser hospedada na Vercel. O arquivo `supabase-schema.sql` contém a base para migrarmos para:

- Supabase Auth para login e alteração segura de senha;
- PostgreSQL para jogadores, saldo de gols, escalação, agenda, notícias e dados do time;
- Supabase Storage para fotos dos jogadores;
- Row Level Security (RLS) para separar acesso público, jogador e administrador.

## Estrutura

```text
realimperio/
├─ assets/
│  └─ logo-real-imperio.svg
├─ js/
│  ├─ admin.js
│  ├─ lineup.js
│  ├─ render.js
│  └─ state.js
├─ app.js
├─ index.html
├─ lineup.css
├─ professional.css
├─ professional.js
├─ manifest.json
├─ setup-local.html
├─ styles.css
├─ supabase-schema.sql
└─ vercel.json
```

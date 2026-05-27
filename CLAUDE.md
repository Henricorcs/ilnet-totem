# ILNET Totem — Instruções para Claude Code

Este arquivo contém tudo que você precisa para fazer o deploy completo deste projeto no servidor do cliente. Leia até o fim antes de começar.

---

## Visão geral do projeto

Três serviços que rodam em Docker:

- **backend** — API Node.js (Express + PostgreSQL). Proxy para o IXC, sorteio, leads.
- **totem** — React SPA servida por nginx. Roda no tablet do evento.
- **admin** — React SPA servida por nginx. Painel de controle para os organizadores.

Subdomínios:
- `totem.ilnet.com.br` → totem
- `admin.totem.ilnet.com.br` → admin
- `api.totem.ilnet.com.br` → backend

---

## O que você precisa do usuário antes de começar

Pergunte ao usuário (uma coisa de cada vez, não tudo junto):

1. **Senha do IXC** — credencial do usuário `91` no sistema `saomateus.cas.net.br`
2. **Acesso ao servidor** — IP do servidor, usuário SSH e senha (ou chave)
3. **Se o EasyPanel já está instalado** — se não, você vai instalar

---

## Checklist de deploy — execute nesta ordem

### Passo 1 — Verificar pré-requisitos no servidor

```bash
# Conectar no servidor e verificar
ssh USUARIO@IP_DO_SERVIDOR

# Checar se Docker está instalado
docker --version

# Checar se EasyPanel está rodando
curl -s http://localhost:3000 | head -5
```

Se o Docker não estiver instalado:
```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker
```

Se o EasyPanel não estiver instalado:
```bash
curl -sSL https://get.easypanel.io | sh
```
Após instalar, acesse `http://IP_DO_SERVIDOR:3000` para configurar.

---

### Passo 2 — Criar o arquivo .env

No diretório raiz do projeto (onde está este arquivo), copie o exemplo e preencha:

```bash
cp .env.example .env
```

Edite o `.env` com os valores reais:

```
# IXC
IXC_BASE_URL=https://saomateus.cas.net.br
IXC_USER=91
IXC_PASS=<SENHA_DO_IXC_QUE_O_USUARIO_FORNECEU>

# JWT — gere com: openssl rand -hex 32
JWT_SECRET=<GERE_AGORA_COM_OPENSSL>

# Senha inicial do admin
ADMIN_PASSWORD=ilnet@2026

# Banco
POSTGRES_DB=ilnet_totem
POSTGRES_USER=ilnet
POSTGRES_PASSWORD=<GERE_UMA_SENHA_FORTE>
DATABASE_URL=postgresql://ilnet:<SENHA>@postgres:5432/ilnet_totem

# URLs públicas
VITE_API_URL=https://api.totem.ilnet.com.br
```

Para gerar o JWT_SECRET e a senha do banco, rode:
```bash
openssl rand -hex 32
```

---

### Passo 3 — Criar repositório Git e subir o código

O EasyPanel faz deploy a partir de um repositório Git. Use GitHub:

```bash
cd /caminho/do/projeto

# Inicializar git (se ainda não tiver)
git init
git add .
git commit -m "deploy inicial ilnet totem"

# Criar repo no GitHub (usar GitHub CLI se disponível)
gh repo create ilnet-totem --private --source=. --push

# Ou manualmente:
git remote add origin https://github.com/USUARIO/ilnet-totem.git
git branch -M main
git push -u origin main
```

Anote a URL do repositório — vai precisar no próximo passo.

---

### Passo 4 — Criar os serviços no EasyPanel

Acesse o EasyPanel pelo navegador: `http://IP_DO_SERVIDOR:3000`

Crie um **Project** chamado `ilnet-totem`, depois crie 4 serviços:

#### 4a. PostgreSQL (banco de dados)

- Type: **Database → PostgreSQL**
- Name: `postgres`
- Database: `ilnet_totem`
- User: `ilnet`
- Password: `<POSTGRES_PASSWORD do .env>`

Após criar, anote o **Internal Connection String** (vai parecer com `postgresql://ilnet:senha@postgres:5432/ilnet_totem`).

#### 4b. Backend

- Type: **App → GitHub**
- Repository: URL do repo criado no Passo 3
- Branch: `main`
- Root Path: `/backend`
- Builder: **Dockerfile**

Variáveis de ambiente (copie do seu `.env`):
```
DATABASE_URL=postgresql://ilnet:<SENHA>@postgres:5432/ilnet_totem
IXC_BASE_URL=https://saomateus.cas.net.br
IXC_USER=91
IXC_PASS=<SENHA_IXC>
JWT_SECRET=<JWT_SECRET>
ADMIN_PASSWORD=ilnet@2026
PORT=3001
NODE_ENV=production
```

Domain: `api.totem.ilnet.com.br` → porta `3001`
Habilitar HTTPS.

#### 4c. Totem

- Type: **App → GitHub**
- Repository: mesma URL
- Branch: `main`
- Root Path: `/totem`
- Builder: **Dockerfile**

Variáveis de ambiente:
```
API_URL=https://api.totem.ilnet.com.br
```

Domain: `totem.ilnet.com.br` → porta `80`
Habilitar HTTPS.

#### 4d. Admin

- Type: **App → GitHub**
- Repository: mesma URL
- Branch: `main`
- Root Path: `/admin`
- Builder: **Dockerfile**

Variáveis de ambiente:
```
API_URL=https://api.totem.ilnet.com.br
```

Domain: `admin.totem.ilnet.com.br` → porta `80`
Habilitar HTTPS.

---

### Passo 5 — Apontar DNS

No painel de DNS do domínio `ilnet.com.br`, crie 3 registros A:

```
totem.ilnet.com.br       A  <IP_DO_SERVIDOR>
api.totem.ilnet.com.br   A  <IP_DO_SERVIDOR>
admin.totem.ilnet.com.br A  <IP_DO_SERVIDOR>
```

TTL: 300 (5 minutos). Aguarde a propagação antes de prosseguir.

Para verificar se propagou:
```bash
dig totem.ilnet.com.br +short
# deve retornar o IP do servidor
```

---

### Passo 6 — Fazer o deploy na ordem certa

No EasyPanel, faça deploy nesta sequência:

1. `postgres` — clique em **Deploy** e aguarde ficar verde
2. `backend` — clique em **Deploy**; nos logs você vai ver `Database initialized` quando o banco estiver pronto
3. `totem` e `admin` — pode fazer os dois ao mesmo tempo

Para acompanhar os logs de cada serviço, clique no nome do serviço → **Logs**.

---

### Passo 7 — Verificar se está tudo funcionando

```bash
# Backend respondendo
curl https://api.totem.ilnet.com.br/health

# Deve retornar:
# {"status":"ok","db":"ok"}
```

Se o backend responder OK, o banco está conectado e as tabelas foram criadas.

Acesse o admin: `https://admin.totem.ilnet.com.br`
- Usuário: `admin`
- Senha: o valor de `ADMIN_PASSWORD` (padrão: `ilnet@2026`)

---

### Passo 8 — Configuração inicial no admin

1. **Eventos** → Novo evento → preencha nome e datas → Salvar → Ativar
2. **Prêmios** → Adicione os prêmios com imagem PNG, nome, estoque e peso (soma deve dar 100%)
3. **Ajustes** → Verifique a chance de ganhar (padrão: 40%) → Teste a conexão IXC

---

## Configurar o tablet em modo quiosque

No tablet Android:

1. Abra o Chrome e acesse `https://totem.ilnet.com.br`
2. Instale **Fully Kiosk Browser** (Play Store)
3. Configure a URL de partida: `https://totem.ilnet.com.br`
4. Ative modo quiosque (bloqueia o tablet na tela do totem)

Ou no Chrome nativo:
- Settings → Accessibility → desativar barra de navegação do sistema
- Adicionar à tela inicial como PWA

---

## Comandos úteis para manutenção

```bash
# Ver logs do backend em tempo real
# (no EasyPanel: clique no serviço → Logs)

# Reiniciar backend sem downtime
# (no EasyPanel: clique no serviço → Redeploy)

# Backup do banco
docker exec postgres pg_dump -U ilnet ilnet_totem > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i postgres psql -U ilnet ilnet_totem < backup_YYYYMMDD.sql
```

---

## Atualizar o código após mudanças

Faça commit e push para o GitHub:
```bash
git add .
git commit -m "descrição da mudança"
git push
```

No EasyPanel, clique em **Redeploy** no serviço que mudou. O EasyPanel faz pull do Git e reconstrói automaticamente.

---

## Vídeo de fundo (tela inicial do totem)

Para adicionar o vídeo na tela de atração:

1. Coloque o arquivo em `totem/public/assets/video.mp4`
2. Faça commit e push
3. Faça Redeploy do serviço `totem`

O vídeo ideal: resolução do tablet (ex: 1280×800), formato MP4 H.264, até 30MB, sem áudio ou com áudio baixo.

---

## Troubleshooting comum

**Backend não conecta ao banco:**
- Verifique se o serviço `postgres` está verde no EasyPanel
- Confira se `DATABASE_URL` está correta na variável de ambiente do backend
- O hostname do banco deve ser `postgres` (nome do serviço), não `localhost`

**IXC retorna erro de autenticação:**
- Verifique `IXC_USER` e `IXC_PASS` nas variáveis do backend
- Confirme com o usuário se a senha mudou no sistema IXC

**Totem mostra tela em branco:**
- Abra o DevTools do Chrome no tablet → Console → veja o erro
- Provavelmente `API_URL` está errada ou o backend não está respondendo

**Certificado SSL com erro:**
- Verifique se o DNS propagou (use `dig` ou `nslookup`)
- No EasyPanel → Domains → clique em Renew Certificate

---

## Estrutura do projeto

```
ilnet-totem/
├── backend/           # API Node.js
│   ├── src/
│   │   ├── server.js  # entrypoint
│   │   ├── db.js      # PostgreSQL + migrations
│   │   └── routes/    # ixc, events, prizes, participants, admin, settings
│   └── Dockerfile
├── totem/             # App React do tablet
│   ├── src/
│   │   ├── App.jsx    # roteador de telas
│   │   ├── api.js     # chamadas ao backend
│   │   └── screens/   # Attract, Entry, ClientCPF, ContractSelect, Debts,
│   │                  # Pix, VisitorForm, SlotMachine, Won, Lost
│   └── Dockerfile
├── admin/             # Painel administrativo React
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── pages/     # Login, Dashboard, Events, Prizes, Validate,
│   │                  # Participants, Settings
│   └── Dockerfile
├── docker-compose.yml # Para desenvolvimento local
├── .env.example       # Template de variáveis de ambiente
├── README.md          # Documentação técnica
└── CLAUDE.md          # Este arquivo
```

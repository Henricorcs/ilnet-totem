# ILNET Totem — Guia de Deploy

Projeto completo do totem interativo da ILNET para eventos.
Stack: Node.js · React · PostgreSQL · Docker · EasyPanel

---

## O que está incluído

| Serviço   | Descrição                              | Porta interna |
|-----------|----------------------------------------|---------------|
| `backend` | API Node.js (proxy IXC + banco)        | 3001          |
| `totem`   | App React pra o tablet do totem        | 80            |
| `admin`   | Painel administrativo React            | 80            |
| `postgres`| Banco de dados PostgreSQL              | 5432          |

---

## Deploy no EasyPanel — Passo a passo

### 1. Subir o código pro GitHub

```bash
cd ilnet-totem
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/SEU_USUARIO/ilnet-totem.git
git push -u origin main
```

### 2. Criar o projeto no EasyPanel

1. Abra o EasyPanel → **Create Project** → nome: `ilnet-totem`
2. Dentro do projeto, crie **4 serviços** (New Service):

---

### Serviço 1: Banco de dados (PostgreSQL)

- **Type**: Database → PostgreSQL
- **Name**: `postgres`
- Anote o **connection string** gerado, vai precisar no passo seguinte

---

### Serviço 2: Backend

- **Type**: App → GitHub
- **Repository**: `SEU_USUARIO/ilnet-totem`
- **Branch**: `main`
- **Root Directory**: `./backend`
- **Build Command**: *(deixar vazio — usa o Dockerfile)*
- **Dockerfile**: `./backend/Dockerfile`

**Variáveis de ambiente** (clique em Environment → adicione todas):

```
DATABASE_URL=postgresql://USER:SENHA@postgres:5432/ilnet_totem
IXC_USER=91
IXC_PASS=<senha_do_ixc>
JWT_SECRET=<gere_com_openssl_rand_hex_32>
ADMIN_PASSWORD=ilnet@2026
PORT=3001
```

**Domínio**: `api.totem.ilnet.com.br` → porta `3001`

---

### Serviço 3: Totem (app do tablet)

- **Type**: App → GitHub
- **Repository**: `SEU_USUARIO/ilnet-totem`
- **Root Directory**: `./totem`
- **Dockerfile**: `./totem/Dockerfile`

**Variáveis de ambiente**:
```
API_URL=https://api.totem.ilnet.com.br
```

**Domínio**: `totem.ilnet.com.br` → porta `80`

---

### Serviço 4: Admin (painel)

- **Type**: App → GitHub
- **Repository**: `SEU_USUARIO/ilnet-totem`
- **Root Directory**: `./admin`
- **Dockerfile**: `./admin/Dockerfile`

**Variáveis de ambiente**:
```
API_URL=https://api.totem.ilnet.com.br
```

**Domínio**: `admin.totem.ilnet.com.br` → porta `80`

---

### 3. Apontar o DNS

No painel DNS do seu provedor, crie 3 registros **CNAME** ou **A**
apontando pro IP do servidor:

```
totem.ilnet.com.br       → IP do servidor
api.totem.ilnet.com.br   → IP do servidor
admin.totem.ilnet.com.br → IP do servidor
```

---

### 4. Habilitar HTTPS (SSL)

No EasyPanel, em cada serviço, vá em **Domains → Enable HTTPS**.
O EasyPanel gera os certificados SSL automaticamente via Let's Encrypt.

---

### 5. Deploy inicial

Em cada serviço, clique em **Deploy**. A ordem ideal é:
1. `postgres` (primeiro)
2. `backend` (segundo — inicializa o banco automaticamente)
3. `totem` e `admin` (em qualquer ordem)

---

### 6. Primeiro acesso ao admin

Acesse `https://admin.totem.ilnet.com.br`

- **Usuário**: `admin`
- **Senha**: o valor que você colocou em `ADMIN_PASSWORD` (padrão: `ilnet@2026`)

**Importante**: troque a senha no primeiro acesso — vá em Ajustes.

---

## Fluxo pós-deploy

1. Entre no admin → **Eventos** → crie um evento e ative
2. Entre em **Prêmios** → adicione os prêmios com PNG, estoque e peso
3. Abra o tablet → `https://totem.ilnet.com.br`
4. Configure o Chrome em modo quiosque:
   - Settings → Accessibility → No system navigation bar
   - Ou use um app de quiosque (como Fully Kiosk Browser)

---

## Vídeo de fundo (tela inicial)

O totem tenta reproduzir `/assets/video.mp4`.
Coloque um arquivo de vídeo em `totem/public/assets/video.mp4`
e faça um novo deploy. Se o arquivo não existir, a tela funciona
normalmente com animação de partículas.

---

## Desenvolvimento local

```bash
# 1. Copiar variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais reais

# 2. Subir tudo com Docker Compose
docker compose up --build

# Acessos locais:
# Totem:   http://localhost:3000
# Admin:   http://localhost:3002
# Backend: http://localhost:3001
```

---

## Exportação de leads

No painel admin → **Leads** → botão **Exportar CSV**.
O arquivo inclui: CPF, nome, telefone, endereço, tipo, resultado, prêmio, data.

---

## Suporte técnico

Em caso de problema, verifique os logs no EasyPanel:
- Serviço `backend` → Logs → procure por erros de banco ou IXC
- Serviço `postgres` → deve mostrar "database system is ready"

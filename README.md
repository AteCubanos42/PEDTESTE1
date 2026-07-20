# PED Calc

Calculadora independente de apoio à terapia intensiva pediátrica. A aplicação reúne venóclise, infusões, scores, antimicrobianos hospitalares e domiciliares e correções hidroeletrolíticas.

> Ferramenta de apoio matemático. Não substitui prescrição, protocolo institucional, avaliação clínica, validação farmacêutica nem dupla checagem independente.

## Requisitos

- Node.js 22.13 ou superior
- npm
- Conta gratuita ou paga na Cloudflare, caso queira publicar
- Git, caso queira manter o código no GitHub

## Executar no computador

```bash
npm ci
npm run dev
```

Abra o endereço exibido no terminal. Para verificar a versão antes de publicar:

```bash
npm run lint
npm run typecheck
npm test
```

## Colocar no GitHub

1. Crie um repositório vazio no GitHub, por exemplo `ped-calc`.
2. Na pasta extraída deste projeto, execute:

```bash
git init
git add .
git commit -m "Publica PED Calc"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/ped-calc.git
git push -u origin main
```

Substitua `SEU-USUARIO` pelo seu nome de usuário. Não envie arquivos `.env`, tokens ou credenciais ao repositório.

## Publicar diretamente na Cloudflare

No primeiro uso, autentique a sua conta:

```bash
npx wrangler login
```

Valide o pacote sem publicar:

```bash
npm run deploy:cloudflare:check
```

Depois publique:

```bash
npm run deploy:cloudflare
```

O build gera automaticamente `dist/server/wrangler.json`, usado pelo comando de deploy. Ao final, o terminal informa o endereço `workers.dev` criado pela Cloudflare.

## Importar o repositório pelo painel da Cloudflare

Na tela **Workers & Pages → Importar um repositório**, use:

- **Nome do Worker:** `ped-calc`
- **Diretório raiz:** deixe vazio se `package.json` estiver na primeira tela do repositório. Se existir uma pasta `ped-calc` contendo o projeto, informe `ped-calc`.
- **Comando de build:** `npm run build`
- **Comando de implantação:** `npx wrangler deploy --config dist/server/wrangler.json`
- **Branch de produção:** `main`

Também é possível deixar somente `npx wrangler deploy` como comando de implantação: o arquivo `wrangler.jsonc` da raiz executará o build antes de enviar o Worker. A forma com `--config dist/server/wrangler.json` é preferível no painel porque usa diretamente a configuração produzida pelo Vinext.

Se o painel mostrar **No dependencies detected**, a Cloudflare está na pasta errada. Corrija o **Diretório raiz** até que `package.json`, `app`, `lib` e `wrangler.jsonc` fiquem na raiz selecionada.

## Publicação automática pelo GitHub

O arquivo `.github/workflows/deploy-cloudflare.yml` pode publicar toda alteração enviada à branch `main`.

No GitHub, abra **Settings → Secrets and variables → Actions** e crie estes segredos:

- `CLOUDFLARE_API_TOKEN`: token com permissão para editar Workers.
- `CLOUDFLARE_ACCOUNT_ID`: identificador da conta Cloudflare.

Depois disso, cada `git push` para `main` executará testes, build e publicação. Se preferir publicar manualmente, remova o arquivo de workflow.

## Organização principal

- `app/`: interface, dados clínicos e componentes.
- `lib/`: funções matemáticas isoladas.
- `tests/`: testes automatizados de cálculos e renderização.
- `public/`: ícones e arquivos públicos.
- `scripts/`: build e validação.

As referências clínicas oficiais aparecem dentro da própria interface. Antes de uso assistencial, valide apresentações, concentrações e fluxos com a CCIH, farmácia e protocolo vigente da instituição.

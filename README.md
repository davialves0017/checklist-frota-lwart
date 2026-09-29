# Check-list de Frota LWART

Sistema web para realização e acompanhamento dos check-lists da frota da filial de Goiânia.

**Site publicado:** [checkgo.davialves0017.chatgpt.site](https://checkgo.davialves0017.chatgpt.site)

## Recursos do sistema

- Check-list quinzenal, mensal e de troca de caminhão.
- Preenchimento automático da placa ao informar a frota cadastrada.
- Cadastro automático de novos motoristas.
- Registro de observação ou foto quando um item é marcado como não conforme.
- Foto e assinatura de quem realizou a inspeção.
- Salvamento do preenchimento no aparelho para evitar perda ao recarregar a página.
- Painel administrativo protegido por login.
- Gestão de usuários, senhas e permissões.
- Histórico completo por veículo.
- Filtros de inspeções, problemas, situação, tipo e período.
- Planos de ação com descrição, responsável, prazo e identificação de quem fez a alteração.
- Alertas de planos atrasados e análise de problemas recorrentes.
- Sugestões automáticas de melhoria baseadas nas ocorrências registradas.
- Download individual ou mensal dos check-lists em PDF.
- Exportação dos dados para planilha compatível com Excel.

## Tecnologias

O projeto utiliza Next.js, React, TypeScript, Tailwind CSS, Vinext, Cloudflare D1, armazenamento R2 e Drizzle ORM.

## Executar no computador

É necessário ter o Node.js 22.13 ou mais recente instalado.

```bash
npm install
npm run dev
```

Depois, abra o endereço apresentado no terminal. Normalmente será `http://localhost:5173`.

## Compilar o projeto

```bash
npm run build
npm run start
```

## Armazenamento

O banco de dados utiliza o vínculo `DB` do Cloudflare D1. As fotos, assinaturas e evidências utilizam o vínculo `BUCKET` do Cloudflare R2. As migrações estão na pasta `drizzle`.

## Configuração administrativa

O ambiente publicado precisa das variáveis `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `ADMIN_SESSION_SECRET`. Senhas reais não devem ser adicionadas ao repositório.

## Estrutura principal

- `app`: telas, formulários e rotas da aplicação.
- `components`: componentes visuais reutilizáveis.
- `db`: estrutura do banco de dados.
- `drizzle`: migrações do banco.
- `lib`: listas, validações, autenticação e funções auxiliares.
- `public`: arquivos públicos e suporte ao funcionamento offline.

## Segurança

A conta administradora principal é definida pelas variáveis protegidas do ambiente. Usuários adicionais são armazenados com senha criptografada. Apenas usuários autorizados podem criar, bloquear ou excluir outros acessos.

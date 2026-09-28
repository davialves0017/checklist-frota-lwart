export type ChecklistItem = { number: number; question: string; kind?: "boolean" | "date" | "number"; problemResponse?: "sim" | "nao" };

export const quinzenalItems: ChecklistItem[] = [
  { number: 1, question: "Pasta de documentos está organizada e limpa? Contém o cartão Ecofrotas?" },
  { number: 2, question: "Tacógrafo com disco e funcionando, lacre em perfeito estado?" },
  { number: 3, question: "Luzes do painel de instrumentos iluminando todos os indicadores?" },
  { number: 4, question: "Disposição correta e de fácil acesso a todos os EPIs (capacete, luvas, calçado e outros)?" },
  { number: 5, question: "O kit para situação de emergência está completo, lacrado e dentro da validade?" },
  { number: 6, question: "Extintor da cabine devidamente lacrado e com o ponteiro do manômetro no verde?" },
  { number: 7, question: "Possui cinto de segurança de três pontos e funcionando corretamente?" },
  { number: 8, question: "Macaco, chave de roda e triângulo de sinalização em condições de uso?" },
  { number: 9, question: "Freios dianteiros e traseiros estão funcionando corretamente e sem vazamento?" },
  { number: 10, question: "Bomba de OLUC está funcionando corretamente?" },
  { number: 11, question: "Para-brisa sem arranhões e livre de trincas? Esguicho funcionando?" },
  { number: 12, question: "Limpador de para-brisa funcionando e palhetas em bom estado?" },
  { number: 13, question: "Simbologia de cargas perigosas de acordo com o produto (rótulo de risco e painel de segurança)?" },
  { number: 14, question: "Óleo do motor e fluido de arrefecimento estão no nível?" },
  { number: 15, question: "Possui chave geral sinalizada (liga/desliga)?" },
  { number: 16, question: "Escada, acesso e parte superior do tanque estão com antiderrapante?" },
  { number: 17, question: "Tanque, tubulações e mangueiras (entrada e saída de bomba) estão sem vazamentos e trincas?" },
  { number: 18, question: "Cones de sinalização em boas condições e limpos?" },
  { number: 19, question: "Possui números dos telefones de emergência visíveis nos dois lados do veículo?" },
  { number: 20, question: "Extintor do tanque devidamente lacrado e com o ponteiro do manômetro no verde?" },
  { number: 21, question: "Válvulas de fundo, escotilha e tambor de medidas desbloqueados, sem vazamentos, trincas ou deformações?" },
  { number: 22, question: "Todas as lanternas e faróis estão bem fixados, sem trincas e funcionando?" },
  { number: 23, question: "Rodas e parafusos estão sem trincas? Todos os parafusos estão no lugar?" },
  { number: 24, question: "Todos os pneus, incluindo o estepe, estão em bom estado (sulco mínimo de 2 mm e sem deformações)?" },
  { number: 25, question: "Possui extensor de calibragem e calços de roda? Os calços estão livres de trincas?" },
];

export const mensalItems: ChecklistItem[] = [
  { number: 1, question: "Pasta de documentos está organizada e limpa? Contém o cartão Ecofrotas?" },
  { number: 2, question: "Informe a data de vencimento da capacitação do tanque (CIPP)", kind: "date" },
  { number: 3, question: "Informe a data de vencimento do Certificado de Inspeção Veicular (CIV)", kind: "date" },
  { number: 4, question: "Informe a validade do certificado de aferição do tacógrafo", kind: "date" },
  { number: 5, question: "Informe a validade do Cadastro Técnico Federal (CTF) do IBAMA", kind: "date" },
  { number: 6, question: "Informe a validade do Certificado de Registro e Licenciamento do Veículo (CRLV)", kind: "date" },
  { number: 7, question: "Informe a validade do teste de opacidade", kind: "date" },
  { number: 8, question: "Informe a validade da Autorização de Transporte de Produtos Perigosos (AATIPP)", kind: "date" },
  { number: 9, question: "Contém o certificado do Plano de Atendimento a Emergência (PAE)?" },
  { number: 10, question: "Cabine está organizada e limpa (porta-luvas e portas livres de revistas, papéis e outros)?" },
  { number: 11, question: "Documentos pessoais (CNH, RG, MOPP, ASO e crachá) em condições de uso e atualizados?" },
  { number: 12, question: "Tacógrafo com disco e funcionando, lacre em perfeito estado?" },
  { number: 13, question: "Luzes do painel de instrumentos iluminando todos os indicadores?" },
  { number: 14, question: "Disposição correta e de fácil acesso a todos os EPIs (capacete, luvas, calçado e outros)?" },
  { number: 15, question: "O kit para situação de emergência está completo, lacrado e dentro da validade?" },
  { number: 16, question: "Extintor da cabine devidamente lacrado e com o ponteiro do manômetro no verde?" },
  { number: 17, question: "Informe a data de vencimento do extintor da cabine", kind: "date" },
  { number: 18, question: "Possui cinto de segurança de três pontos e funcionando corretamente?" },
  { number: 19, question: "Macaco, chave de roda e triângulo de sinalização em condições de uso?" },
  { number: 20, question: "Freios dianteiros e traseiros estão funcionando corretamente e sem vazamento?" },
  { number: 21, question: "Pedais de freio, embreagem e acelerador com borracha antiderrapante em perfeito estado?" },
  { number: 22, question: "Bomba de OLUC está funcionando corretamente?" },
  { number: 23, question: "Para-brisa sem arranhões e livre de trincas? Esguicho funcionando?" },
  { number: 24, question: "Limpador de para-brisa funcionando e palhetas em bom estado?" },
  { number: 25, question: "Simbologia de cargas perigosas de acordo com o produto (rótulo de risco e painel de segurança)?" },
  { number: 26, question: "Óleo do motor e fluido de arrefecimento estão no nível?" },
  { number: 27, question: "Informe o km da próxima troca de óleo do motor", kind: "number" },
  { number: 28, question: "Possui chave geral sinalizada (liga/desliga)?" },
  { number: 29, question: "Bateria protegida, limpa, livre de zinabre e com suporte bem fixado?" },
  { number: 30, question: "Escada, acesso e parte superior do tanque estão com antiderrapante?" },
  { number: 31, question: "Tanque, tubulações e mangueiras (entrada e saída de bomba) estão sem vazamentos e trincas?" },
  { number: 32, question: "Plaqueta do tanque do INMETRO está legível, em boas condições e lacrada?" },
  { number: 33, question: "Longarinas do tanque livres de trincas e em bom estado?" },
  { number: 34, question: "Todos os grampos e parafusos de fixação do tanque estão em bom estado?" },
  { number: 35, question: "Carrinho de transporte de tambor em condições de uso?" },
  { number: 36, question: "Cones de sinalização em boas condições e limpos?" },
  { number: 37, question: "Tara (peso) de acordo e legível?" },
  { number: 38, question: "Possui números dos telefones de emergência visíveis nos dois lados do veículo?" },
  { number: 39, question: "Extintor do tanque devidamente lacrado e com o ponteiro do manômetro no verde?" },
  { number: 40, question: "Informe a data de vencimento do extintor do tanque", kind: "date" },
  { number: 41, question: "Válvulas de fundo, escotilha e tambor de medidas desbloqueados, sem vazamentos, trincas ou deformações?" },
  { number: 42, question: "Todas as lanternas e faróis estão bem fixados, sem trincas e funcionando?" },
  { number: 43, question: "Rodas e parafusos estão sem trincas? Todos os parafusos estão no lugar?" },
  { number: 44, question: "Todos os pneus, incluindo o estepe, estão em bom estado (sulco mínimo de 2 mm e sem deformações)?" },
  { number: 45, question: "Possui extensor de calibragem e calços de roda? Os calços estão livres de trincas?" },
  { number: 46, question: "Pontos para conexão do cabo terra estão bem fixados e sem oxidação?" },
  { number: 47, question: "Fiação elétrica protegida está em boas condições?" },
  { number: 48, question: "Pintura e adesivos estão com boa aparência? Autorização ANP Coletor Autorizado nº 877 legível?" },
  { number: 49, question: "Plaqueta do para-choque está legível e em boas condições?" },
];

export const trocaCaminhaoItems: ChecklistItem[] = [
  { number: 1, question: "Existe alguma observação sobre o caminhão?", problemResponse: "sim" },
  { number: 2, question: "O CCO de sobra está sendo enviado preenchido?" },
];

export function getChecklist(type: string) {
  if (type === "mensal") return mensalItems;
  if (type === "troca_caminhao") return trocaCaminhaoItems;
  return quinzenalItems;
}

export function checklistLabel(type: string) {
  if (type === "mensal") return "Mensal";
  if (type === "troca_caminhao") return "Troca de caminhão";
  return "Quinzenal";
}

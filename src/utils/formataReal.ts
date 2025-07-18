export function formatarReal(valor = 0) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(valor / 100);
}

export const formatarValor = (valor: string) => {
  // Remove tudo que não for número
  const apenasNumeros = valor.replace(/[^\d]/g, "");

  if (!apenasNumeros) return "";

  // Converte para número e divide por 100 para ter centavos
  const numero = parseInt(apenasNumeros) / 100;

  // Formata com 2 casas decimais e substitui . por ,
  const valorFormatado = numero.toFixed(2).replace(".", ",");

  // Adiciona pontos a cada 3 dígitos na parte inteira
  const [parteInteira, parteDecimal] = valorFormatado.split(",");
  const parteInteiraFormatada = parteInteira.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "."
  );

  return `${parteInteiraFormatada},${parteDecimal}`;
};

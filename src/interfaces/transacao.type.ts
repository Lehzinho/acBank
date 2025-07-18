export interface TransacaoProps {
  id: string;
  usuario_origem_id: string;
  usuario_destino_id: string;
  tipo: string;
  valor: number;
  descricao: string;
  created_at: string;
  revertida: boolean;
  operacao_original_id: any;
}

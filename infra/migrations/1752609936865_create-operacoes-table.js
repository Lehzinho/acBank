exports.up = (pgm) => {
  pgm.createTable("operacoes", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    usuario_origem_id: {
      type: "uuid",
      references: "usuarios(id)",
      onDelete: "RESTRICT",
    },

    usuario_destino_id: {
      type: "uuid",
      references: "usuarios(id)",
      onDelete: "RESTRICT",
    },

    tipo: {
      type: "varchar(20)",
      notNull: true,
    },

    valor: {
      type: "integer",
      notNull: true,
    },

    descricao: {
      type: "text",
    },

    created_at: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },

    revertida: {
      type: "boolean",
      default: false,
      notNull: true,
    },

    operacao_original_id: {
      type: "uuid",
      references: "operacoes(id)",
      onDelete: "SET NULL",
    },
  });
};

exports.down = false;

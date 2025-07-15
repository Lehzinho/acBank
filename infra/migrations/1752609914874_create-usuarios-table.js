exports.up = (pgm) => {
  pgm.createTable("usuarios", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    nome: {
      type: "varchar(255)",
      notNull: true,
    },

    email: {
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },

    password: {
      type: "varchar(60)",
      notNull: true,
    },

    saldo: {
      type: "decimal(15,2)",
      default: 0.0,
      notNull: true,
    },

    created_at: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },

    updated_at: {
      type: "timestamptz",
      default: pgm.func("timezone('utc', now())"),
      notNull: true,
    },
  });
};

exports.down = false;

import { InternalServerError } from "../../../../../infra/errors";
import migrator from "../../../../../models/migrator";

export async function GET(request) {
  try {
    const pendingMigrations = await migrator.listPendingMigrations();

    return Response.json(pendingMigrations, { status: 200 });
  } catch (error) {
    const internalError = new InternalServerError({
      cause: error,
      statusCode: 500,
    });
    return Response.json(internalError.toJSON(), {
      status: internalError.statusCode,
    });
  }
}

export async function POST(request) {
  try {
    const pendingMigrations = await migrator.runPendingMigrations();

    if (pendingMigrations.length > 0) {
      return Response.json(pendingMigrations, { status: 201 });
    }

    return Response.json(pendingMigrations, { status: 200 });
  } catch (error) {
    const internalServerError = new InternalServerError({
      cause: error,
      statusCode: 500,
    });

    return Response.json(internalServerError.toJSON(), {
      status: internalServerError.statusCode,
    });
  }
}

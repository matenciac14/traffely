export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado") {
    super(message, "UNAUTHORIZED", 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Sin permisos para esta acción") {
    super(message, "FORBIDDEN", 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Recurso") {
    super(`${resource} no encontrado`, "NOT_FOUND", 404)
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status })
  }
  console.error("[API Error]", error)
  return Response.json({ error: "Error interno del servidor", code: "INTERNAL_ERROR" }, { status: 500 })
}

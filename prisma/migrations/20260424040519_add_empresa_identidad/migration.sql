-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "empresaId" TEXT;

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "logo" TEXT,
    "industria" TEXT,
    "website" TEXT,
    "descripcion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa_identidades" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "tono" TEXT,
    "publicoObjetivo" TEXT,
    "propuestasValor" TEXT,
    "palabrasProhibidas" TEXT,
    "instruccionesExtra" TEXT,
    "colores" TEXT,
    "tipografias" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresa_identidades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "empresas_workspaceId_idx" ON "empresas"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "empresa_identidades_empresaId_key" ON "empresa_identidades"("empresaId");

-- CreateIndex
CREATE INDEX "campaigns_empresaId_idx" ON "campaigns"("empresaId");

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa_identidades" ADD CONSTRAINT "empresa_identidades_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

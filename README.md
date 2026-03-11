# Recompor+ 1.0 - Monitor do BEEM (v2.2.8)

Este é o repositório oficial da solução de diário de classe para professores de Português e Matemática, sincronizado com o Firebase App Hosting.

## Status da Infraestrutura (v2.2.8)
- **Modo de Build:** Standalone (Next.js 15.5.9) - Otimizado para App Hosting.
- **Deployment:** Firebase App Hosting via GitHub.
- **Repositório:** github.com/professorberga/recompor-app-oficial
- **Database:** Firestore (v10.8.0) com QAP (Query-Allow-Permissions).
- **Auth:** Firebase Auth (Google & Email) integrado ao perfil docente.
- **Dependências:** Estabilizadas com react-firebase-hooks (v5.1.1).

## Protocolo de Produção
O sistema está configurado para rollout automático. As chaves experimentais de desenvolvimento foram mantidas apenas para o proxy do Studio, enquanto o build de produção está isolado e pronto para servir o tráfego oficial na porta 8080.

```bash
# Para rodar localmente no Studio
npm run dev

# Para simular build de produção
npm run build
npm run start
```
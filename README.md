
# Recompor+ 1.0 - Monitor do BEEM (Repositório Oficial)

Este é o repositório oficial da solução de diário de classe para professores de Português e Matemática, sincronizado com o Firebase App Hosting.

## Status da Infraestrutura (v2.2.5)
- **Modo de Build:** Standalone (Next.js 15)
- **Deployment:** Firebase App Hosting
- **Repositório:** github.com/professorberga/recompor-app-oficial
- **Database:** Firestore (v10.8.0)
- **Auth:** Firebase Auth (Google & Email)
- **Dependências:** Atualizadas com react-firebase-hooks (v5.1.1).

## Protocolo de Sincronização
O código neste repositório está otimizado para rollouts automáticos no Google Cloud via App Hosting Backend. A versão v2.2.5 resolve conflitos de exportação do hook `useCollection`.

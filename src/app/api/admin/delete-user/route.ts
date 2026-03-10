
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * API Route para exclusão de usuários do sistema.
 * Realiza a limpeza atômica no Authentication e no Firestore.
 * Protegida por verificação de token e cargo administrativo.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autenticação não fornecido' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Validação de segurança: Somente Administradores podem deletar usuários
    const requesterDoc = await adminDb.collection('teachers').doc(decodedToken.uid).get();
    const requesterData = requesterDoc.data();

    if (!requesterData || requesterData.role !== 'Admin') {
      return NextResponse.json({ error: 'Acesso negado: Somente administradores podem remover usuários.' }, { status: 403 });
    }

    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID do usuário alvo não fornecido.' }, { status: 400 });
    }

    // Proteção contra auto-exclusão
    if (uid === decodedToken.uid) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta administrativa via sistema.' }, { status: 400 });
    }

    console.log(`[AdminAPI] Iniciando exclusão resiliente para: ${uid}`);

    // 1. Remoção do Firebase Authentication
    try {
      await adminAuth.deleteUser(uid);
      console.log(`[AdminAPI] Usuário removido do Auth.`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.warn(`[AdminAPI] Usuário ${uid} já não existia no Auth. Prosseguindo.`);
      } else {
        throw err;
      }
    }

    // 2. Remoção do Perfil no Firestore (Limpeza de resíduos)
    await adminDb.collection('teachers').doc(uid).delete();
    console.log(`[AdminAPI] Documento Firestore removido.`);

    return NextResponse.json({ 
      success: true, 
      message: 'Usuário e dados de perfil removidos com sucesso.' 
    });

  } catch (error: any) {
    console.error('[AdminAPI] Erro crítico:', error);
    return NextResponse.json({ 
      error: 'Erro interno ao processar a exclusão.',
      details: error.message 
    }, { status: 500 });
  }
}

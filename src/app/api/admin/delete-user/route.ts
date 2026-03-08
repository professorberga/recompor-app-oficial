import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * API Route para exclusão de usuários do sistema.
 * Realiza a limpeza atômica no Authentication e no Firestore.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autenticação não fornecido' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Validação de segurança: Verifica se o solicitante tem perfil de Administrador no Firestore
    const requesterDoc = await adminDb.collection('teachers').doc(decodedToken.uid).get();
    const requesterData = requesterDoc.data();

    if (!requesterData || requesterData.role !== 'Admin') {
      return NextResponse.json({ error: 'Acesso negado: Somente administradores podem remover usuários.' }, { status: 403 });
    }

    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID do usuário alvo não fornecido.' }, { status: 400 });
    }

    // Proteção contra auto-exclusão via API
    if (uid === decodedToken.uid) {
      return NextResponse.json({ error: 'Por razões de segurança, você não pode excluir sua própria conta administrativa via sistema.' }, { status: 400 });
    }

    console.log(`[AdminAPI] Executando exclusão completa para o usuário: ${uid}`);

    // 1. Remoção do Firebase Authentication (Trata caso de usuário já inexistente)
    try {
      await adminAuth.deleteUser(uid);
      console.log(`[AdminAPI] Usuário removido do Firebase Auth: ${uid}`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.warn(`[AdminAPI] Usuário ${uid} já não constava no Auth. Prosseguindo para limpeza do Firestore.`);
      } else {
        throw err;
      }
    }

    // 2. Remoção do Perfil no Firestore
    await adminDb.collection('teachers').doc(uid).delete();
    console.log(`[AdminAPI] Documento do docente removido do Firestore: ${uid}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Usuário e dados de perfil removidos com sucesso de todas as bases.' 
    });

  } catch (error: any) {
    console.error('[AdminAPI] Erro crítico durante exclusão de usuário:', error);
    return NextResponse.json({ 
      error: 'Erro interno ao processar a exclusão. Tente novamente mais tarde.',
      details: error.message 
    }, { status: 500 });
  }
}

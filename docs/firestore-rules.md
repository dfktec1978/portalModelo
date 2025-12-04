Regras recomendadas (exemplo) para Firestore

Aviso: adapte os caminhos, claims de admin e as condições conforme sua arquitetura. Teste em um ambiente de desenvolvimento antes de aplicar em produção.

// Exemplo para firestore.rules

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {

    // Usuários — qualquer usuário autenticado pode criar seu próprio documento users/{uid}
    // mas não pode definir role/status arbitrariamente.
    match /users/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId
        && request.resource.data.keys().hasOnly(["email","role","createdAt","status","displayName","phone","approvedAt","name"]);

      // Usuário pode atualizar campos próprios (nome, telefone), mas não pode atualizar `status` nem `role`.
      allow update: if request.auth != null && request.auth.uid == userId
        && !("status" in request.resource.data) && !("role" in request.resource.data);

      // Admins (usando custom claim admin == true) podem ler e escrever status e role
      allow write: if request.auth != null && request.auth.token.admin == true;
      allow read: if true;
    }

    // Stores — apenas admin ou dono (ownerUid) pode alterar o status; dono pode atualizar dados da loja, mas não o campo status.
    match /stores/{storeId} {
      allow read: if true;

      allow create: if request.auth != null && request.auth.uid == request.resource.data.ownerUid;

      allow update: if (
        // dono pode atualizar campos da loja, exceto `status`
        (request.auth != null && request.auth.uid == resource.data.ownerUid && !("status" in request.resource.data))
        // admins podem atualizar tudo (aprovar/bloquear)
        || (request.auth != null && request.auth.token.admin == true)
      );

      allow delete: if request.auth != null && request.auth.token.admin == true;
    }

    // News — only admin can create/publish
    match /news/{newsId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null && request.auth.token.admin == true;
    }

    // Audit logs — only admin can write (clients should not be able to forge logs)
    match /auditLogs/{logId} {
      allow read: if request.auth != null && request.auth.token.admin == true;
      allow create: if request.auth != null && request.auth.token.admin == true;
      allow delete: if false;
    }

    // Default: deny
    match /{document=**} {
      allow read, write: if false;
    }

}
}

Notas:

- Para usar `request.auth.token.admin` você precisa configurar Custom Claims no Firebase Auth (via Admin SDK) para marcar administradores.
- Se usar apenas um UID único (NEXT_PUBLIC_MASTER_UID), as regras devem ser temporárias e só para dev. Em produção, prefira claims/custom tokens.
- Se não puder usar custom claims, uma alternativa é ter uma collection `admins` e regras que leem essa coleção (mais lenta e com limitações). Exemplo:
  allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid))

Aplicação:

- Copie o conteúdo para o editor de regras do Firebase Console e ajuste conforme seu modelo de dados.
- Teste com o simulador de regras antes de implantar.

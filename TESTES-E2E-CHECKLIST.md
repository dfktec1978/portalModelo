# Plano de Testes E2E - Portal Modelo
**Data:** 17/01/2026
**Versão:** 1.0

## Objetivo
Validar o fluxo completo de uso do sistema para lojistas de ambas categorias (Varejo e Alimentação).

---

## ✅ TESTE 1: FLUXO LOJA VAREJO

### Pré-requisitos
- Loja categoria "varejo" criada
- Usuário logado como lojista

### Passos
1. **Acessar Dashboard**
   - [ ] Login bem-sucedido
   - [ ] Dashboard carrega corretamente
   - [ ] Loja aparece no seletor

2. **Visão Geral**
   - [ ] Cards de estatísticas carregam
   - [ ] Status da loja exibido corretamente
   - [ ] Contadores (produtos, pedidos) funcionam

3. **Módulo Produtos (Varejo)**
   - [ ] Banner de dicas aparece (quando vazio)
   - [ ] Criar produto com sucesso
   - [ ] Upload de imagem funciona
   - [ ] Editar produto funciona
   - [ ] Deletar produto funciona
   - [ ] Estoque atualiza corretamente

4. **Módulo Estoque**
   - [ ] Produtos aparecem
   - [ ] Ajuste rápido (+/-) funciona
   - [ ] Valores salvam corretamente

5. **Aparência**
   - [ ] Trocar tema funciona
   - [ ] Upload logo funciona
   - [ ] Pré-visualização atualiza

6. **Configurações**
   - [ ] Campos carregam com dados corretos
   - [ ] Salvar informações funciona
   - [ ] Toggle ativa/desativa funciona

7. **Página Pública**
   - [ ] Acessar /lojas/[slug]
   - [ ] Tema aplicado corretamente
   - [ ] Logo aparece
   - [ ] Produtos listados
   - [ ] Botão WhatsApp funciona

---

## ✅ TESTE 2: FLUXO LOJA ALIMENTAÇÃO

### Pré-requisitos
- Loja categoria "alimentacao" criada
- Usuário logado como lojista

### Passos
1. **Módulo Cardápio (Alimentação)**
   - [ ] Banner de dicas aparece (quando vazio)
   - [ ] Criar item cardápio com sucesso
   - [ ] Campo descrição/ingredientes funciona
   - [ ] Preço salva corretamente
   - [ ] Editar item funciona
   - [ ] Deletar item funciona

2. **Módulo Adicionais**
   - [ ] Criar categoria de adicionais
   - [ ] Criar itens adicionais
   - [ ] Valores salvam corretamente
   - [ ] Deletar funciona

3. **Módulo Horários**
   - [ ] Definir horário de funcionamento
   - [ ] Toggle dias da semana funciona
   - [ ] Salvar horários funciona

4. **Módulo Pedidos**
   - [ ] Pedidos de teste aparecem
   - [ ] Filtros funcionam (Todos, Ativos, Pendentes, Prontos, Cancelados)
   - [ ] Trocar status funciona
   - [ ] Modal de detalhes abre
   - [ ] Itens e valores corretos

5. **Módulo Financeiro**
   - [ ] Cards de estatísticas carregam
   - [ ] Cálculos corretos (vendas, ticket médio)
   - [ ] Comparação mensal funciona
   - [ ] Últimos pedidos aparecem

6. **Página Pública**
   - [ ] Cardápio listado corretamente
   - [ ] Taxa de entrega aparece
   - [ ] Tema aplicado
   - [ ] Botão WhatsApp por item funciona

---

## ✅ TESTE 3: FUNCIONALIDADES UNIVERSAIS

### Troca de Temas
- [ ] Azul aplica corretamente
- [ ] Vermelho aplica corretamente
- [ ] Verde aplica corretamente
- [ ] Roxo aplica corretamente
- [ ] Tema reflete na página pública

### Upload de Logo
- [ ] Upload JPG funciona
- [ ] Upload PNG funciona
- [ ] Pré-visualização atualiza
- [ ] Logo aparece na página pública

### Troca de Lojas
- [ ] Trocar entre lojas no seletor funciona
- [ ] Módulos corretos aparecem por categoria
- [ ] Dados isolados por loja

---

## 🐛 BUGS ENCONTRADOS
*(Documentar aqui durante os testes)*

---

## 📊 RESULTADO FINAL
- [ ] Todos os testes passaram
- [ ] Sistema pronto para produção
- [ ] Documentação completa

---

## 📝 NOTAS ADICIONAIS
*(Observações durante os testes)*

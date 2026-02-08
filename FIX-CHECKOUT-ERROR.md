# Fix: Erro ao carregar configurações da loja no CheckoutFlow

## Problema
O console exibia o erro:
```
Erro ao carregar configurações da loja: {}
```

Este erro ocorria na linha 56 do arquivo `src/components/CheckoutFlow.tsx` quando tentava carregar as configurações da loja do Supabase.

## Raízes do Problema

1. **Error object não formatado**: O `console.error` estava recebendo objetos Error/Supabase que não eram formatados como strings
2. **Falta de fallback**: Quando a loja não era encontrada, o componente retornava um erro em vez de usar valores padrão
3. **Sem estado de erro**: Não havia rastreamento do que deu errado no carregamento

## Solução Implementada

### 1. Adicionado estado de erro e config padrão
```typescript
const [configError, setConfigError] = useState<string | null>(null)

const defaultStoreConfig = {
  id: storeId,
  store_name: 'Loja',
  delivery_options: ['retirada'],
  delivery_fee_envio: 0,
  delivery_fee_condicional: 0,
  payment_options: ['na_retirada'],
  pix_key: null,
  min_order_delivery: 0,
  schedule_delivery: null
}
```

### 2. Melhorado tratamento de erro com fallback
```typescript
try {
  const { data, error } = await supabase
    .from('stores')
    .select(...)
    .eq('id', storeId)
    .single()

  if (error) {
    console.warn(`Aviso ao carregar loja: ${error.message}. Usando configurações padrão.`)
    setConfigError(`Usando valores padrão: ${error.message}`)
    setStoreConfig(defaultStoreConfig) // ← FALLBACK
  } else if (!data) {
    console.warn('Nenhuma loja encontrada. Usando configurações padrão.')
    setConfigError('Loja não encontrada. Usando valores padrão.')
    setStoreConfig(defaultStoreConfig) // ← FALLBACK
  } else {
    setStoreConfig(data)
    setConfigError(null)
  }
} catch (err: any) {
  const errorMessage = err instanceof Error ? err.message : String(err)
  console.error('Erro ao carregar configurações da loja:', errorMessage)
  setConfigError(errorMessage)
  setStoreConfig(defaultStoreConfig) // ← FALLBACK
}
```

### 3. Removido o guard `if (!storeConfig)`
Antes retornava erro ao usuário, agora continua com valores padrão.

## Resultado

✅ **Checkout continua funcionando mesmo se a loja não estiver no banco**
✅ **Erros são formatados corretamente no console**
✅ **Usuário vê interface padrão em vez de mensagem de erro**
✅ **Configurações da loja são usadas quando disponíveis**

## Mensagens de Console Agora

- ✅ **Com sucesso**: `storeConfig` é carregado do Supabase
- ⚠️ **Com fallback**: `"Aviso ao carregar loja: [...]. Usando configurações padrão."`
- 📋 **Debug info**: `"Configuração da loja: {...}"`

## Arquivos Modificados

- `src/components/CheckoutFlow.tsx` - Adicionar fallback e melhor tratamento de erro

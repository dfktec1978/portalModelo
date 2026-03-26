'use client'

import StoreOrdersModuleRetail from './StoreOrdersModuleRetail'
import StoreOrdersModuleFood from './StoreOrdersModuleFood'

type Props = {
  store: any
}

export default function StoreOrdersModule({ store }: Props) {
  if (store?.category === 'varejo') {
    return <StoreOrdersModuleRetail store={store} />
  }
  return <StoreOrdersModuleFood store={store} />
}

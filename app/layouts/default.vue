<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#conteudo"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-inverted"
    >
      Pular para o conteúdo
    </a>
    <LayoutAppHeader />
    <main id="conteudo" class="flex-1 pb-16 md:pb-0">
      <slot />
    </main>
    <LayoutAppFooter class="hidden md:block" />
    <LayoutBottomNav />
  </div>
</template>

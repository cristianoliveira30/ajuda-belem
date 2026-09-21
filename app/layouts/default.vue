<template>
  <div class="flex min-h-screen flex-col">
    <LayoutAppHeader />
    <main class="flex-1 pb-16 md:pb-0">
      <slot />
    </main>
    <LayoutAppFooter class="hidden md:block" />
    <LayoutBottomNav />
  </div>
</template>

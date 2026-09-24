<script setup lang="ts">
import { KeyIcon } from '@heroicons/vue/24/outline'

import { OPENWEATHER_SIGN_UP_URL } from '@/config/constants'
</script>

<template>
  <section
    aria-labelledby="missing-key-title"
    class="mx-auto mt-6 max-w-xl rounded-[28px] bg-surface-high p-6 shadow-elevation-3 sm:mt-10 sm:p-8"
  >
    <KeyIcon class="size-6 text-secondary" aria-hidden="true" />
    <h2 id="missing-key-title" class="mt-4 text-2xl font-normal">
      Configure a chave da OpenWeatherMap
    </h2>
    <p class="mt-3 text-sm text-on-surface-variant">
      O painel precisa de uma chave de API para buscar os dados. Crie uma conta gratuita, copie a
      chave e adicione-a ao arquivo
      <code class="rounded bg-surface-highest px-1 font-mono">.env</code> na raiz do projeto.
      Depois, reinicie o servidor de desenvolvimento.
    </p>
    <pre
      class="mt-4 overflow-x-auto rounded-2xl bg-surface-container p-4 font-mono text-sm leading-relaxed"
    ><span class="text-on-surface-variant"># .env</span>
<span class="text-primary">VITE_OPENWEATHER_API_KEY</span>=sua_chave_aqui</pre>
    <div class="mt-6 flex justify-end">
      <a
        :href="OPENWEATHER_SIGN_UP_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="state-layer focus-ring flex h-10 items-center rounded-full bg-primary px-6 text-sm font-medium text-on-primary"
      >
        Criar conta gratuita
      </a>
    </div>
  </section>
</template>

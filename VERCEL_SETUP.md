# 🚀 Configuração Vercel - AloClínica

## ⚠️ IMPORTANTE - Configurar Variáveis de Ambiente

Para que o site funcione corretamente em **produção**, você precisa configurar as variáveis de ambiente no painel do Vercel.

### 🔧 Passos para Configurar:

1. **Acesse o Dashboard Vercel:**
   - https://vercel.com/dashboard
   - Selecione o projeto **allo-medico-care**

2. **Vá em Settings:**
   - Clique em **Settings** (engrenagem no topo)
   - Selecione **Environment Variables**

3. **Adicione as seguintes variáveis:**

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | `https://oaixgmuocuwhsabidpei.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc` |
| `VITE_APP_URL` | `https://aloclinica.com.br` |

4. **Salve as variáveis** (botão "Save")

5. **Redeploy o projeto:**
   - Vá em **Deployments**
   - Clique no deployment mais recente
   - Clique em **Redeploy** (botão com 3 pontos)
   - Selecione **Redeploy** novamente

---

## ✅ Verificar se Funcionou:

Após redeploy, acesse:
- **Production:** https://aloclinica.com.br
- Deve carregar sem erros 500

Se ainda tiver erro 500:
- Verifique se as variáveis foram salvas corretamente
- Aguarde 2-3 minutos para o redeploy completar
- Limpe cache do navegador (Ctrl+Shift+Delete)

---

## 📝 Notas de Segurança:

- ⚠️ **NÃO** commit `.env.local` no repositório (já está em .gitignore)
- ⚠️ **NUNCA** exponha as chaves em repositórios públicos
- ✅ As variáveis estão seguras apenas no painel do Vercel

---

## 🔗 Links Úteis:

- [Vercel Environment Variables Docs](https://vercel.com/docs/environment-variables)
- [Supabase API Keys](https://app.supabase.com/project/oaixgmuocuwhsabidpei/settings/api)
- [AloClínica Production](https://aloclinica.com.br)

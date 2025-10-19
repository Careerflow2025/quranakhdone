#!/bin/bash
# Quick diagnostic script to check authentication system status

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║           QuranAkh Authentication System Diagnostic                ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

echo "🔍 Running comprehensive checks..."
echo ""

# Check 1: Environment variables
echo "1️⃣  Environment Variables"
echo "────────────────────────────────────────────────────────────────────"
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL is MISSING"
else
  echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is MISSING"
else
  echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY is MISSING ⚠️  CRITICAL!"
  echo "   → This is required for school registration!"
  echo "   → Add it to Netlify environment variables"
else
  echo "✅ SUPABASE_SERVICE_ROLE_KEY is set"
fi
echo ""

# Check 2: Database connection
echo "2️⃣  Database Connection"
echo "────────────────────────────────────────────────────────────────────"
if command -v node &> /dev/null; then
  node verify-database-schema.js 2>&1 | grep -E "(✅|❌|⚠️)" | head -15
else
  echo "⚠️  Node.js not found, cannot test database"
fi
echo ""

# Check 3: Authentication diagnostics
echo "3️⃣  Authentication System"
echo "────────────────────────────────────────────────────────────────────"
if command -v node &> /dev/null; then
  node diagnose-auth.js 2>&1 | grep -E "(✅|❌|⚠️|→)" | head -20
else
  echo "⚠️  Node.js not found, cannot test authentication"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                          QUICK SUMMARY                             ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "🔴 ACTION REQUIRED:"
  echo "   Add SUPABASE_SERVICE_ROLE_KEY to Netlify environment variables"
  echo ""
  echo "   1. Go to Supabase Dashboard → Settings → API"
  echo "   2. Copy the Service Role Key (keep it secret!)"
  echo "   3. Go to Netlify → Site Settings → Environment Variables"
  echo "   4. Add: SUPABASE_SERVICE_ROLE_KEY = (your key)"
  echo "   5. Redeploy the site"
  echo ""
  echo "📖 For detailed instructions, see: QUICK_FIX.md"
else
  echo "✅ All environment variables are set!"
  echo "   The authentication system should be working."
  echo ""
  echo "   Try:"
  echo "   - Register a school at /register-school"
  echo "   - Log in at /login"
  echo ""
  echo "   If issues persist, check diagnose-auth.js output above."
fi

echo ""
echo "════════════════════════════════════════════════════════════════════"

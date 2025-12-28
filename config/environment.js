// Environment configuration checker
function checkEnvironment() {
  const required = [
    'WHATSAPP_TOKEN',
    'PHONE_NUMBER_ID',
    'VERIFY_TOKEN',
    'OPENROUTER_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n💡 Copy .env.example to .env and fill in your credentials.');
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

module.exports = { checkEnvironment };

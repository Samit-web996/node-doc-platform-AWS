const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const loadSecrets = async () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-south-1' });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: 'prod/doc-platform/config'
      })
    );

    if (response.SecretString) {
      const secrets = JSON.parse(response.SecretString);
      Object.keys(secrets).forEach((key) => {
        process.env[key] = secrets[key];
      });
      console.log('Secrets successfully loaded into memory from AWS Secrets Manager');
    }
  } catch (error) {
    console.error('Error fetching secrets from AWS Secrets Manager:', error.message);
    process.exit(1);
  }
};

module.exports = { loadSecrets };
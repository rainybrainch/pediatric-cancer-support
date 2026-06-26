exports.handler = async (event) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const keyLength = apiKey ? apiKey.length : 0;
  const keyPreview = apiKey ? apiKey.slice(0, 5) + '...' + apiKey.slice(-5) : 'NOT SET';
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      apiKeySet: !!apiKey,
      keyLength: keyLength,
      keyPreview: keyPreview,
      timestamp: new Date().toISOString()
    })
  };
};

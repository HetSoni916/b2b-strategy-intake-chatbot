import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not defined in .env file!');
  process.exit(1);
}

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}...`);
    const model = ai.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say hello back to test the connection!');
    console.log(`SUCCESS with ${modelName}! Response:`, result.response.text().trim());
    return true;
  } catch (err) {
    console.error(`FAIL with ${modelName}:`, err.message);
    return false;
  }
}

async function run() {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];
  for (const m of models) {
    const success = await testModel(m);
    if (success) {
      console.log(`\nFound working model: ${m}`);
      process.exit(0);
    }
  }
  console.error('\nAll model names failed. Please check if your Gemini key is a valid Gemini key or if there are billing/regional restrictions.');
}

run();

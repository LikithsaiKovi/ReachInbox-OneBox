import fetch from 'node-fetch';
import { updateEmailCategory } from './indexer';
import { triggerIntegrations } from './integrations';

const LLM_URL = process.env.LLM_API_URL || 'https://api.openai.com/v1/completions';
const LLM_API_KEY = process.env.LLM_API_KEY;
const EMBEDDINGS_URL = process.env.LLM_EMBEDDINGS_URL || 'https://api.openai.com/v1/embeddings';

export type EmailCategory = 'Interested' | 'Meeting Booked' | 'Not Interested' | 'Spam' | 'Out of Office';

const systemPrompt = `You are an expert email classifier for a sales team. Analyze the email content and classify it into one of these categories:

1. "Interested" - The sender shows genuine interest in your product/service, asks questions, requests more information, or shows buying intent
2. "Meeting Booked" - The sender has scheduled or confirmed a meeting, call, or demo
3. "Not Interested" - The sender explicitly declines, says no thanks, or shows no interest
4. "Spam" - Promotional emails, newsletters, automated messages, or irrelevant content
5. "Out of Office" - Automated out-of-office replies or vacation messages

Return ONLY the category name as a single word/phrase. No explanations or additional text.`;

export async function categorizeEmailText(text: string): Promise<EmailCategory> {
  if (!LLM_API_KEY) {
    console.warn('No LLM API key provided, using default category');
    return 'Not Interested';
  }

  try {
    const emailText = text.substring(0, 4000); // Limit text length for API
    
    const requestBody = {
      model: 'gpt-3.5-turbo-instruct',
      prompt: `${systemPrompt}\n\nEmail to classify:\n\n${emailText}\n\nCategory:`,
      max_tokens: 10,
      temperature: 0.1,
      stop: ['\n', '.', '!', '?']
    };

    const response = await fetch(LLM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as any;
    const rawCategory = result?.choices?.[0]?.text?.trim() || result?.output?.trim() || '';
    
    // Parse and validate category
    const validCategories: EmailCategory[] = ['Interested', 'Meeting Booked', 'Not Interested', 'Spam', 'Out of Office'];
    
    for (const category of validCategories) {
      if (rawCategory.toLowerCase().includes(category.toLowerCase())) {
        return category;
      }
    }

    // Fallback to "Not Interested" if no valid category found
    console.warn(`Invalid category returned: "${rawCategory}", defaulting to "Not Interested"`);
    return 'Not Interested';

  } catch (error) {
    console.error('Error categorizing email:', error);
    return 'Not Interested';
  }
}

export async function categorizeAndUpdate(id: string, doc: any): Promise<void> {
  try {
    const emailText = `${doc.subject || ''}\n\n${doc.body || ''}`;
    const category = await categorizeEmailText(emailText);
    
    // Update the email category in Elasticsearch
    await updateEmailCategory(id, category);
    
    console.log(`Categorized email ${id} as: ${category}`);
    
    // Trigger integrations if email is marked as "Interested"
    if (category === 'Interested') {
      await triggerIntegrations({
        ...doc,
        aiCategory: category
      });
    }
    
  } catch (error) {
    console.error(`Error categorizing and updating email ${id}:`, error);
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (!LLM_API_KEY) {
    throw new Error('No LLM API key provided for embeddings');
  }

  try {
    const requestBody = {
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000) // Limit text length
    };

    const response = await fetch(EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Embeddings API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as any;
    return result?.data?.[0]?.embedding || [];
    
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

export async function generateReply(emailText: string, context: string[]): Promise<string> {
  if (!LLM_API_KEY) {
    return 'Thank you for your email. I will get back to you soon.';
  }

  try {
    const systemPrompt = `You are a professional sales assistant. Generate a helpful, personalized reply based on the provided context and email content. Keep the reply concise (2-3 sentences) and professional.`;

    const contextText = context.length > 0 ? `\n\nRelevant context:\n${context.join('\n\n')}` : '';
    
    const requestBody = {
      model: 'gpt-3.5-turbo-instruct',
      prompt: `${systemPrompt}${contextText}\n\nEmail to reply to:\n\n${emailText}\n\nReply:`,
      max_tokens: 200,
      temperature: 0.3
    };

    const response = await fetch(LLM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as any;
    const reply = result?.choices?.[0]?.text?.trim() || 'Thank you for your email. I will get back to you soon.';
    
    return reply;
    
  } catch (error) {
    console.error('Error generating reply:', error);
    return 'Thank you for your email. I will get back to you soon.';
  }
}

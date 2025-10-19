import { QdrantClient } from '@qdrant/js-client-rest';
import { getEmbedding, generateReply } from './categorizer';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'email_context';

let qdrantClient: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({ url: QDRANT_URL });
  }
  return qdrantClient;
}

export async function ensureQdrantCollection(): Promise<void> {
  try {
    const client = getQdrantClient();
    
    // Check if collection exists
    const collections = await client.getCollections();
    const collectionExists = collections.collections.some(col => col.name === COLLECTION_NAME);
    
    if (!collectionExists) {
      console.log('Creating Qdrant collection for email context...');
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 1536, // OpenAI ada-002 embedding size
          distance: 'Cosine'
        }
      });
      console.log('Qdrant collection created successfully');
    } else {
      console.log('Qdrant collection already exists');
    }
  } catch (error) {
    console.error('Error ensuring Qdrant collection:', error);
    throw error;
  }
}

export async function addEmailToVectorStore(emailData: {
  id: string;
  subject: string;
  body: string;
  from: string;
  category?: string;
}): Promise<void> {
  try {
    const client = getQdrantClient();
    
    // Create text for embedding (combine subject and body)
    const text = `${emailData.subject}\n\n${emailData.body}`;
    
    // Get embedding for the email content
    const embedding = await getEmbedding(text);
    
    if (embedding.length === 0) {
      console.warn(`No embedding generated for email ${emailData.id}`);
      return;
    }
    
    // Store in Qdrant
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: emailData.id,
          vector: embedding,
          payload: {
            subject: emailData.subject,
            body: emailData.body,
            from: emailData.from,
            category: emailData.category || 'Uncategorized',
            timestamp: new Date().toISOString()
          }
        }
      ]
    });
    
    console.log(`Email ${emailData.id} added to vector store`);
  } catch (error) {
    console.error(`Error adding email ${emailData.id} to vector store:`, error);
    throw error;
  }
}

export async function searchSimilarEmails(query: string, limit: number = 5): Promise<any[]> {
  try {
    const client = getQdrantClient();
    
    // Get embedding for the query
    const queryEmbedding = await getEmbedding(query);
    
    if (queryEmbedding.length === 0) {
      console.warn('No embedding generated for query');
      return [];
    }
    
    // Search for similar emails
    const searchResult = await client.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
      score_threshold: 0.7 // Only return results with similarity > 0.7
    });
    
    return searchResult.map(result => ({
      id: result.id,
      score: result.score,
      subject: result.payload?.subject,
      body: result.payload?.body,
      from: result.payload?.from,
      category: result.payload?.category
    }));
  } catch (error) {
    console.error('Error searching similar emails:', error);
    throw error;
  }
}

export async function generateSuggestedReply(emailId: string, emailText: string): Promise<string> {
  try {
    // Search for similar emails to use as context
    const similarEmails = await searchSimilarEmails(emailText, 3);
    
    // Extract context from similar emails
    const context = similarEmails.map(email => 
      `Subject: ${email.subject}\nFrom: ${email.from}\nContent: ${email.body?.substring(0, 200)}...`
    );
    
    // Generate reply using LLM with context
    const reply = await generateReply(emailText, context);
    
    return reply;
  } catch (error) {
    console.error(`Error generating suggested reply for email ${emailId}:`, error);
    return 'Thank you for your email. I will get back to you soon.';
  }
}

export async function addTrainingData(texts: string[], metadata: any[] = []): Promise<void> {
  try {
    const client = getQdrantClient();
    
    const points = [];
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const meta = metadata[i] || {};
      
      // Get embedding for the text
      const embedding = await getEmbedding(text);
      
      if (embedding.length === 0) {
        console.warn(`No embedding generated for training text ${i}`);
        continue;
      }
      
      points.push({
        id: `training_${Date.now()}_${i}`,
        vector: embedding,
        payload: {
          text,
          type: 'training',
          ...meta,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (points.length > 0) {
      await client.upsert(COLLECTION_NAME, {
        wait: true,
        points
      });
      
      console.log(`Added ${points.length} training examples to vector store`);
    }
  } catch (error) {
    console.error('Error adding training data:', error);
    throw error;
  }
}

export async function getVectorStoreStats(): Promise<any> {
  try {
    const client = getQdrantClient();
    
    const collectionInfo = await client.getCollection(COLLECTION_NAME);
    
    return {
      collectionName: COLLECTION_NAME,
      pointsCount: collectionInfo.points_count,
      vectorsCount: collectionInfo.vectors_count,
      status: collectionInfo.status,
      config: collectionInfo.config
    };
  } catch (error) {
    console.error('Error getting vector store stats:', error);
    throw error;
  }
}

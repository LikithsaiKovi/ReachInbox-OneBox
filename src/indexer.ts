import { Client } from '@elastic/elasticsearch';
import { EmailData } from './imapClient';
import { categorizeAndUpdate } from './categorizer';

const es = new Client({ 
  node: process.env.ES_URL || 'http://localhost:9200',
  auth: undefined // No authentication for local development
});

export async function ensureIndex(): Promise<void> {
  try {
    const exists = await es.indices.exists({ index: 'emails' });
    
    if (!exists) {
      console.log('Creating emails index...');
      await es.indices.create({
        index: 'emails',
        body: {
          mappings: {
            properties: {
              subject: { 
                type: 'text',
                analyzer: 'standard'
              },
              body: { 
                type: 'text',
                analyzer: 'standard'
              },
              accountId: { type: 'keyword' },
              folder: { type: 'keyword' },
              date: { type: 'date' },
              aiCategory: { type: 'keyword' },
              indexedAt: { type: 'date' },
              from: { type: 'keyword' },
              to: { type: 'keyword' },
              messageId: { type: 'keyword' }
            }
          },
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          }
        }
      });
      console.log('Emails index created successfully');
    } else {
      console.log('Emails index already exists');
    }
  } catch (error) {
    console.error('Error ensuring index:', error);
    throw error;
  }
}

export async function indexEmail(doc: EmailData): Promise<void> {
  try {
    const id = doc.id;
    const indexDoc = {
      ...doc,
      indexedAt: new Date(),
      aiCategory: 'Uncategorized' // Will be updated after categorization
    };

    // Store email in Elasticsearch
    await es.index({ 
      index: 'emails', 
      id, 
      body: indexDoc 
    });

    console.log(`Email indexed successfully: ${doc.subject}`);
    
    // Trigger categorization in background (non-blocking)
    categorizeAndUpdate(id, indexDoc).catch(error => {
      console.error(`Error categorizing email ${id}:`, error);
    });

  } catch (error) {
    console.error('Error indexing email:', error);
    throw error;
  }
}

export async function searchEmails(query: {
  q?: string;
  account?: string;
  folder?: string;
  page?: number;
  size?: number;
  category?: string;
}): Promise<any> {
  try {
    const { q = '', account, folder, page = 0, size = 20, category } = query;
    
    const searchQuery: any = {
      index: 'emails',
      body: {
        from: page * size,
        size,
        sort: [
          { date: { order: 'desc' } }
        ],
        query: {
          bool: {
            must: [],
            filter: []
          }
        }
      }
    };

    // Add text search if query provided
    if (q) {
      searchQuery.body.query.bool.must.push({
        multi_match: {
          query: q,
          fields: ['subject^2', 'body', 'from'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    } else {
      searchQuery.body.query.bool.must.push({ match_all: {} });
    }

    // Add filters
    if (account) {
      searchQuery.body.query.bool.filter.push({ 
        term: { accountId: account } 
      });
    }
    
    if (folder) {
      searchQuery.body.query.bool.filter.push({ 
        term: { folder } 
      });
    }
    
    if (category) {
      searchQuery.body.query.bool.filter.push({ 
        term: { aiCategory: category } 
      });
    }

    const response = await es.search(searchQuery);
    return response.body;
  } catch (error) {
    console.error('Error searching emails:', error);
    throw error;
  }
}

export async function getEmailById(id: string): Promise<any> {
  try {
    const response = await es.get({ 
      index: 'emails', 
      id 
    });
    return response.body._source;
  } catch (error) {
    console.error(`Error getting email ${id}:`, error);
    throw error;
  }
}

export async function updateEmailCategory(id: string, category: string): Promise<void> {
  try {
    await es.update({ 
      index: 'emails', 
      id, 
      body: { 
        doc: { 
          aiCategory: category,
          updatedAt: new Date()
        } 
      } 
    });
    console.log(`Updated email ${id} category to ${category}`);
  } catch (error) {
    console.error(`Error updating email ${id} category:`, error);
    throw error;
  }
}

export async function getEmailStats(): Promise<any> {
  try {
    const response = await es.search({
      index: 'emails',
      body: {
        size: 0,
        aggs: {
          by_category: {
            terms: {
              field: 'aiCategory',
              size: 10
            }
          },
          by_account: {
            terms: {
              field: 'accountId',
              size: 10
            }
          },
          total_emails: {
            value_count: {
              field: 'id'
            }
          }
        }
      }
    });

    return {
      totalEmails: response.body.aggregations.total_emails.value,
      byCategory: response.body.aggregations.by_category.buckets,
      byAccount: response.body.aggregations.by_account.buckets
    };
  } catch (error) {
    console.error('Error getting email stats:', error);
    throw error;
  }
}

export { es };

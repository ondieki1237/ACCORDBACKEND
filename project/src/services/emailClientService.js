import Imap from 'imap';
import { simpleParser } from 'mailparser';
import logger from '../utils/logger.js';

/**
 * Email Client Service - Handles IMAP operations for reading emails
 * Connects to mail server and manages email retrieval
 */
export class EmailClientService {
  constructor(email, password, imapServer, imapPort) {
    this.email = email;
    this.password = password;
    this.imapServer = imapServer || process.env.EMAIL_IMAP_SERVER || 'mail.astermedsupplies.co.ke';
    this.imapPort = imapPort || parseInt(process.env.EMAIL_IMAP_PORT) || 993;
    this.imap = null;
    this.connected = false;
  }

  /**
   * Initialize IMAP connection
   */
  async connect() {
    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.email,
        password: this.password,
        host: this.imapServer,
        port: this.imapPort,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      // Log connection attempt
      logger.info(`[${this.email}] Attempting IMAP connection to ${this.imapServer}:${this.imapPort}`);

      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          logger.error(`[${this.email}] IMAP authentication failed:`, {
            error: err.message,
            code: err.code,
            fullError: err.toString()
          });
          reject(new Error(`IMAP Auth Error: ${err.message}`));
        } else {
          this.connected = true;
          logger.info(`[${this.email}] Connected to IMAP successfully`);
          resolve(box);
        }
      });

      this.imap.error = (err) => {
        logger.error(`[${this.email}] IMAP error:`, err.message);
        this.connected = false;
      };

      this.imap.closeBox((err) => {
        if (err) logger.warn(`[${this.email}] IMAP close warning:`, err.message);
      });
    });
  }

  /**
   * Fetch inbox emails with pagination
   * @param {number} limit - Number of emails to fetch
   * @param {number} offset - Pagination offset
   * @returns {Promise<Array>} Array of email summaries
   */
  async fetchInbox(limit = 20, offset = 0) {
    try {
      if (!this.connected) await this.connect();

      return new Promise((resolve, reject) => {
        const emails = [];

        this.imap.search(['ALL'], (err, results) => {
          if (err) {
            logger.error(`[${this.email}] IMAP search error:`, err.message);
            return reject(err);
          }

          if (!results || results.length === 0) {
            return resolve([]);
          }

          // Get most recent emails first (reverse order)
          const totalCount = results.length;
          const uids = results
            .reverse()
            .slice(offset, offset + limit);

          if (uids.length === 0) {
            return resolve({ emails: [], total: totalCount, page: Math.ceil(offset / limit) + 1, pages: Math.ceil(totalCount / limit) });
          }

          const f = this.imap.fetch(uids, { bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)' });

          f.on('message', (msg, seqno) => {
            let uid = null;

            msg.on('attributes', (attrs) => {
              uid = attrs.uid;
            });

            msg.on('body', (stream) => {
              simpleParser(stream, {}, async (err, parsed) => {
                if (parsed) {
                  const email = {
                    uid: uid,
                    from: parsed.from?.text || parsed.from?.email || 'Unknown',
                    fromName: parsed.from?.name || 'Unknown',
                    to: parsed.to?.text || '',
                    subject: parsed.subject || '(No Subject)',
                    date: parsed.date || new Date(),
                    preview: parsed.text?.substring(0, 150) || '',
                    isRead: !parsed.flags?.includes('\\Unseen')
                  };
                  emails.push(email);
                }
              });
            });

            msg.once('attributes', (attrs) => {
              uid = attrs.uid;
            });
          });

          f.once('error', (err) => {
            logger.error(`[${this.email}] Fetch error:`, err.message);
            reject(err);
          });

          f.once('end', () => {
            // Sort by date, newest first
            emails.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve({
              emails,
              total: totalCount,
              page: Math.floor(offset / limit) + 1,
              pages: Math.ceil(totalCount / limit)
            });
          });
        });
      });
    } catch (error) {
      logger.error(`[${this.email}] fetchInbox error:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch single email details with full content
   * @param {number} uid - Email UID
   * @returns {Promise<Object>} Full email details
   */
  async fetchEmail(uid) {
    try {
      if (!this.connected) await this.connect();

      return new Promise((resolve, reject) => {
        const f = this.imap.fetch(uid, { bodies: '' });

        f.on('message', (msg) => {
          simpleParser(msg, {}, async (err, parsed) => {
            if (err) {
              logger.error(`[${this.email}] Parse error for UID ${uid}:`, err.message);
              return reject(err);
            }

            const email = {
              uid: uid,
              from: parsed.from?.text || parsed.from?.email || '',
              fromName: parsed.from?.name || 'Unknown',
              to: (parsed.to?.map(t => t.address) || []).join(', '),
              cc: (parsed.cc?.map(c => c.address) || []).join(', '),
              subject: parsed.subject || '(No Subject)',
              date: parsed.date || new Date(),
              html: parsed.html || '',
              text: parsed.text || '',
              attachments: (parsed.attachments || []).map(att => ({
                filename: att.filename,
                contentType: att.contentType,
                size: att.size,
                contentId: att.contentId
              }))
            };

            resolve(email);
          });
        });

        f.once('error', (err) => {
          logger.error(`[${this.email}] Fetch error for UID ${uid}:`, err.message);
          reject(err);
        });
      });
    } catch (error) {
      logger.error(`[${this.email}] fetchEmail error:`, error.message);
      throw error;
    }
  }

  /**
   * Mark email as read
   * @param {number} uid - Email UID
   */
  async markAsRead(uid) {
    try {
      if (!this.connected) await this.connect();

      return new Promise((resolve, reject) => {
        this.imap.setFlags(uid, ['\\Seen'], (err) => {
          if (err) {
            logger.error(`[${this.email}] Cannot mark as read UID ${uid}:`, err.message);
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error(`[${this.email}] markAsRead error:`, error.message);
      throw error;
    }
  }

  /**
   * Mark email as unread
   * @param {number} uid - Email UID
   */
  async markAsUnread(uid) {
    try {
      if (!this.connected) await this.connect();

      return new Promise((resolve, reject) => {
        this.imap.setFlags(uid, ['\\Unseen'], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error(`[${this.email}] markAsUnread error:`, error.message);
      throw error;
    }
  }

  /**
   * Delete email (move to trash/mark deleted)
   * @param {number} uid - Email UID
   */
  async deleteEmail(uid) {
    try {
      if (!this.connected) await this.connect();

      return new Promise((resolve, reject) => {
        this.imap.setFlags(uid, ['\\Deleted'], (err) => {
          if (err) {
            logger.error(`[${this.email}] Cannot delete UID ${uid}:`, err.message);
            reject(err);
          } else {
            this.imap.expunge((err2) => {
              if (err2) {
                logger.error(`[${this.email}] Expunge error after delete:`, err2.message);
                reject(err2);
              } else {
                resolve(true);
              }
            });
          }
        });
      });
    } catch (error) {
      logger.error(`[${this.email}] deleteEmail error:`, error.message);
      throw error;
    }
  }

  /**
   * Get list of mail folders
   */
  async getFolders() {
    try {
      return new Promise((resolve, reject) => {
        this.imap.getBoxes((err, boxes) => {
          if (err) {
            logger.error(`[${this.email}] Cannot get folders:`, err.message);
            reject(err);
          } else {
            const folders = [];
            const processBoxes = (boxes, parent = '') => {
              for (const [key, box] of Object.entries(boxes)) {
                const fullName = parent ? `${parent}${box.delimiter}${key}` : key;
                folders.push({
                  name: fullName,
                  displayName: key,
                  unread: 0,
                  total: 0,
                  children: []
                });
                if (box.children) {
                  processBoxes(box.children, fullName);
                }
              }
            };
            processBoxes(boxes);
            resolve(folders);
          }
        });
      });
    } catch (error) {
      logger.error(`[${this.email}] getFolders error:`, error.message);
      throw error;
    }
  }

  /**
   * Search emails
   * @param {Object} options - Search options {from, subject, since, body}
   */
  async searchEmails(options = {}) {
    try {
      if (!this.connected) await this.connect();

      return new Promise((resolve, reject) => {
        const searchCriteria = ['ALL'];

        if (options.from) searchCriteria.push(['FROM', options.from]);
        if (options.subject) searchCriteria.push(['SUBJECT', options.subject]);
        if (options.body) searchCriteria.push(['BODY', options.body]);
        if (options.since) {
          const sinceDate = new Date(options.since);
          searchCriteria.push(['SINCE', sinceDate.toISOString().split('T')[0]]);
        }
        if (options.unseen) searchCriteria.push(['UNSEEN']);

        this.imap.search(searchCriteria, (err, results) => {
          if (err) {
            logger.error(`[${this.email}] Search error:`, err.message);
            reject(err);
          } else {
            resolve(results || []);
          }
        });
      });
    } catch (error) {
      logger.error(`[${this.email}] searchEmails error:`, error.message);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount() {
    try {
      return new Promise((resolve, reject) => {
        this.imap.search(['UNSEEN'], (err, results) => {
          if (err) reject(err);
          else resolve(results?.length || 0);
        });
      });
    } catch (error) {
      logger.error(`[${this.email}] getUnreadCount error:`, error.message);
      throw error;
    }
  }

  /**
   * Close IMAP connection
   */
  disconnect() {
    if (this.imap && this.connected) {
      this.imap.closeBox((err) => {
        if (err) logger.warn(`[${this.email}] Close error:`, err.message);
        this.imap.end();
        this.connected = false;
      });
    }
  }
}

export default EmailClientService;

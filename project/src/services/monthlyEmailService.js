import nodemailer from 'nodemailer';
import Sale from '../models/Sale.js';
import Order from '../models/Order.js';
import Lead from '../models/Lead.js';
import Visit from '../models/Visit.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Monthly Email Service
 * Generates and sends monthly sales reports to the sales team
 */

export class MonthlyEmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Get sales data for a specific month
   * @param {Date} startDate - Month start date
   * @param {Date} endDate - Month end date
   * @returns {Promise<Object>} Sales summary for the month
   */
  async getSalesData(startDate, endDate) {
    try {
      // Total sales revenue
      const sales = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$price' },
            totalSales: { $sum: 1 },
            avgSaleValue: { $avg: '$price' }
          }
        }
      ]);

      return sales.length > 0 ? sales[0] : { totalRevenue: 0, totalSales: 0, avgSaleValue: 0 };
    } catch (error) {
      logger.error('Error getting sales data:', error);
      return { totalRevenue: 0, totalSales: 0, avgSaleValue: 0 };
    }
  }

  /**
   * Get orders data for a specific month
   */
  async getOrdersData(startDate, endDate) {
    try {
      const orders = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalOrderValue: { $sum: '$totalAmount' },
            completedOrders: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            }
          }
        }
      ]);

      return orders.length > 0 
        ? orders[0] 
        : { totalOrders: 0, totalOrderValue: 0, completedOrders: 0 };
    } catch (error) {
      logger.error('Error getting orders data:', error);
      return { totalOrders: 0, totalOrderValue: 0, completedOrders: 0 };
    }
  }

  /**
   * Get leads data for a specific month
   */
  async getLeadsData(startDate, endDate) {
    try {
      const leads = await Lead.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            hotLeads: {
              $sum: {
                $cond: [{ $eq: ['$status', 'hot'] }, 1, 0]
              }
            },
            warmLeads: {
              $sum: {
                $cond: [{ $eq: ['$status', 'warm'] }, 1, 0]
              }
            },
            coldLeads: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cold'] }, 1, 0]
              }
            },
            convertedLeads: {
              $sum: {
                $cond: [{ $eq: ['$status', 'converted'] }, 1, 0]
              }
            }
          }
        }
      ]);

      return leads.length > 0
        ? leads[0]
        : { totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0, convertedLeads: 0 };
    } catch (error) {
      logger.error('Error getting leads data:', error);
      return { totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0, convertedLeads: 0 };
    }
  }

  /**
   * Get visits data for a specific month
   */
  async getVisitsData(startDate, endDate) {
    try {
      const visits = await Visit.aggregate([
        {
          $match: {
            visitDate: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalVisits: { $sum: 1 },
            successfulVisits: {
              $sum: {
                $cond: [{ $eq: ['$visitStatus', 'successful'] }, 1, 0]
              }
            },
            pendingVisits: {
              $sum: {
                $cond: [{ $eq: ['$visitStatus', 'pending'] }, 1, 0]
              }
            }
          }
        }
      ]);

      return visits.length > 0
        ? visits[0]
        : { totalVisits: 0, successfulVisits: 0, pendingVisits: 0 };
    } catch (error) {
      logger.error('Error getting visits data:', error);
      return { totalVisits: 0, successfulVisits: 0, pendingVisits: 0 };
    }
  }

  /**
   * Get top performers for the month
   */
  async getTopPerformers(startDate, endDate, limit = 5) {
    try {
      const performers = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lt: endDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalRevenue: { $sum: '$price' },
            totalSales: { $sum: 1 }
          }
        },
        {
          $sort: { totalRevenue: -1 }
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: 1,
            totalRevenue: 1,
            totalSales: 1,
            name: '$user.fullName',
            email: '$user.email',
            role: '$user.role'
          }
        }
      ]);

      return performers;
    } catch (error) {
      logger.error('Error getting top performers:', error);
      return [];
    }
  }

  /**
   * Get all sales team users
   */
  async getSalesTeamUsers() {
    try {
      const salesTeam = await User.find({
        role: { $in: ['sales', 'engineer', 'accountant', 'planner'] },
        isActive: true
      }).select('email fullName role');

      return salesTeam;
    } catch (error) {
      logger.error('Error getting sales team users:', error);
      return [];
    }
  }

  /**
   * Generate HTML email template
   */
  generateEmailHTML(monthName, data) {
    const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const currentDate = new Date().toLocaleDateString('en-US');

    const safeNum = (num) => (num || 0).toLocaleString('en-KE');
    const safeMoney = (amt) => `KES ${(amt || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
            .content { background: white; padding: 30px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: 600; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px; }
            .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
            .metric { background: #f0f4ff; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; }
            .metric-value { font-size: 24px; font-weight: 700; color: #667eea; }
            .metric-label { font-size: 12px; color: #666; margin-top: 5px; text-transform: uppercase; }
            .top-performers { margin-top: 15px; }
            .performer { background: #f9f9f9; padding: 12px; border-radius: 4px; margin-bottom: 10px; border-left: 3px solid #667eea; }
            .performer-name { font-weight: 600; color: #333; }
            .performer-stats { font-size: 13px; color: #666; margin-top: 5px; }
            .footer { background: #f0f4ff; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #666; }
            .highlight { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ffc107; }
            .badge { display: inline-block; background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-right: 5px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Monthly Sales Report</h1>
                <p>${monthYear} | Generated on ${currentDate}</p>
            </div>

            <div class="content">
                <p>Dear Sales Team,</p>
                <p>Here is your comprehensive performance report for <strong>${monthYear}</strong>. This summary highlights key metrics, achievements, and top performers for the month.</p>

                <!-- Sales Section -->
                <div class="section">
                    <div class="section-title">💼 Sales Performance</div>
                    <div class="metrics">
                        <div class="metric">
                            <div class="metric-value">${safeNum(data.salesData.totalRevenue)}</div>
                            <div class="metric-label">Total Sales Count</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${safeMoney(data.salesData.totalRevenue)}</div>
                            <div class="metric-label">Total Revenue</div>
                        </div>
                    </div>
                    <p><strong>Average Sale Value:</strong> ${safeMoney(data.salesData.avgSaleValue)}</p>
                </div>

                <!-- Orders Section -->
                <div class="section">
                    <div class="section-title">📦 Orders</div>
                    <div class="metrics">
                        <div class="metric">
                            <div class="metric-value">${safeNum(data.ordersData.totalOrders)}</div>
                            <div class="metric-label">Total Orders</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${safeNum(data.ordersData.completedOrders)}</div>
                            <div class="metric-label">Completed Orders</div>
                        </div>
                    </div>
                    <p><strong>Order Value:</strong> ${safeMoney(data.ordersData.totalOrderValue)}</p>
                </div>

                <!-- Leads Section -->
                <div class="section">
                    <div class="section-title">🎲 Lead Generation</div>
                    <div class="metrics">
                        <div class="metric">
                            <div class="metric-value">${safeNum(data.leadsData.totalLeads)}</div>
                            <div class="metric-label">Total Leads</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${safeNum(data.leadsData.convertedLeads)}</div>
                            <div class="metric-label">Converted Leads</div>
                        </div>
                    </div>
                    <p>
                        <span class="badge">🔴 Hot: ${safeNum(data.leadsData.hotLeads)}</span>
                        <span class="badge">🟠 Warm: ${safeNum(data.leadsData.warmLeads)}</span>
                        <span class="badge">❄️ Cold: ${safeNum(data.leadsData.coldLeads)}</span>
                    </p>
                </div>

                <!-- Visits Section -->
                <div class="section">
                    <div class="section-title">🚀 Field Visits</div>
                    <div class="metrics">
                        <div class="metric">
                            <div class="metric-value">${safeNum(data.visitsData.totalVisits)}</div>
                            <div class="metric-label">Total Visits</div>
                        </div>
                        <div class="metric">
                            <div class="metric-value">${safeNum(data.visitsData.successfulVisits)}</div>
                            <div class="metric-label">Successful Visits</div>
                        </div>
                    </div>
                    <p>
                        Success Rate: <strong>${data.visitsData.totalVisits > 0 
                          ? ((data.visitsData.successfulVisits / data.visitsData.totalVisits) * 100).toFixed(1) 
                          : '0'}%</strong>
                    </p>
                </div>

                <!-- Top Performers -->
                <div class="section">
                    <div class="section-title">🏆 Top Performers</div>
                    <div class="top-performers">
                        ${data.topPerformers.length > 0 
                          ? data.topPerformers.map((performer, index) => `
                            <div class="performer">
                                <div class="performer-name">#${index + 1} ${performer.name}</div>
                                <div class="performer-stats">
                                    ${safeMoney(performer.totalRevenue)} | ${safeNum(performer.totalSales)} sales
                                </div>
                            </div>
                          `).join('')
                          : '<p>No sales data available for this period.</p>'
                        }
                    </div>
                </div>

                <!-- Highlight Box -->
                <div class="highlight">
                    <strong>📌 Key Insight:</strong> This month's performance shows strong engagement across all channels. 
                    Keep up the momentum! Focus on lead nurturing and visit follow-ups to maximize conversions.
                </div>

                <p style="margin-top: 30px; font-style: italic; color: #666;">
                    Thank you for your dedication to Accord Medical System. Together, we're building success.
                </p>
            </div>

            <div class="footer">
                <p>Accord Medical System | Monthly Performance Report</p>
                <p>This is an automated report. Please contact your manager for detailed insights.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Send monthly email to all sales team members
   * @param {number} month - Month number (1-12)
   * @param {number} year - Year (e.g., 2026)
   */
  async sendMonthlyEmail(month, year) {
    try {
      // Calculate date range
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      logger.info(`Generating monthly email for ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);

      // Fetch all data
      const [salesData, ordersData, leadsData, visitsData, topPerformers, salesTeam] = await Promise.all([
        this.getSalesData(startDate, endDate),
        this.getOrdersData(startDate, endDate),
        this.getLeadsData(startDate, endDate),
        this.getVisitsData(startDate, endDate),
        this.getTopPerformers(startDate, endDate),
        this.getSalesTeamUsers()
      ]);

      const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Generate email content
      const htmlContent = this.generateEmailHTML(monthName, {
        salesData,
        ordersData,
        leadsData,
        visitsData,
        topPerformers
      });

      // Send to all sales team members
      const emailResults = [];

      for (const user of salesTeam) {
        try {
          await this.transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: `📊 Accord Medical - ${monthName} Sales Report`,
            html: htmlContent
          });

          emailResults.push({
            user: user.fullName,
            email: user.email,
            status: 'sent',
            timestamp: new Date()
          });

          logger.info(`Monthly email sent to ${user.email}`);
        } catch (error) {
          logger.error(`Failed to send email to ${user.email}:`, error.message);
          emailResults.push({
            user: user.fullName,
            email: user.email,
            status: 'failed',
            error: error.message,
            timestamp: new Date()
          });
        }
      }

      return {
        success: true,
        month: monthName,
        dataPoints: {
          totalSales: salesData.totalSalesCount || 0,
          totalRevenue: salesData.totalRevenue || 0,
          totalOrders: ordersData.totalOrders || 0,
          totalLeads: leadsData.totalLeads || 0,
          totalVisits: visitsData.totalVisits || 0
        },
        recipientsCount: salesTeam.length,
        results: emailResults,
        sentCount: emailResults.filter(r => r.status === 'sent').length,
        failedCount: emailResults.filter(r => r.status === 'failed').length
      };
    } catch (error) {
      logger.error('Error sending monthly email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new MonthlyEmailService();

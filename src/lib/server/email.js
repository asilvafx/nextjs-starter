// lib/email.js
import { render } from '@react-email/render';
import nodemailer from 'nodemailer'; 

const emailFrom = process.env.NODEMAILER_USER;
const emailName = process.env.NEXT_PUBLIC_APP_NAME;
const emailPublic = process.env.NODEMAILER_EMAIL || process.env.NODEMAILER_USER || null;

// Nodemailer configuration
const nodeMailerConfig = {
    service: process.env.NODEMAILER_SERVICE || 'gmail',
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    }
};

// Support for custom SMTP configuration
if (process.env.NODEMAILER_HOST) {
    nodeMailerConfig.host = process.env.NODEMAILER_HOST;
    nodeMailerConfig.port = process.env.NODEMAILER_PORT || 587;
    nodeMailerConfig.secure = process.env.NODEMAILER_SECURE === 'true'; // true for 465, false for other ports
    delete nodeMailerConfig.service; // Remove service when using custom SMTP
}

const mailTransport = nodemailer.createTransport(nodeMailerConfig);

class EmailService {
    constructor() {
        this.fromEmail = emailFrom;
        this.fromName = emailName;
    }

    /**
     * Send email using Nodemailer
     * @param {string} to - Recipient email address
     * @param {string} subject - Email subject
     * @param {string} html - HTML content
     * @param {string} text - Plain text content
     * @returns {Promise} Nodemailer response
     */
    async sendEmailViaNodemailer(to, subject, html, text) {
        try {
            if (!mailTransport) {
                throw new Error('Nodemailer transport not initialized. Check your NODEMAILER environment variables.');
            }

            // Validate HTML is a string
            if (typeof html !== 'string') {
                throw new Error(`HTML content must be a string, received: ${typeof html}`);
            }

            if (!html || html.trim() === '') {
                throw new Error('HTML content cannot be empty');
            }

            const mailOptions = {
                from: `${this.fromName} <${this.fromEmail}>`,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject,
                html,
            };

            // Only add text if it's a valid string
            if (typeof text === 'string' && text.trim() !== '') {
                mailOptions.text = text;
            }

            console.log('Sending email with Nodemailer:', {
                to: mailOptions.to,
                subject: mailOptions.subject,
                htmlLength: html.length,
                textLength: text?.length || 0
            });

            const response = await mailTransport.sendMail(mailOptions);

            console.log('Nodemailer email sent successfully:', response);
            return response;
        } catch (error) {
            console.error('Nodemailer send failed:', error);
            throw error;
        }
    }

    /**
     * Send a generic email
     * @param {string} to - Recipient email address
     * @param {string} subject - Email subject
     * @param {React.Component} template - React email template
     * @param {Object} templateProps - Props to pass to the template
     * @returns {Promise} Email service response
     */
    async sendEmail(to, subject, template, templateProps = {}) {
        try {
            // Create the React element first
            const reactElement = template(templateProps);

            // Then render it to HTML string
            const html = await render(reactElement);
            const text = await render(reactElement, { plainText: true });

            // Debug logging
            console.log('Rendered HTML type:', typeof html);
            console.log('Rendered HTML length:', html?.length);

            return await this.sendEmailViaNodemailer(to, subject, html, text);
        } catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    }

    /**
     * Send password reset email
     * @param {string} to - Recipient email address
     * @param {string} resetCode - 6-digit reset code
     * @param {string} userDisplayName - User's display name
     * @returns {Promise} Email service response
     */
    async sendPasswordResetEmail(to, resetCode, userDisplayName = null) {
        const { PasswordResetTemplate } = await import('@/emails/PasswordResetTemplate');

        return this.sendEmail(
            to,
            'Password Reset Code',
            PasswordResetTemplate,
            {
                resetCode,
                userDisplayName,
                companyName: this.fromName,
            }
        );
    }

    /**
     * Send welcome email
     * @param {string} to - Recipient email address
     * @param {string} userDisplayName - User's display name
     * @returns {Promise} Email service response
     */
    async sendWelcomeEmail(to, userDisplayName) {
        const { WelcomeTemplate } = await import('@/emails/WelcomeTemplate');

        return this.sendEmail(
            to,
            `Welcome to ${this.fromName}!`,
            WelcomeTemplate,
            {
                userDisplayName,
                companyName: this.fromName,
                loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`,
            }
        );
    }

    /**
     * Send email verification
     * @param {string} to - Recipient email address
     * @param {string} verificationCode - Verification code
     * @param {string} userDisplayName - User's display name
     * @returns {Promise} Email service response
     */
    async sendEmailVerification(to, verificationCode, userDisplayName = null) {
        const { EmailVerificationTemplate } = await import('@/emails/EmailVerificationTemplate');

        return this.sendEmail(
            to,
            'Verify Your Email Address',
            EmailVerificationTemplate,
            {
                verificationCode,
                userDisplayName,
                companyName: this.fromName,
            }
        );
    }

    /**
     * Send order confirmation email (and automatically notify admin)
     * @param {string} to - Recipient email address
     * @param {Object} orderData - Order data object
     * @param {string} orderData.customerName - Customer's name
     * @param {string} orderData.orderId - Order ID
     * @param {string} orderData.orderDate - Order date
     * @param {Array} orderData.items - Array of order items
     * @param {string} orderData.subtotal - Subtotal amount
     * @param {string} orderData.shippingCost - Shipping cost
     * @param {string} orderData.total - Total amount
     * @param {Object} orderData.shippingAddress - Shipping address object
     * @returns {Promise} Email service response (customer email response)
     */
    async sendOrderConfirmationEmail(to, {
        customerName,
        orderId,
        orderDate,
        items,
        subtotal,
        shippingCost,
        total,
        shippingAddress
    }) {
        try {
            const { OrderConfirmationTemplate } = await import('@/emails/OrderConfirmationTemplate');

            // Send customer confirmation email
            const customerEmailResponse = await this.sendEmail(
                to,
                `Order Confirmation #${orderId}`,
                OrderConfirmationTemplate,
                {
                    customerName,
                    orderId,
                    orderDate,
                    items,
                    subtotal: subtotal || '0.00',
                    shippingCost: shippingCost || '0.00',
                    total: parseFloat(total).toFixed(2),
                    shippingAddress: shippingAddress || {},
                    companyName: this.fromName,
                    companyUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                }
            );

            // Also send admin notification (don't await to avoid blocking customer response)
            this.sendAdminNotificationAsync({
                customerEmail: to,
                customerName,
                orderId,
                orderDate,
                items,
                subtotal,
                shippingCost,
                total,
                shippingAddress
            }).catch(error => {
                // Log admin email error but don't fail the customer email
                console.error('Failed to send admin notification for order', orderId, ':', error);
            });

            return customerEmailResponse;

        } catch (error) {
            console.error('Failed to send order confirmation email:', error);
            throw error;
        }
    }

    /**
     * Send admin notification asynchronously (internal method)
     * @param {Object} orderData - Order data object
     */
    async sendAdminNotificationAsync({
                                         customerEmail,
                                         customerName,
                                         orderId,
                                         orderDate,
                                         items,
                                         subtotal,
                                         shippingCost,
                                         total,
                                         shippingAddress
                                     }) {
        try {
            // Get admin email from environment variables
            if (!emailPublic) {
                console.warn('Admin email not configured - skipping admin notification for order', orderId);
                return;
            }

            await this.sendOrderAdminConfirmationEmail(emailPublic, {
                customerEmail,
                customerName,
                orderId,
                orderDate,
                items,
                subtotal,
                shippingCost,
                total,
                shippingAddress
            });

            console.log('Admin notification sent successfully for order:', orderId);
        } catch (error) {
            console.error('Failed to send admin notification:', error);
            throw error;
        }
    }

    /**
     * Send order admin confirmation email
     * @param {string} to - Admin email address
     * @param {Object} orderData - Order data object
     * @param {string} orderData.customerEmail - Customer's email
     * @param {string} orderData.customerName - Customer's name
     * @param {string} orderData.orderId - Order ID
     * @param {string} orderData.orderDate - Order date
     * @param {Array} orderData.items - Array of order items
     * @param {string} orderData.subtotal - Subtotal amount
     * @param {string} orderData.shippingCost - Shipping cost
     * @param {string} orderData.total - Total amount
     * @param {Object} orderData.shippingAddress - Shipping address object
     * @returns {Promise} Email service response
     */
    async sendOrderAdminConfirmationEmail(to, {
        customerEmail,
        customerName,
        orderId,
        orderDate,
        items,
        subtotal,
        shippingCost,
        total,
        shippingAddress
    }) {
        const { OrderAdminConfirmationTemplate } = await import('@/emails/OrderAdminConfirmationTemplate');

        return this.sendEmail(
            to,
            `🔔 Nouvelle Commande #${orderId} - ${customerName} - ${total}€`,
            OrderAdminConfirmationTemplate,
            {
                customerEmail,
                customerName,
                orderId,
                orderDate,
                items,
                subtotal: subtotal || '0.00',
                shippingCost: shippingCost || '0.00',
                total: parseFloat(total).toFixed(2),
                shippingAddress: shippingAddress || {},
                companyName: this.fromName,
                orderSummaryUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/orders/${orderId}`,
            }
        );
    }

    /**
     * Send order update email to customer
     * @param {string} to - Customer email address
     * @param {Object} updateData - Order update data object
     * @param {string} updateData.customerName - Customer's name
     * @param {string} updateData.orderId - Order ID
     * @param {string} updateData.orderDate - Original order date
     * @param {string} updateData.status - Order status (confirmed, processing, in_transit, delivered, cancelled)
     * @param {Array} updateData.items - Array of order items
     * @param {string} updateData.total - Total amount
     * @param {string} [updateData.trackingNumber] - Tracking number (optional)
     * @param {string} [updateData.trackingUrl] - Tracking URL (optional)
     * @param {string} [updateData.estimatedDelivery] - Estimated delivery date (optional)
     * @param {string} [updateData.customMessage] - Custom message from admin (optional)
     * @returns {Promise} Email service response
     */
    async sendOrderUpdateEmail(to, {
        customerName,
        orderId,
        orderDate,
        status,
        items,
        total,
        trackingNumber = null,
        trackingUrl = null,
        estimatedDelivery = null,
        customMessage = null
    }) {
        try {
            const { OrderUpdateTemplate } = await import('@/emails/OrderUpdateTemplate');

            // Validate status
            const validStatuses = ['confirmed', 'processing', 'in_transit', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid order status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
            }

            // Status-specific subject lines
            const subjectMap = {
                confirmed: `✅ Commande confirmée #${orderId}`,
                processing: `📦 Commande en préparation #${orderId}`,
                in_transit: `🚚 Commande expédiée #${orderId}`,
                delivered: `🎉 Commande livrée #${orderId}`,
                cancelled: `❌ Commande annulée #${orderId}`
            };

            const subject = subjectMap[status] || `Mise à jour commande #${orderId}`;

            console.log(`Sending order update email to ${to} for order ${orderId} with status: ${status}`);

            const emailResponse = await this.sendEmail(
                to,
                subject,
                OrderUpdateTemplate,
                {
                    customerName,
                    orderId,
                    orderDate,
                    status,
                    items,
                    total: parseFloat(total).toFixed(2),
                    trackingNumber,
                    trackingUrl,
                    estimatedDelivery,
                    customMessage,
                    companyName: this.fromName,
                    orderUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${orderId}`,
                    supportEmail: process.env.SUPPORT_EMAIL || process.env.NODEMAILER_USER,
                }
            );

            console.log(`Order update email sent successfully for order ${orderId} with status: ${status}`);
            return emailResponse;

        } catch (error) {
            console.error(`Failed to send order update email for order ${orderId}:`, error);
            throw error;
        }
    }

    /**
     * Convenience methods for specific status updates
     */

    /**
     * Send order confirmed email
     * @param {string} to - Customer email address
     * @param {Object} orderData - Order data
     * @returns {Promise} Email service response
     */
    async sendOrderConfirmedEmail(to, orderData) {
        return this.sendOrderUpdateEmail(to, {
            ...orderData,
            status: 'confirmed'
        });
    }

    /**
     * Send order processing email
     * @param {string} to - Customer email address
     * @param {Object} orderData - Order data
     * @returns {Promise} Email service response
     */
    async sendOrderProcessingEmail(to, orderData) {
        return this.sendOrderUpdateEmail(to, {
            ...orderData,
            status: 'processing'
        });
    }

    /**
     * Send order shipped email
     * @param {string} to - Customer email address
     * @param {Object} orderData - Order data (should include trackingNumber and trackingUrl)
     * @returns {Promise} Email service response
     */
    async sendOrderShippedEmail(to, orderData) {
        return this.sendOrderUpdateEmail(to, {
            ...orderData,
            status: 'in_transit'
        });
    }

    /**
     * Send order delivered email
     * @param {string} to - Customer email address
     * @param {Object} orderData - Order data
     * @returns {Promise} Email service response
     */
    async sendOrderDeliveredEmail(to, orderData) {
        return this.sendOrderUpdateEmail(to, {
            ...orderData,
            status: 'delivered'
        });
    }

    /**
     * Send order cancelled email
     * @param {string} to - Customer email address
     * @param {Object} orderData - Order data
     * @returns {Promise} Email service response
     */
    async sendOrderCancelledEmail(to, orderData) {
        return this.sendOrderUpdateEmail(to, {
            ...orderData,
            status: 'cancelled'
        });
    }

    /**
     * Test email connection (useful for debugging)
     * @returns {Promise} Connection test result
     */
    async testConnection() {
        try {
            if (mailTransport) {
                const verified = await mailTransport.verify();
                console.log('Nodemailer connection verified:', verified);
                return { success: true, method: 'nodemailer', verified };
            } else {
                throw new Error('Nodemailer transport not initialized');
            }
        } catch (error) {
            console.error('Email connection test failed:', error);
            return { success: false, method: 'nodemailer', error: error.message };
        }
    }
}

export default new EmailService();

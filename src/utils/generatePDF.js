import { jsPDF } from 'jspdf';

export const generatePDF = (order) => {
    const doc = new jsPDF();

    // Helper function to safely parse JSON strings
    const parseJSON = (jsonString, fallback = {}) => {
        try {
            return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString || fallback;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return fallback;
        }
    };

    // Parse address and items safely
    const address = parseJSON(order.shipping_address, {});
    const items = parseJSON(order.items, []);

    // Helper function to format currency
    const formatCurrency = (amount, currency = 'eur') => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount);
    };

    // Helper function to format date
    const formatDate = (timestamp) => {
        if (!timestamp) return new Date().toLocaleDateString('fr-FR');

        const date = typeof timestamp === 'number'
            ? new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000)
            : new Date(timestamp);

        return date.toLocaleDateString('fr-FR');
    };

    // Company Header
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text("LOST-FOREVER", 20, 25);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text("www.lost-forever.com", 20, 32);
    doc.text("Boutique de vêtements", 20, 37);

    // Header line
    doc.setLineWidth(1);
    doc.line(20, 45, 190, 45);

    // Invoice title and details
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text("FACTURE", 20, 60);

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Facture N° ${order.uid || 'N/A'}`, 20, 72);
    doc.text(`Date: ${formatDate(order.created_at)}`, 20, 80);
    doc.text(`Statut: ${order.status || 'Confirmé'}`, 20, 88);

    // Transaction and payment info
    doc.text(`Transaction: ${order.tx || 'N/A'}`, 20, 96);

    // Payment method on the right
    doc.text(`Mode de paiement: ${order.method === 'card' ? 'Carte bancaire' : order.method || 'N/A'}`, 120, 72);
    if (order.tracking) {
        doc.text(`Suivi: ${order.tracking}`, 120, 80);
    }

    // Customer Information
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("INFORMATIONS CLIENT", 20, 115);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let yPos = 125;
    doc.text(`Nom: ${order.cst_name || 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Email: ${order.cst_email || 'N/A'}`, 20, yPos);
    yPos += 7;

    if (address.phone) {
        doc.text(`Téléphone: ${address.phone}`, 20, yPos);
        yPos += 7;
    }

    // Shipping Information
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("ADRESSE DE LIVRAISON", 120, 115);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    let yPosRight = 125;
    doc.text(`Nom: ${address.name || order.cst_name || 'N/A'}`, 120, yPosRight);
    yPosRight += 7;

    if (address.street) {
        doc.text(`Adresse: ${address.street}`, 120, yPosRight);
        yPosRight += 7;
    }
    if (address.apartment) {
        doc.text(`Complément: ${address.apartment}`, 120, yPosRight);
        yPosRight += 7;
    }
    if (address.zip || address.city) {
        doc.text(`${address.zip || ''} ${address.city || ''}`, 120, yPosRight);
        yPosRight += 7;
    }
    if (address.state) {
        doc.text(`Région: ${address.state}`, 120, yPosRight);
        yPosRight += 7;
    }
    if (address.country) {
        doc.text(`Pays: ${address.country}`, 120, yPosRight);
        yPosRight += 7;
    }

    // Delivery notes if present
    if (order.delivery_notes) {
        yPosRight += 3;
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        doc.text(`Notes: ${order.delivery_notes}`, 120, yPosRight);
        yPosRight += 7;
    }

    // Items section - start after the tallest column
    let itemsStartY = Math.max(yPos, yPosRight) + 15;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("DÉTAIL DE LA COMMANDE", 20, itemsStartY);
    itemsStartY += 15;

    // Table headers
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text("ARTICLE", 20, itemsStartY);
    doc.text("QTÉ", 110, itemsStartY);
    doc.text("PRIX U.", 130, itemsStartY);
    doc.text("TOTAL", 165, itemsStartY);
    itemsStartY += 5;

    // Header line
    doc.setLineWidth(0.5);
    doc.line(20, itemsStartY, 190, itemsStartY);
    itemsStartY += 10;

    // Items
    doc.setFont(undefined, 'normal');
    let calculatedSubtotal = 0;

    if (items && items.length > 0) {
        items.forEach(item => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseInt(item.quantity) || 1;
            const itemTotal = itemPrice * itemQuantity;
            calculatedSubtotal += itemTotal;

            // Handle long product names
            const productName = item.name || 'Produit';
            const maxNameLength = 35;
            const displayName = productName.length > maxNameLength
                ? productName.substring(0, maxNameLength - 3) + '...'
                : productName;

            doc.text(displayName, 20, itemsStartY);
            doc.text(`${itemQuantity}`, 110, itemsStartY);
            doc.text(formatCurrency(itemPrice), 130, itemsStartY);
            doc.text(formatCurrency(itemTotal), 165, itemsStartY);

            // Add size or SKU info if available
            if (item.size || item.sku) {
                itemsStartY += 6;
                doc.setFontSize(8);
                doc.setFont(undefined, 'italic');
                const itemDetails = [];
                if (item.size) itemDetails.push(`Taille: ${item.size}`);
                if (item.sku) itemDetails.push(`SKU: ${item.sku}`);
                doc.text(itemDetails.join(' | '), 25, itemsStartY);
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
            }

            itemsStartY += 12;
        });
    } else {
        doc.text("Aucun article trouvé", 20, itemsStartY);
        itemsStartY += 12;
    }

    // Totals section
    itemsStartY += 10;
    doc.setLineWidth(0.5);
    doc.line(120, itemsStartY, 190, itemsStartY);
    itemsStartY += 12;

    // Calculate costs
    const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : parseFloat(order.subtotal || order.amount || 0);
    const shippingCost = parseFloat(order.shipping || 5.99);
    const totalAmount = parseFloat(order.amount || (subtotal + shippingCost));

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    // Subtotal
    doc.text(`Sous-total:`, 130, itemsStartY);
    doc.text(formatCurrency(subtotal), 165, itemsStartY);
    itemsStartY += 8;

    // Shipping
    doc.text(`Frais de port:`, 130, itemsStartY);
    doc.text(formatCurrency(shippingCost), 165, itemsStartY);
    itemsStartY += 8;

    // VAT note
    doc.text(`TVA (20%):`, 130, itemsStartY);
    doc.text(`Incluse`, 165, itemsStartY);
    itemsStartY += 12;

    // Total line
    doc.setLineWidth(0.8);
    doc.line(130, itemsStartY, 190, itemsStartY);
    itemsStartY += 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL:`, 130, itemsStartY);
    doc.text(formatCurrency(totalAmount), 165, itemsStartY);

    // Footer section
    itemsStartY += 25;

    // Thank you message
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Merci pour votre commande !`, 20, itemsStartY);
    itemsStartY += 8;

    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text(`Commande ID: ${order.uid}`, 20, itemsStartY);
    if (order.ref) {
        itemsStartY += 6;
        doc.text(`Référence: ${order.ref}`, 20, itemsStartY);
    }

    // Company footer
    itemsStartY += 20;

    // Add a footer line if there's space
    if (itemsStartY < 270) {
        doc.setLineWidth(0.5);
        doc.line(20, itemsStartY, 190, itemsStartY);
        itemsStartY += 8;
    }

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`Lost-Forever - Boutique en ligne de vêtements`, 20, itemsStartY);
    itemsStartY += 5;
    doc.text(`Pour toute question, contactez-nous à: contact@lost-forever.com`, 20, itemsStartY);

    // Add creation date
    itemsStartY += 5;
    doc.text(`Document généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, itemsStartY);

    // Save the PDF with a more descriptive filename
    const fileName = `facture-${order.uid}-${formatDate(order.created_at).replace(/\//g, '-')}.pdf`;
    doc.save(fileName);

    return fileName; // Return the filename for confirmation
};

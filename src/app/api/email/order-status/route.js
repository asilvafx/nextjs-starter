import { NextResponse } from "next/server";
import { Resend } from "resend";
import { OrderStatusUpdateTemplate } from "@/emails/OrderStatusUpdateTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, email, name, orderId, status, items, total } = body;

    if (type === 'order_status_update') {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Order Status Update - ${orderId}`,
        react: OrderStatusUpdateTemplate({
          customerName: name,
          orderId,
          status,
          items,
          total
        })
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
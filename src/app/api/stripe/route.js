import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SK);

export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}

export async function POST(req) {
    try {
        const { amount, currency = "usd", email = "", automatic_payment_methods } =
            await req.json();

        if (!amount || amount <= 0) {
            return new Response(JSON.stringify({ error: "Invalid amount" }), {
                status: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
            });
        }

        if (!email) {
            return new Response(JSON.stringify({ error: "Email is required" }), {
                status: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
            });
        }

        const customer = await stripe.customers.create({
            email,
            description: `Customer for ${email}`,
        });

        const paymentIntentParams = {
            amount: parseInt(amount),
            currency,
            customer: customer.id,
            metadata: { customer_email: email },
        };

        if (automatic_payment_methods) {
            paymentIntentParams.automatic_payment_methods = { enabled: true };
        } else {
            paymentIntentParams.payment_method_types = ["card"];
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

        return new Response(
            JSON.stringify({
                client_secret: paymentIntent.client_secret,
                customer_id: customer.id,
                payment_intent_id: paymentIntent.id,
            }),
            {
                status: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
            }
        );
    } catch (err) {
        console.error("Stripe Error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: err.statusCode || 500,
            headers: { "Access-Control-Allow-Origin": "*" },
        });
    }
}

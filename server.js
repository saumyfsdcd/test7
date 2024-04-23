// server.js
const emailjs = import('emailjs')

require('dotenv').config({ path: './.env' });
const exp = require('constants');
const express = require('express');
const { url } = require('inspector');
const path = require('path');

const app = express();
const stripe = require("stripe")(process.env.STRIPE_PRIVATE)
const PORT = process.env.PORT || 4000;
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));
express.urlencoded({extended: true})

// Define routes
app.get('/', (req, res) => {
    console.log("node js is runnign")
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/co', (req,res)=>{
    res.send("hey wrlcome")
})

const storeitems= [
    [1, {price: 19900, name: "Personal Use"}],
    [2, {price: 24900, name: "Proffesional"}],
    [3, {price: 29900, name: "ecommerce"}],
    [4, {price: 8900, name: "Logo Design"}],
    [5, {price: 18900, name: "Brand Design"}],
    [6, {price: 27900, name: "Corporate Design"}]
];

app.post('/create-checkout-session', async (req, res) => {
    
    
    const domainURL = "https://mideacreative.com";

    const quantity = 1;

    // Create new Checkout Session for the order
    // Other optional params include:
    // [billing_address_collection] - to display billing address details on the page
    // [customer] - if you have an existing Stripe Customer ID
    // [customer_email] - lets you prefill the email input in the Checkout page
    // [automatic_tax] - to automatically calculate sales tax, VAT and GST in the checkout page
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    var ses_id=req.headers.id;
    var quanttity=req.headers.quantity;
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
            quantity: quanttity,
            price_data: {
                currency: 'usd',
                product_data: {
                    name: storeitems[ses_id][1].name
                },
                unit_amount: storeitems[ses_id][1].price
            }
        }],
        // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
        success_url: `${domainURL}/index.html`,
        cancel_url: `${domainURL}/refund.html`,
        // automatic_tax: {enabled: true},
    });

    // return res.json({ url: session.url });
    return res.send("found")
});


app.get("/stripe-session", async (req, res) => {
    console.log("req.body: ", req.body);
    const { userId } = req.body;
    console.log("userId: ", userId);

    const db = req.app.get('db');

    // get user from you database
    const user = {
        stripe_session_id: "asdfpouhwf;ljnqwfpqo",
        paid_sub: false
    }

    if (!user.stripe_session_id || user.paid_sub === true)
        return res.send("fail");

    try {
        // check session
        const session = await stripe.checkout.sessions.retrieve(user.stripe_session_id);
        console.log("session: ", session);

        // const sessionResult = {
        //   id: 'cs_test_a1lpAti8opdtSIDZQIh9NZ6YhqMMwC0H5wrlwkUEYJc6GXokj2g5WyHkv4',
        //   …
        //   customer: 'cus_PD6t4AmeZrJ8zq',
        //   …
        //   status: 'complete',
        //   …
        //   subscription: 'sub_1OOgfhAikiJrlpwD7EQ5TLea',
        //  …
        // }


        // update the user
        if (session && session.status === "complete") {
            let updatedUser = await db.update_user_stripe(
                userId,
                true
            );
            updatedUser = updatedUser[0];
            console.log(updatedUser);

            return res.send("success");
        } else {
            return res.send("fail");
        }
    } catch (error) {
        // handle the error
        console.error("An error occurred while retrieving the Stripe session:", error);
        return res.send("fail");
    }
})


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

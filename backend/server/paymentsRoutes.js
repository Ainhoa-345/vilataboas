import express from 'express'
import Stripe from 'stripe'
const router = express.Router()

// use STRIPE_API_KEY from env
const stripeKey = process.env.STRIPE_API_KEY
if (!stripeKey) console.warn('STRIPE_API_KEY not set in environment')
const stripe = new Stripe(stripeKey)

// Create a Checkout Session using the amount passed from the frontend.
// Expects body: { amount: <number in EUR, e.g. 123.45>, description?: string }
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, description } = req.body
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const amountCents = Math.round(Number(amount) * 100)

    // Build a minimal checkout session with a single line item for the total amount.
    // In a real shop you'd send the itemized cart and create price_data per item.
    const YOUR_DOMAIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: description || 'Compra Vilataboas',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${YOUR_DOMAIN}/factura?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/cesta`,
    })

    return res.json({ url: session.url })
  } catch (err) {
    console.error('create-checkout-session error', err)
    return res.status(500).json({ error: 'No se pudo crear la sesión de pago' })
  }
})

// Health / quick check route to ensure the router is mounted and reachable
router.get('/', (req, res) => {
  res.json({ ok: true, msg: 'payments route OK' })
})

// GET: Retrieve a Checkout Session (used after Stripe redirects back with session_id)
// Query: ?session_id=<CHECKOUT_SESSION_ID>
router.get('/session', async (req, res) => {
  try {
    const sessionId = req.query.session_id || req.query.sessionId || req.query.id
    if (!sessionId) return res.status(400).json({ error: 'Missing session_id query param' })

    if (!stripe) return res.status(500).json({ error: 'Stripe not configured on server' })

    // Retrieve the session and expand payment_intent to get a stable reference
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })

    // Determine a friendly payment method for the frontend
    const metodo = 'tarjeta' // checkout is configured with payment_method_types: ['card']
    const referencia = (session.payment_intent && session.payment_intent.id) ? session.payment_intent.id : session.id

    return res.json({ ok: true, metodo, referencia, status: session.payment_status || (session.payment_intent && session.payment_intent.status) || 'unknown' })
  } catch (err) {
    console.error('Error retrieving stripe session', err)
    return res.status(500).json({ error: 'Could not retrieve session', details: err.message || err })
  }
})

// Alternate route that accepts the session id as a path parameter (useful in some dev setups)
router.get('/session/:id', async (req, res) => {
  try{
    const sessionId = req.params.id
    if (!sessionId) return res.status(400).json({ error: 'Missing session id param' })
    console.log('paymentsRoutes: retrieving session by path param', sessionId)
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured on server' })
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })
    const metodo = 'tarjeta'
    const referencia = (session.payment_intent && session.payment_intent.id) ? session.payment_intent.id : session.id
    return res.json({ ok: true, metodo, referencia, status: session.payment_status || (session.payment_intent && session.payment_intent.status) || 'unknown' })
  }catch(err){
    console.error('Error retrieving stripe session (path param)', err)
    return res.status(500).json({ error: 'Could not retrieve session', details: err.message || err })
  }
})

export default router

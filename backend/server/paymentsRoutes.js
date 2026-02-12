import express from 'express'
import Stripe from 'stripe'
const router = express.Router()

// Usar STRIPE_API_KEY desde las variables de entorno
const stripeKey = process.env.STRIPE_API_KEY
if (!stripeKey) console.warn('STRIPE_API_KEY no está configurada en las variables de entorno')
const stripe = new Stripe(stripeKey)

// Crear una sesión de Checkout usando el monto pasado desde el frontend.
// Espera body: { amount: <número en EUR, ej. 123.45>, description?: string }
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, description } = req.body
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Monto inválido' })
    }

    const amountCents = Math.round(Number(amount) * 100)

    // Construir una sesión de checkout mínima con un solo artículo por el monto total.
    // En una tienda real enviarías el carrito detallado y crearías price_data por cada artículo.
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
    console.error('Error en create-checkout-session', err)
    return res.status(500).json({ error: 'No se pudo crear la sesión de pago' })
  }
})

// Ruta de verificación rápida para asegurar que el router está montado y accesible
router.get('/', (req, res) => {
  res.json({ ok: true, msg: 'Ruta de pagos OK' })
})

// GET: Recuperar una sesión de Checkout (usada después de que Stripe redirige con session_id)
// Query: ?session_id=<CHECKOUT_SESSION_ID>
router.get('/session', async (req, res) => {
  try {
    const sessionId = req.query.session_id || req.query.sessionId || req.query.id
    if (!sessionId) return res.status(400).json({ error: 'Falta el parámetro session_id' })

    if (!stripe) return res.status(500).json({ error: 'Stripe no está configurado en el servidor' })

    // Recuperar la sesión y expandir payment_intent para obtener una referencia estable
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })

    // Determinar un método de pago amigable para el frontend
    const metodo = 'tarjeta' // checkout está configurado con payment_method_types: ['card']
    const referencia = (session.payment_intent && session.payment_intent.id) ? session.payment_intent.id : session.id

    return res.json({ ok: true, metodo, referencia, status: session.payment_status || (session.payment_intent && session.payment_intent.status) || 'desconocido' })
  } catch (err) {
    console.error('Error recuperando sesión de stripe', err)
    return res.status(500).json({ error: 'No se pudo recuperar la sesión', details: err.message || err })
  }
})

// Ruta alternativa que acepta el id de sesión como parámetro de ruta (útil en algunas configuraciones de desarrollo)
router.get('/session/:id', async (req, res) => {
  try{
    const sessionId = req.params.id
    if (!sessionId) return res.status(400).json({ error: 'Falta el parámetro id de sesión' })
    console.log('paymentsRoutes: recuperando sesión por parámetro de ruta', sessionId)
    if (!stripe) return res.status(500).json({ error: 'Stripe no está configurado en el servidor' })
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] })
    const metodo = 'tarjeta'
    const referencia = (session.payment_intent && session.payment_intent.id) ? session.payment_intent.id : session.id
    return res.json({ ok: true, metodo, referencia, status: session.payment_status || (session.payment_intent && session.payment_intent.status) || 'desconocido' })
  }catch(err){
    console.error('Error recuperando sesión de stripe (parámetro de ruta)', err)
    return res.status(500).json({ error: 'No se pudo recuperar la sesión', details: err.message || err })
  }
})

export default router

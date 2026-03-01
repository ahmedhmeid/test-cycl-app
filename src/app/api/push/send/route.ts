// [CYCL:2e0ff9ca] Internal API route to send push notifications to users, protected by INTERNAL_API_SECRET
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/push'
import webPush from 'web-push'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const body = await request.json()
  const { userId, title, body: msgBody, url } = body

  if (!userId || !title) {
    return NextResponse.json({ error: 'Missing userId or title' }, { status: 400 })
  }

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const payload = { title, body: msgBody, url: url ?? '/' }
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSub: webPush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }
      return sendPushNotification(pushSub, payload)
    })
  )

  // Remove stale subscriptions (gone/expired endpoints)
  const staleEndpoints: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const err = result.reason as { statusCode?: number }
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        staleEndpoints.push(subscriptions[i].endpoint)
      }
    }
  })

  if (staleEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints)
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ sent })
}

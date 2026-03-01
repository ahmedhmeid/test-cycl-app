// [CYCL:2e0ff9ca] Initialize web-push with VAPID keys and provide sendPushNotification utility
import webPush from 'web-push'

let vapidInitialized = false

function ensureVapid() {
  if (vapidInitialized) return
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  vapidInitialized = true
}

export async function sendPushNotification(
  subscription: webPush.PushSubscription,
  payload: object
) {
  ensureVapid()
  return webPush.sendNotification(subscription, JSON.stringify(payload))
}

export { webPush }
